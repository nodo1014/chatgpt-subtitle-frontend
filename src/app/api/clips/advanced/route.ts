import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SubtitleService } from './services/subtitle.service';

const execAsync = promisify(exec);

interface ClipData {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle?: string;
  koreanSubtitle?: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration?: string;
  tags: string[];
  isBookmarked?: boolean;
}

interface ClippingOptions {
  quality: '480p' | '720p' | '1080p';
  format: 'mp4' | 'webm' | 'gif';
  subtitles: 'none' | 'english' | 'korean' | 'both';
  padding: number; // 앞뒤 여유시간 (초)
  preset: 'youtube' | 'social' | 'gif' | 'study' | 'custom';
}

interface BatchClipRequest {
  clips: ClipData[];
  options: ClippingOptions;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  results: Array<{
    clipId: string;
    success: boolean;
    outputPath?: string;
    error?: string;
  }>;
}

// FFmpeg 품질 설정
const QUALITY_SETTINGS = {
  '480p': { width: 854, height: 480, bitrate: '1M' },
  '720p': { width: 1280, height: 720, bitrate: '2.5M' },
  '1080p': { width: 1920, height: 1080, bitrate: '5M' }
};

/**
 * 고급 클립 생성 API
 * 자막 통합, 다양한 품질 옵션, 배치 처리 지원
 */
export async function POST(request: NextRequest) {
  try {
    const { clips, options }: BatchClipRequest = await request.json();

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({
        success: false,
        error: '처리할 클립이 없습니다.'
      }, { status: 400 });
    }

    console.log(`🎬 고급 클리핑 시작: ${clips.length}개 클립, 옵션:`, options);

    const outputDir = path.join(process.cwd(), 'public', 'clips', 'advanced');
    
    // 출력 디렉토리 생성
    try {
      await fs.promises.mkdir(outputDir, { recursive: true });
    } catch (error) {
      console.error('출력 디렉토리 생성 실패:', error);
    }

    const results: ProcessingResult['results'] = [];
    let successful = 0;
    let failed = 0;

    // 각 클립 처리
    for (const clip of clips) {
      try {
        console.log(`🔄 처리 중: ${clip.title}`);
        
        const result = await processAdvancedClip(clip, options, outputDir);
        
        if (result.success) {
          successful++;
          results.push({
            clipId: clip.id,
            success: true,
            outputPath: result.outputPath
          });
          console.log(`✅ 성공: ${clip.title}`);
        } else {
          failed++;
          results.push({
            clipId: clip.id,
            success: false,
            error: result.error
          });
          console.log(`❌ 실패: ${clip.title} - ${result.error}`);
        }
      } catch (error) {
        failed++;
        results.push({
          clipId: clip.id,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
        console.log(`❌ 예외: ${clip.title} - ${error}`);
      }
    }

    console.log(`🎯 배치 처리 완료: 성공 ${successful}개, 실패 ${failed}개`);

    return NextResponse.json({
      success: true,
      message: `배치 클리핑 완료: 성공 ${successful}개, 실패 ${failed}개`,
      data: {
        successful,
        failed,
        results
      }
    });

  } catch (error) {
    console.error('❌ 고급 클리핑 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '클립 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * 단일 클립 고급 처리
 */
async function processAdvancedClip(
  clip: ClipData, 
  options: ClippingOptions, 
  outputDir: string
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  try {
    const outputId = uuidv4();
    const inputPath = path.join(process.cwd(), 'public', clip.clipPath.replace('/clips/', ''));
    const outputFilename = `${outputId}.${options.format}`;
    const outputPath = path.join(outputDir, outputFilename);
    const relativeOutputPath = `/clips/advanced/${outputFilename}`;

    // 입력 파일 존재 확인
    try {
      await fs.promises.access(inputPath);
    } catch {
      throw new Error('원본 클립 파일을 찾을 수 없습니다.');
    }

    // 시간 계산 (패딩 포함)
    const startSeconds = timeToSeconds(clip.startTime) - options.padding;
    const endSeconds = timeToSeconds(clip.endTime) + options.padding;
    const duration = endSeconds - startSeconds;

    if (duration <= 0) {
      throw new Error('유효하지 않은 시간 범위입니다.');
    }

    // FFmpeg 명령어 구성
    const ffmpegCmd = await buildFFmpegCommand(
      inputPath,
      outputPath,
      { startSeconds, duration },
      options,
      clip
    );

    console.log(`🔧 FFmpeg 명령어: ${ffmpegCmd}`);

    // FFmpeg 실행
    await execAsync(ffmpegCmd);

    // 출력 파일 확인
    try {
      await fs.promises.access(outputPath);
    } catch {
      throw new Error('클립 생성에 실패했습니다.');
    }

    return {
      success: true,
      outputPath: relativeOutputPath
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * FFmpeg 명령어 구성
 */
async function buildFFmpegCommand(
  inputPath: string,
  outputPath: string,
  timing: { startSeconds: number; duration: number },
  options: ClippingOptions,
  clip: ClipData
): Promise<string> {
  const quality = QUALITY_SETTINGS[options.quality];
  const parts: string[] = ['ffmpeg', '-y']; // -y: 덮어쓰기 허용

  // 입력 파일
  parts.push('-i', `"${inputPath}"`);

  // 시간 설정
  parts.push('-ss', timing.startSeconds.toString());
  parts.push('-t', timing.duration.toString());

  // 포맷별 설정
  if (options.format === 'gif') {
    // GIF 최적화
    parts.push('-vf', `"fps=15,scale=${quality.width}:${quality.height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"`);
    parts.push('-loop', '0');
  } else {
    // 비디오 인코딩
    parts.push('-c:v', 'libx264');
    parts.push('-preset', 'fast');
    parts.push('-crf', '23');
    parts.push('-b:v', quality.bitrate);
    parts.push('-vf', `scale=${quality.width}:${quality.height}`);

    // 오디오 설정 (GIF가 아닌 경우)
    if (options.format === 'webm') {
      parts.push('-c:a', 'libvorbis');
    } else {
      parts.push('-c:a', 'aac');
      parts.push('-b:a', '128k');
    }
  }

  // 자막 처리
  if (options.subtitles !== 'none' && options.format !== 'gif') {
    const subtitleFilter = await buildSubtitleFilter(clip, options.subtitles);
    if (subtitleFilter) {
      // 기존 비디오 필터와 자막 필터 결합
      const existingVf = parts.findIndex(part => part === '-vf');
      if (existingVf !== -1) {
        parts[existingVf + 1] = `"${parts[existingVf + 1].replace(/"/g, '')},${subtitleFilter}"`;
      } else {
        parts.push('-vf', `"${subtitleFilter}"`);
      }
    }
  }

  // 출력 파일
  parts.push(`"${outputPath}"`);

  return parts.join(' ');
}

/**
 * 자막 필터 구성 - 실제 자막 데이터와 클립 정보 사용
 */
async function buildSubtitleFilter(clip: ClipData, subtitleType: string): Promise<string | null> {
  try {
    const filters: string[] = [];

    // 소스 파일에서 비디오 ID 추출 (예: "filename.mp4" -> "filename")
    const videoId = path.basename(clip.sourceFile, path.extname(clip.sourceFile));
    
    // 자막 서비스에서 실제 자막 데이터 가져오기
    const subtitleData = await SubtitleService.getSubtitlesForClip(
      videoId,
      clip.startTime,
      clip.endTime
    );

    if (subtitleType === 'english' || subtitleType === 'both') {
      // 실제 자막 데이터 우선, 없으면 클립 메타데이터 사용
      const englishText = subtitleData.english || clip.englishSubtitle;
      if (englishText) {
        const cleanText = englishText.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
        filters.push(`drawtext=text='${cleanText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-60`);
      }
    }

    if (subtitleType === 'korean' || subtitleType === 'both') {
      // 실제 자막 데이터 우선, 없으면 클립 메타데이터 사용
      const koreanText = subtitleData.korean || clip.koreanSubtitle;
      if (koreanText) {
        const cleanText = koreanText.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
        const yPos = subtitleType === 'both' ? 'h-30' : 'h-60';
        filters.push(`drawtext=text='${cleanText}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${yPos}`);
      }
    }

    return filters.length > 0 ? filters.join(',') : null;
  } catch (error) {
    console.error('자막 필터 구성 오류:', error);
    
    // 오류 발생 시 기존 메타데이터 사용 (폴백)
    try {
      const filters: string[] = [];

      if (subtitleType === 'english' || subtitleType === 'both') {
        if (clip.englishSubtitle) {
          const englishText = clip.englishSubtitle.replace(/'/g, "\\'").replace(/"/g, '\\"');
          filters.push(`drawtext=text='${englishText}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-60`);
        }
      }

      if (subtitleType === 'korean' || subtitleType === 'both') {
        if (clip.koreanSubtitle) {
          const koreanText = clip.koreanSubtitle.replace(/'/g, "\\'").replace(/"/g, '\\"');
          const yPos = subtitleType === 'both' ? 'h-30' : 'h-60';
          filters.push(`drawtext=text='${koreanText}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=${yPos}`);
        }
      }

      return filters.length > 0 ? filters.join(',') : null;
    } catch (fallbackError) {
      console.error('폴백 자막 필터 구성도 실패:', fallbackError);
      return null;
    }
  }
}

/**
 * 시간 문자열을 초로 변환
 */
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(parseFloat);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return parts[0];
  }
}
