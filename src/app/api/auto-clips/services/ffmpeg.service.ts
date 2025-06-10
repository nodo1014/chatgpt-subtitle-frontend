import { spawn } from 'child_process';
import { CLIP_CONFIG } from './config';
import { timeToSeconds, isBlacklistedFile, checkFileSize } from '../utils';

// FFmpeg 클립 생성 서비스
export class FFmpegService {
  // 클립 생성 (최적화된 설정)
  static async createClip(
    mediaFile: string, 
    startTime: string, 
    endTime: string, 
    outputPath: string
  ): Promise<boolean> {
    // 사전 체크: 블랙리스트 및 파일 크기
    if (isBlacklistedFile(mediaFile)) {
      return false;
    }
    
    if (!checkFileSize(mediaFile)) {
      return false;
    }
    
    return new Promise((resolve) => {
      const startSeconds = timeToSeconds(startTime);
      const endSeconds = timeToSeconds(endTime);
      const duration = endSeconds - startSeconds;
      
      console.log(`🔧 FFmpeg 클립 생성:`);
      console.log(`   입력: ${mediaFile}`);
      console.log(`   시작: ${startSeconds}초, 길이: ${duration}초`);
      console.log(`   출력: ${outputPath}`);
      
      const startTime_process = Date.now();
      
      // 타임아웃 설정
      const timeout = setTimeout(() => {
        console.log(`⏰ 클립 FFmpeg 타임아웃 (${CLIP_CONFIG.BATCH_CONFIG.CLIP_TIMEOUT/1000}초) - 강제 종료: ${mediaFile}`);
        ffmpeg.kill('SIGKILL');
        resolve(false);
      }, CLIP_CONFIG.BATCH_CONFIG.CLIP_TIMEOUT);
      
      // FFmpeg 명령어 실행 (최적화: -ss를 -i 앞으로 이동)
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
      
      ffmpeg.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        lastProgressTime = Date.now();
        
        // 진행률 정보 추출 및 출력
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
      });
      
      // 진행 상황 모니터링 (10초마다 체크)
      const progressMonitor = setInterval(() => {
        const timeSinceLastProgress = Date.now() - lastProgressTime;
        const totalTime = Date.now() - startTime_process;
        
        if (timeSinceLastProgress > 15000) {
          console.log(`⚠️ 클립 FFmpeg 진행 정지 감지 (${timeSinceLastProgress/1000}초 무응답)`);
          console.log(`📊 총 경과 시간: ${totalTime/1000}초`);
          console.log(`📁 처리 중인 파일: ${mediaFile}`);
        }
      }, 10000);
      
      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime_process;
        
        if (code === 0) {
          console.log(`✅ 클립 FFmpeg 성공 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
          console.log(`📁 클립 파일 생성: ${outputPath}`);
        } else {
          console.log(`❌ 클립 FFmpeg 실패 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
          console.log(`📁 실패한 파일: ${mediaFile}`);
          console.log(`📝 stderr (마지막 500자): ${stderr.slice(-500)}`);
        }
        resolve(code === 0);
      });
      
      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime_process;
        console.log(`❌ 클립 FFmpeg 프로세스 오류 (소요시간: ${totalTime/1000}초): ${error}`);
        console.log(`📁 오류 발생 파일: ${mediaFile}`);
        resolve(false);
      });
    });
  }

  // 썸네일 생성 (밝기 및 대비 향상)
  static async createThumbnail(
    mediaFile: string, 
    timeStr: string, 
    thumbnailPath: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const seconds = timeToSeconds(timeStr);
      
      console.log(`🖼️ 썸네일 FFmpeg 명령어 실행:`);
      console.log(`   입력: ${mediaFile}`);
      console.log(`   시간: ${seconds}초`);
      console.log(`   출력: ${thumbnailPath}`);
      
      const startTime_process = Date.now();
      
      // 타임아웃 설정
      const timeout = setTimeout(() => {
        console.log(`⏰ 썸네일 FFmpeg 타임아웃 (${CLIP_CONFIG.BATCH_CONFIG.THUMBNAIL_TIMEOUT/1000}초) - 강제 종료: ${mediaFile}`);
        ffmpeg.kill('SIGKILL');
        resolve(false);
      }, CLIP_CONFIG.BATCH_CONFIG.THUMBNAIL_TIMEOUT);
      
      // FFmpeg 명령어 실행 (최적화: -ss를 -i 앞으로 이동)
      const ffmpeg = spawn('ffmpeg', [
        '-ss', seconds.toString(),  // 🔥 입력 전 시크로 성능 대폭 향상
        '-i', mediaFile,
        ...CLIP_CONFIG.FFMPEG.THUMBNAIL_OPTIONS,
        thumbnailPath
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stderr = '';
      let stdout = '';
      let lastProgressTime = Date.now();
      
      ffmpeg.stdout?.on('data', (data) => {
        stdout += data.toString();
        lastProgressTime = Date.now();
      });
      
      ffmpeg.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        lastProgressTime = Date.now();
        
        // 썸네일 진행률 로그
        if (chunk.includes('frame=')) {
          console.log(`🖼️ 썸네일 진행 중: ${chunk.trim()}`);
        }
      });
      
      // 진행 상황 모니터링 (5초마다 체크)
      const progressMonitor = setInterval(() => {
        const timeSinceLastProgress = Date.now() - lastProgressTime;
        const totalTime = Date.now() - startTime_process;
        
        if (timeSinceLastProgress > 10000) {
          console.log(`⚠️ 썸네일 FFmpeg 진행 정지 감지 (${timeSinceLastProgress/1000}초 무응답)`);
          console.log(`📊 총 경과 시간: ${totalTime/1000}초`);
          console.log(`📁 처리 중인 파일: ${mediaFile}`);
        }
      }, 5000);
      
      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime_process;
        
        if (code === 0) {
          console.log(`✅ 썸네일 FFmpeg 성공 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
          console.log(`📁 썸네일 파일 생성: ${thumbnailPath}`);
        } else {
          console.log(`❌ 썸네일 FFmpeg 실패 (코드: ${code}, 소요시간: ${totalTime/1000}초)`);
          console.log(`📁 실패한 파일: ${mediaFile}`);
          console.log(`📝 stderr (마지막 500자): ${stderr.slice(-500)}`);
          console.log(`📝 stdout (마지막 300자): ${stdout.slice(-300)}`);
        }
        resolve(code === 0);
      });
      
      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        clearInterval(progressMonitor);
        
        const totalTime = Date.now() - startTime_process;
        console.log(`❌ 썸네일 FFmpeg 프로세스 오류 (소요시간: ${totalTime/1000}초): ${error}`);
        console.log(`📁 오류 발생 파일: ${mediaFile}`);
        resolve(false);
      });
    });
  }
}
