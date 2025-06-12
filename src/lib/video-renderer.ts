import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface FFmpegTemplate {
  id: string;
  name: string;
  format: '16:9' | '9:16';
  resolution: string;
  settings: {
    background: string;
    font_family: string;
    font_size: number;
    stroke_width: number;
    text_color: string;
    stroke_color: string;
  };
}

export interface ClipData {
  id: string;
  title: string;
  english_text: string;
  korean_text: string;
  explanation?: string;
  pronunciation?: string;
  video_path: string;
  duration: number;
}

export interface RenderOptions {
  include_english: boolean;
  include_korean: boolean;
  include_explanation: boolean;
  include_pronunciation: boolean;
  repeat_count: number;
  pause_between_repeats: number;
}

export class VideoRenderer {
  private runningProcesses = new Map<string, ChildProcess>();

  // FFmpeg 명령어 생성 (템플릿 기반 - AI 실수 방지)
  private generateFFmpegCommand(
    inputPath: string,
    outputPath: string,
    template: FFmpegTemplate,
    textLayers: string[],
    repeatCount: number,
    pauseDuration: number
  ): string[] {
    const { resolution, settings } = template;
    const [width, height] = resolution.split('x').map(Number);
    
    // 시스템 폰트 경로 (Ubuntu/Debian 기준)
    const fontPath = '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc';
    
    const args: string[] = [
      '-i', inputPath,
      '-y', // 덮어쓰기 허용
    ];
    
    // 비디오 필터 체인 시작
    let filterComplex = '';
    
    // 1. 비디오 스케일링 및 패딩 (fit 방식)
    filterComplex += `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${settings.background}[scaled];`;
    
    // 2. 텍스트 오버레이 추가
    let currentInput = '[scaled]';
    textLayers.forEach((text, index) => {
      const safeText = text.replace(/'/g, "\\'").replace(/:/g, '\\:'); // 특수문자 이스케이프
      const yPosition = height - 180 - (index * 70); // 하단에서부터 쌓아올리기
      const outputLabel = index === textLayers.length - 1 ? '[final]' : `[text${index}]`;
      
      filterComplex += `${currentInput}drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=${settings.text_color}:fontsize=${settings.font_size}:bordercolor=${settings.stroke_color}:borderw=${settings.stroke_width}:x=(w-text_w)/2:y=${yPosition}${outputLabel};`;
      
      currentInput = `[text${index}]`;
    });
    
    // 3. 반복 처리 (단순한 방법: loop 필터 사용)
    if (repeatCount > 1) {
      const finalLabel = textLayers.length > 0 ? '[final]' : '[scaled]';
      filterComplex += `${finalLabel}loop=${repeatCount - 1}:size=32767[looped];`;
      currentInput = '[looped]';
    }
    
    // 필터 추가
    if (filterComplex) {
      args.push('-filter_complex', filterComplex);
      const mapLabel = textLayers.length > 0 ? '[final]' : '[scaled]';
      args.push('-map', repeatCount > 1 ? '[looped]' : mapLabel);
    }
    
    // 오디오 처리
    args.push('-map', '0:a?'); // 오디오가 있으면 포함
    
    // 인코딩 설정 (웹 최적화)
    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-profile:v', 'high',
      '-level', '4.0',
      '-pix_fmt', 'yuv420p', // 웹 호환성
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-movflags', '+faststart', // 웹 스트리밍 최적화
      outputPath
    );
    
    return args;
  }

  // 단일 클립 렌더링
  async renderSingleClip(
    clip: ClipData,
    template: FFmpegTemplate,
    options: RenderOptions,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 텍스트 레이어 구성
        const textLayers: string[] = [];
        if (options.include_english) textLayers.push(clip.english_text);
        if (options.include_korean) textLayers.push(clip.korean_text);
        if (options.include_explanation && clip.explanation) textLayers.push(`💡 ${clip.explanation}`);
        if (options.include_pronunciation && clip.pronunciation) textLayers.push(`🔊 ${clip.pronunciation}`);
        
        // FFmpeg 명령어 생성
        const args = this.generateFFmpegCommand(
          clip.video_path,
          outputPath,
          template,
          textLayers,
          options.repeat_count,
          options.pause_between_repeats
        );
        
        console.log('🎬 FFmpeg 실행:', 'ffmpeg', args.join(' '));
        
        // FFmpeg 프로세스 시작
        const ffmpeg = spawn('ffmpeg', args);
        this.runningProcesses.set(clip.id, ffmpeg);
        
        let stderr = '';
        
        // 진행률 추적 (stderr에서 time= 파싱)
        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
          
          if (onProgress) {
            const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (timeMatch) {
              const [, hours, minutes, seconds] = timeMatch;
              const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
              const totalTime = clip.duration * options.repeat_count;
              const progress = Math.min(Math.round((currentTime / totalTime) * 100), 100);
              onProgress(progress);
            }
          }
        });
        
        ffmpeg.on('close', (code) => {
          this.runningProcesses.delete(clip.id);
          
          if (code === 0) {
            console.log('✅ FFmpeg 완료:', outputPath);
            resolve();
          } else {
            console.error('❌ FFmpeg 실패:', code, stderr);
            reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
          }
        });
        
        ffmpeg.on('error', (error) => {
          this.runningProcesses.delete(clip.id);
          console.error('❌ FFmpeg 오류:', error);
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // 배치 렌더링 (여러 클립을 하나의 영상으로)
  async renderBatch(
    clips: ClipData[],
    template: FFmpegTemplate,
    options: RenderOptions,
    outputDir: string,
    workspaceId: string,
    onProgress?: (clipIndex: number, clipProgress: number, totalProgress: number) => void
  ): Promise<string> {
    // 출력 디렉토리 생성
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalOutputPath = path.join(outputDir, `${workspaceId}_${template.id}_${timestamp}.mp4`);
    
    // 임시 파일들을 위한 디렉토리
    const tempDir = path.join(outputDir, 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      // 1단계: 각 클립을 개별적으로 렌더링
      const tempFiles: string[] = [];
      
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const tempOutputPath = path.join(tempDir, `clip_${i}_${clip.id}.mp4`);
        
        await this.renderSingleClip(
          clip,
          template,
          options,
          tempOutputPath,
          (clipProgress) => {
            const totalProgress = Math.round(((i / clips.length) + (clipProgress / 100 / clips.length)) * 100);
            onProgress?.(i, clipProgress, totalProgress);
          }
        );
        
        tempFiles.push(tempOutputPath);
      }
      
      // 2단계: 모든 클립을 하나로 합치기 (concat)
      if (clips.length > 1) {
        await this.concatenateVideos(tempFiles, finalOutputPath);
      } else {
        // 단일 클립인 경우 그냥 이동
        await fs.rename(tempFiles[0], finalOutputPath);
      }
      
      // 임시 파일 정리
      await this.cleanupTempFiles(tempDir);
      
      return finalOutputPath;
      
    } catch (error) {
      // 에러 발생 시 임시 파일 정리
      await this.cleanupTempFiles(tempDir);
      throw error;
    }
  }

  // 비디오 연결 (concat)
  private async concatenateVideos(inputFiles: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // concat demuxer 사용을 위한 파일 리스트 생성
      const listContent = inputFiles.map(file => `file '${file}'`).join('\n');
      const listFile = path.join(path.dirname(outputPath), 'concat_list.txt');
      
      fs.writeFile(listFile, listContent).then(() => {
        const args = [
          '-f', 'concat',
          '-safe', '0',
          '-i', listFile,
          '-c', 'copy',
          '-y',
          outputPath
        ];
        
        const ffmpeg = spawn('ffmpeg', args);
        
        ffmpeg.on('close', (code) => {
          // 리스트 파일 정리
          fs.unlink(listFile).catch(console.error);
          
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Concat failed with code ${code}`));
          }
        });
        
        ffmpeg.on('error', reject);
      }).catch(reject);
    });
  }

  // 임시 파일 정리
  private async cleanupTempFiles(tempDir: string): Promise<void> {
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(files.map(file => fs.unlink(path.join(tempDir, file))));
      await fs.rmdir(tempDir);
    } catch (error) {
      console.warn('임시 파일 정리 실패:', error);
    }
  }

  // 실행 중인 프로세스 강제 종료
  cancelRender(clipId: string): boolean {
    const process = this.runningProcesses.get(clipId);
    if (process) {
      process.kill('SIGTERM');
      this.runningProcesses.delete(clipId);
      return true;
    }
    return false;
  }

  // 모든 실행 중인 프로세스 강제 종료
  cancelAllRenders(): void {
    for (const [clipId, process] of this.runningProcesses) {
      process.kill('SIGTERM');
      this.runningProcesses.delete(clipId);
    }
  }
}

// 싱글톤 인스턴스
export const videoRenderer = new VideoRenderer();
