import { NextRequest, NextResponse } from 'next/server';
import { SubtitleService } from '../clips/advanced/services/subtitle.service';

interface SubtitleTrack {
  language: 'en' | 'ko';
  entries: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
}

interface VideoSubtitles {
  videoId: string;
  tracks: SubtitleTrack[];
  lastUpdated: string;
}

interface SubtitleUploadRequest {
  videoId: string;
  language: 'en' | 'ko';
  format: 'srt' | 'vtt' | 'json';
  content: string;
}

interface SubtitleQueryRequest {
  videoId: string;
  startTime?: string;
  endTime?: string;
  language?: 'en' | 'ko';
  format?: 'json' | 'srt' | 'vtt';
}

/**
 * 자막 관리 API
 * GET: 자막 조회 및 시간 범위별 추출
 * POST: 자막 업로드 및 저장
 * PUT: 자막 수정
 * DELETE: 자막 삭제
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const language = searchParams.get('language') as 'en' | 'ko' | null;
    const format = searchParams.get('format') as 'json' | 'srt' | 'vtt' | null;

    if (!videoId) {
      return NextResponse.json({
        success: false,
        error: 'videoId가 필요합니다.'
      }, { status: 400 });
    }

    // 자막 로드
    const subtitles = await SubtitleService.loadSubtitles(videoId);
    
    if (!subtitles) {
      return NextResponse.json({
        success: false,
        error: '해당 비디오의 자막을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 시간 범위 지정 시 해당 구간의 자막만 추출
    if (startTime && endTime) {
      const extractedSubtitles = SubtitleService.extractSubtitlesForTimeRange(
        subtitles,
        parseFloat(startTime),
        parseFloat(endTime),
        language || undefined
      );

      return NextResponse.json({
        success: true,
        data: extractedSubtitles
      });
    }

    // 전체 자막 반환 (포맷 변환 지원)
    if (format && format !== 'json') {
      const formattedSubtitles: Record<string, string> = {};
      
      subtitles.tracks.forEach((track: SubtitleTrack) => {
        if (!language || track.language === language) {
          const key = track.language === 'en' ? 'english' : 'korean';
          
          if (format === 'srt') {
            formattedSubtitles[key] = SubtitleService.convertJSONToSRT(track);
          } else if (format === 'vtt') {
            formattedSubtitles[key] = SubtitleService.convertJSONToVTT(track);
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: formattedSubtitles,
        format
      });
    }

    // JSON 형식으로 반환
    return NextResponse.json({
      success: true,
      data: subtitles
    });

  } catch (error) {
    console.error('❌ 자막 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, language, format, content }: SubtitleUploadRequest = await request.json();

    if (!videoId || !language || !format || !content) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (videoId, language, format, content)'
      }, { status: 400 });
    }

    // 기존 자막 로드 또는 새로 생성
    let subtitles = await SubtitleService.loadSubtitles(videoId);
    
    if (!subtitles) {
      subtitles = {
        videoId,
        tracks: [],
        lastUpdated: new Date().toISOString()
      };
    }

    // 새 자막 트랙 파싱
    let newTrack;
    
    if (format === 'srt') {
      newTrack = SubtitleService.parseSRTToJSON(content, language);
    } else if (format === 'json') {
      try {
        const parsed = JSON.parse(content);
        newTrack = { language, entries: parsed.entries || parsed };
      } catch {
        throw new Error('유효하지 않은 JSON 형식입니다.');
      }
    } else {
      throw new Error('지원하지 않는 형식입니다. (srt, json만 지원)');
    }

    // 자막 품질 검증
    const validation = SubtitleService.validateSubtitleQuality(newTrack);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: '자막 품질 검증 실패',
        issues: validation.issues
      }, { status: 400 });
    }

    // 기존 트랙 교체 또는 추가
    const existingTrackIndex = subtitles.tracks.findIndex((track: SubtitleTrack) => track.language === language);
    
    if (existingTrackIndex !== -1) {
      subtitles.tracks[existingTrackIndex] = newTrack;
    } else {
      subtitles.tracks.push(newTrack);
    }

    subtitles.lastUpdated = new Date().toISOString();

    // 저장
    const saved = await SubtitleService.saveSubtitles(subtitles);
    
    if (!saved) {
      throw new Error('자막 저장에 실패했습니다.');
    }

    return NextResponse.json({
      success: true,
      message: '자막이 성공적으로 업로드되었습니다.',
      data: {
        videoId,
        language,
        entriesCount: newTrack.entries.length,
        confidence: validation.confidence
      }
    });

  } catch (error) {
    console.error('❌ 자막 업로드 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { videoId, language, updates } = await request.json();

    if (!videoId || !language) {
      return NextResponse.json({
        success: false,
        error: 'videoId와 language가 필요합니다.'
      }, { status: 400 });
    }

    // 기존 자막 로드
    const subtitles = await SubtitleService.loadSubtitles(videoId);
    
    if (!subtitles) {
      return NextResponse.json({
        success: false,
        error: '해당 비디오의 자막을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 해당 언어 트랙 찾기
    const trackIndex = subtitles.tracks.findIndex((track: SubtitleTrack) => track.language === language);
    
    if (trackIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '해당 언어의 자막 트랙을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 업데이트 적용
    Object.assign(subtitles.tracks[trackIndex], updates);
    subtitles.lastUpdated = new Date().toISOString();

    // 저장
    const saved = await SubtitleService.saveSubtitles(subtitles);
    
    if (!saved) {
      throw new Error('자막 업데이트 저장에 실패했습니다.');
    }

    return NextResponse.json({
      success: true,
      message: '자막이 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('❌ 자막 업데이트 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const language = searchParams.get('language') as 'en' | 'ko' | null;

    if (!videoId) {
      return NextResponse.json({
        success: false,
        error: 'videoId가 필요합니다.'
      }, { status: 400 });
    }

    if (language) {
      // 특정 언어 트랙만 삭제
      const subtitles = await SubtitleService.loadSubtitles(videoId);
      
      if (!subtitles) {
        return NextResponse.json({
          success: false,
          error: '해당 비디오의 자막을 찾을 수 없습니다.'
        }, { status: 404 });
      }

      subtitles.tracks = subtitles.tracks.filter((track: SubtitleTrack) => track.language !== language);
      subtitles.lastUpdated = new Date().toISOString();

      await SubtitleService.saveSubtitles(subtitles);

      return NextResponse.json({
        success: true,
        message: `${language} 자막이 삭제되었습니다.`
      });
    } else {
      // 전체 자막 파일 삭제
      const fs = await import('fs');
      const path = await import('path');
      
      const subtitlePath = path.join(process.cwd(), 'public', 'subtitles', `${videoId}.json`);
      
      try {
        await fs.promises.unlink(subtitlePath);
      } catch {
        // 파일이 없어도 성공으로 처리
      }

      return NextResponse.json({
        success: true,
        message: '자막 파일이 삭제되었습니다.'
      });
    }

  } catch (error) {
    console.error('❌ 자막 삭제 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
