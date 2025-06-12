// filepath: /home/kang/docker/youtube/indexer/indexer_v3/theme-search/src/lib/ffmpeg-engine.ts
// FFmpeg 렌더링 엔진 - 메인 인터페이스
// 분리된 모듈들을 통합하는 메인 클래스

import path from 'path';
import { RenderOptions, RenderProgress, RenderResult } from './ffmpeg/types';
import { FFmpegCommandBuilder } from './ffmpeg/command-builder';
import { FFmpegExecutor } from './ffmpeg/executor';
import { FileUtils } from './ffmpeg/file-utils';

export * from './ffmpeg/types';

export class FFmpegEngine {
  /**
   * 렌더링 작업 시작
   */
  static async startRender(
    options: RenderOptions, 
    onProgress?: (progress: RenderProgress) => void
  ): Promise<RenderResult> {
    const jobId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // 1. 디렉토리 준비
      await FileUtils.ensureDirectory(FileUtils.CLIPS_DIR);
      await FileUtils.ensureDirectory(FileUtils.TEMP_DIR);
      
      // 2. 입력 파일 확인
      const inputPath = path.join(FileUtils.CLIPS_DIR, `${options.clipId}.mp4`);
      const inputExists = await FileUtils.fileExists(inputPath);
      
      if (!inputExists) {
        throw new Error(`입력 클립을 찾을 수 없습니다: ${options.clipId}`);
      }

      onProgress?.({
        stage: 'preparing',
        progress: 10,
        timeElapsed: Date.now() - startTime,
        currentOperation: 'FFmpeg 명령어 생성 중...'
      });

      // 3. 출력 파일 경로
      const outputPath = path.join(FileUtils.OUTPUT_DIR, `${jobId}.${options.outputFormat}`);

      // 4. FFmpeg 명령어 생성
      const command = FFmpegCommandBuilder.buildCommand(inputPath, outputPath, options);
      
      console.log(`🎬 렌더링 시작:`, {
        jobId,
        pattern: options.pattern,
        quality: options.quality,
        aspectRatio: options.aspectRatio,
        textOverlay: !!options.textOverlay,
        command: command.slice(0, 3).join(' ') + '...'
      });

      onProgress?.({
        stage: 'preparing',
        progress: 20,
        timeElapsed: Date.now() - startTime,
        currentOperation: 'FFmpeg 실행 중...'
      });

      // 5. FFmpeg 실행
      const result = await FFmpegExecutor.execute(command, jobId, onProgress, startTime);

      // 6. 성공 후 파일 정보 수집
      if (result.success) {
        const stats = await FileUtils.getFileStats(outputPath);
        const duration = await FileUtils.getVideoDuration(outputPath);
        
        return {
          ...result,
          outputPath,
          fileSize: stats.size,
          duration,
          jobId
        };
      }

      return result;

    } catch (error) {
      console.error('렌더링 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        jobId,
        timeElapsed: Date.now() - startTime
      };
    }
  }

  /**
   * 렌더링 상태 확인
   */
  static async getRenderStatus(jobId: string): Promise<{
    exists: boolean;
    completed: boolean;
    outputPath?: string;
    fileSize?: number;
  }> {
    try {
      const mp4Path = path.join(FileUtils.OUTPUT_DIR, `${jobId}.mp4`);
      const webmPath = path.join(FileUtils.OUTPUT_DIR, `${jobId}.webm`);

      if (await FileUtils.fileExists(mp4Path)) {
        const stats = await FileUtils.getFileStats(mp4Path);
        return {
          exists: true,
          completed: true,
          outputPath: mp4Path,
          fileSize: stats.size
        };
      }

      if (await FileUtils.fileExists(webmPath)) {
        const stats = await FileUtils.getFileStats(webmPath);
        return {
          exists: true,
          completed: true,
          outputPath: webmPath,
          fileSize: stats.size
        };
      }

      return {
        exists: false,
        completed: false
      };

    } catch (error) {
      console.error('상태 확인 오류:', error);
      return {
        exists: false,
        completed: false
      };
    }
  }

  /**
   * 임시 파일 정리
   */
  static async cleanupTempFiles(jobId: string): Promise<void> {
    await FileUtils.cleanupTempFiles(jobId);
  }

  /**
   * FFmpeg 설치 상태 확인
   */
  static async checkFFmpegInstallation(): Promise<{ installed: boolean; version?: string }> {
    return FFmpegExecutor.checkInstallation();
  }
}
