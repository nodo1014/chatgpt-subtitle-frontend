
import { spawn } from 'child_process';
import { CLIP_CONFIG } from './config';
import { timeToSeconds, isBlacklistedFile, checkFileSize } from '../utils';

/**
 * 클립 생성 전용 서비스
 */
export class ClipService {
  /**
   * 비디오 클립 생성
   * @param mediaFile 소스 미디어 파일 경로
   * @param startTime 시작 시간 (HH:MM:SS,mmm 형식)
   * @param endTime 종료 시간 (HH:MM:SS,mmm 형식)
   * @param outputPath 출력 파일 경로
   * @returns 성공 여부
   */
  static async createClip(
    mediaFile: string, 
    startTime: string, 
    endTime: string, 
    outputPath: string
  ): Promise<boolean> {
    // 사전 검증
    if (!this.validateInputs(mediaFile, startTime, endTime, outputPath)) {
      return false;
    }

    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    const duration = endSeconds - startSeconds;

    console.log(`🎬 클립 생성 시작:`);
    console.log(`   입력: ${mediaFile}`);
    console.log(`   시간: ${startSeconds}초 ~ ${endSeconds}초 (${duration}초)`);
    console.log(`   출력: ${outputPath}`);

    return this.executeFFmpegClip(mediaFile, startSeconds, duration, outputPath);
  }

  /**
   * 입력 값 검증
   */
  private static validateInputs(
    mediaFile: string, 
    startTime: string, 
    endTime: string, 
    _outputPath: string
  ): boolean {
    // 블랙리스트 확인
    if (isBlacklistedFile(mediaFile)) {
      console.log(`⚠️ 블랙리스트 파일 스킵: ${mediaFile}`);
      return false;
    }
    
    // 파일 크기 확인
    if (!checkFileSize(mediaFile)) {
      console.log(`⚠️ 파일 크기 초과: ${mediaFile}`);
      return false;
    }

    // 시간 유효성 확인
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    
    if (startSeconds >= endSeconds) {
      console.log(`⚠️ 시간 범위 오류: 시작(${startSeconds}) >= 종료(${endSeconds})`);
      return false;
    }

    if (endSeconds - startSeconds > CLIP_CONFIG.MAX_CLIP_DURATION) {
      console.log(`⚠️ 클립 길이 초과: ${endSeconds - startSeconds}초 > ${CLIP_CONFIG.MAX_CLIP_DURATION}초`);
      return false;
    }

    return true;
  }

  /**
   * FFmpeg 클립 생성 실행
   */
  private static executeFFmpegClip(
    mediaFile: string,
    startSeconds: number,
    duration: number,
    outputPath: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // 타임아웃 설정
      const timeout = setTimeout(() => {
        console.log(`⏰ 클립 생성 타임아웃 (${CLIP_CONFIG.BATCH_CONFIG.CLIP_TIMEOUT/1000}초)`);
        ffmpeg.kill('SIGKILL');
        resolve(false);
      }, CLIP_CONFIG.BATCH_CONFIG.CLIP_TIMEOUT);

      // FFmpeg 프로세스 시작 (최적화: -ss를 -i 앞으로 이동)
      const ffmpeg = spawn('ffmpeg', [
        '-ss', startSeconds.toString(),  // 🔥 입력 전 시크로 성능 대폭 향상
        '-i', mediaFile,
        '-t', duration.toString(),
        ...CLIP_CONFIG.FFMPEG.CLIP_OPTIONS,
        outputPath
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      let lastProgressTime = Date.now();

      // 진행 상황 모니터링
      ffmpeg.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        lastProgressTime = Date.now();

        // 진행률 출력
        this.logProgress(chunk, duration);
      });

      // 무응답 감지
      const progressMonitor = setInterval(() => {
        const timeSinceLastProgress = Date.now() - lastProgressTime;
        if (timeSinceLastProgress > 15000) {
          console.log(`⚠️ 클립 생성 진행 정지 감지 (${timeSinceLastProgress/1000}초 무응답)`);
        }
      }, 10000);

      // 프로세스 완료 처리
      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime;
        this.logResult(code ?? -1, totalTime, outputPath, mediaFile, stderr);
        resolve(code === 0);
      });

      // 에러 처리
      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime;
        console.log(`❌ 클립 생성 프로세스 오류 (${totalTime/1000}초): ${error}`);
        resolve(false);
      });
    });
  }

  /**
   * 진행률 로그 출력
   */
  private static logProgress(chunk: string, duration: number): void {
    if (chunk.includes('time=')) {
      const timeMatch = chunk.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(100, Math.round((currentTime / duration) * 100));
        console.log(`🎬 클립 진행률: ${progress}% (${currentTime}/${duration}초)`);
      }
    }
  }

  /**
   * 결과 로그 출력
   */
  private static logResult(
    code: number, 
    totalTime: number, 
    outputPath: string, 
    mediaFile: string, 
    stderr: string
  ): void {
    if (code === 0) {
      console.log(`✅ 클립 생성 성공 (소요시간: ${totalTime/1000}초)`);
      console.log(`📁 클립 파일: ${outputPath}`);
    } else {
      console.log(`❌ 클립 생성 실패 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
      console.log(`📁 실패 파일: ${mediaFile}`);
      console.log(`📝 오류 로그: ${stderr.slice(-500)}`);
    }
  }
}
