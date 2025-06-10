
import { spawn } from 'child_process';
import { CLIP_CONFIG } from './config';
import { timeToSeconds } from '../utils';

/**
 * 썸네일 생성 전용 서비스
 */
export class ThumbnailService {
  /**
   * 비디오 썸네일 생성
   * @param mediaFile 소스 미디어 파일 경로
   * @param timeStr 썸네일 추출 시간 (HH:MM:SS,mmm 형식)
   * @param thumbnailPath 썸네일 출력 경로
   * @returns 성공 여부
   */
  static async createThumbnail(
    mediaFile: string, 
    timeStr: string, 
    thumbnailPath: string
  ): Promise<boolean> {
    const seconds = timeToSeconds(timeStr);

    console.log(`🖼️ 썸네일 생성 시작:`);
    console.log(`   입력: ${mediaFile}`);
    console.log(`   시간: ${seconds}초`);
    console.log(`   출력: ${thumbnailPath}`);

    return this.executeFFmpegThumbnail(mediaFile, seconds, thumbnailPath);
  }

  /**
   * FFmpeg 썸네일 생성 실행
   */
  private static executeFFmpegThumbnail(
    mediaFile: string,
    seconds: number,
    thumbnailPath: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      // 타임아웃 설정
      const timeout = setTimeout(() => {
        console.log(`⏰ 썸네일 생성 타임아웃 (${CLIP_CONFIG.BATCH_CONFIG.THUMBNAIL_TIMEOUT/1000}초)`);
        ffmpeg.kill('SIGKILL');
        resolve(false);
      }, CLIP_CONFIG.BATCH_CONFIG.THUMBNAIL_TIMEOUT);

      // FFmpeg 프로세스 시작
      const ffmpeg = spawn('ffmpeg', [
        '-i', mediaFile,
        '-ss', seconds.toString(),
        ...CLIP_CONFIG.FFMPEG.THUMBNAIL_OPTIONS,
        thumbnailPath
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      let stdout = '';
      let lastProgressTime = Date.now();

      // 표준 출력 처리
      ffmpeg.stdout?.on('data', (data) => {
        stdout += data.toString();
        lastProgressTime = Date.now();
      });

      // 에러 출력 및 진행 상황 처리
      ffmpeg.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        lastProgressTime = Date.now();

        // 진행 상황 로그
        this.logThumbnailProgress(chunk);
      });

      // 무응답 감지
      const progressMonitor = setInterval(() => {
        const timeSinceLastProgress = Date.now() - lastProgressTime;
        const totalTime = Date.now() - startTime;
        
        if (timeSinceLastProgress > 10000) {
          console.log(`⚠️ 썸네일 생성 진행 정지 감지 (${timeSinceLastProgress/1000}초 무응답)`);
          console.log(`📊 총 경과 시간: ${totalTime/1000}초`);
        }
      }, 5000);

      // 프로세스 완료 처리
      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime;
        this.logThumbnailResult(code ?? -1, totalTime, thumbnailPath, mediaFile, stderr, stdout);
        resolve(code === 0);
      });

      // 에러 처리
      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime;
        console.log(`❌ 썸네일 생성 프로세스 오류 (${totalTime/1000}초): ${error}`);
        console.log(`📁 오류 발생 파일: ${mediaFile}`);
        resolve(false);
      });
    });
  }

  /**
   * 썸네일 진행 상황 로그
   */
  private static logThumbnailProgress(chunk: string): void {
    if (chunk.includes('frame=')) {
      console.log(`🖼️ 썸네일 진행 중: ${chunk.trim()}`);
    }
  }

  /**
   * 썸네일 생성 결과 로그
   */
  private static logThumbnailResult(
    code: number,
    totalTime: number,
    thumbnailPath: string,
    mediaFile: string,
    stderr: string,
    stdout: string
  ): void {
    if (code === 0) {
      console.log(`✅ 썸네일 생성 성공 (소요시간: ${totalTime/1000}초)`);
      console.log(`📁 썸네일 파일: ${thumbnailPath}`);
    } else {
      console.log(`❌ 썸네일 생성 실패 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
      console.log(`📁 실패 파일: ${mediaFile}`);
      console.log(`📝 오류 로그: ${stderr.slice(-500)}`);
      if (stdout) {
        console.log(`📝 출력 로그: ${stdout.slice(-300)}`);
      }
    }
  }

  /**
   * 썸네일 품질 검증
   * @param thumbnailPath 생성된 썸네일 경로
   * @returns 품질 검증 결과
   */
  static async validateThumbnail(thumbnailPath: string): Promise<{
    isValid: boolean;
    size?: number;
    error?: string;
  }> {
    try {
      const fs = await import('fs');
      const stats = await fs.promises.stat(thumbnailPath);
      
      if (stats.size === 0) {
        return { isValid: false, error: '썸네일 파일이 비어있음' };
      }
      
      if (stats.size < 1024) { // 1KB 미만
        return { isValid: false, size: stats.size, error: '썸네일 파일이 너무 작음' };
      }

      return { isValid: true, size: stats.size };
    } catch (error) {
      return { isValid: false, error: `파일 검증 실패: ${error}` };
    }
  }
}
