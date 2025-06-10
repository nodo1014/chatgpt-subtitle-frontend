import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SubtitleData {
  media_file: string;
  text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
}

export async function GET(request: NextRequest) {
  try {
    // JSON 파일 읽기
    const jsonPath = path.join(process.cwd(), 'public', 'subtitles_sample.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const subtitles: SubtitleData[] = JSON.parse(jsonData);

    // 영어 자막만 필터링
    const englishSubtitles = subtitles.filter(sub => sub.language === 'en');

    // 미디어 파일별로 그룹화
    const groupedByMedia = englishSubtitles.reduce((acc, subtitle) => {
      const mediaFile = subtitle.media_file;
      if (!acc[mediaFile]) {
        acc[mediaFile] = [];
      }
      acc[mediaFile].push(subtitle);
      return acc;
    }, {} as { [key: string]: SubtitleData[] });

    // 챕터 생성 (상위 5개 미디어 파일만)
    const chapters = Object.entries(groupedByMedia)
      .slice(0, 5)
      .map(([mediaFile, subtitles], index) => {
        // 문장 수 제한 (최대 20개)
        const limitedSubtitles = subtitles.slice(0, 20);
        
        return {
          id: index + 1,
          title: getChapterTitle(mediaFile),
          media_file: mediaFile,
          category: getCategory(mediaFile),
          duration: calculateDuration(limitedSubtitles),
          sentences: limitedSubtitles.map((subtitle, sentenceIndex) => ({
            id: sentenceIndex + 1,
            text: subtitle.text,
            start_time: subtitle.start_time,
            end_time: subtitle.end_time,
            character: extractCharacter(subtitle.text),
            isRead: false,
            isBookmarked: false,
            notes: ''
          }))
        };
      });

    return NextResponse.json({
      success: true,
      chapters
    });

  } catch (error) {
    console.error('전자책 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

function getChapterTitle(mediaFile: string): string {
  // 파일명에서 제목 추출
  const fileName = mediaFile.split('/').pop() || mediaFile;
  const cleanName = fileName
    .replace(/\.(mp4|avi|mkv)$/i, '')
    .replace(/\d{4}p/g, '')
    .replace(/BluRay|WEBRip|DVDRip/gi, '')
    .replace(/x264|AAC5\.1/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\-/g, ' ')
    .trim();
  
  return cleanName.length > 50 ? cleanName.substring(0, 50) + '...' : cleanName;
}

function getCategory(mediaFile: string): string {
  const fileName = mediaFile.toLowerCase();
  
  if (fileName.includes('spawn')) {
    return '애니메이션';
  } else if (fileName.includes('snoopy')) {
    return '가족 영화';
  } else if (fileName.includes('missing')) {
    return '모험 영화';
  } else {
    return '일반';
  }
}

function calculateDuration(subtitles: SubtitleData[]): string {
  if (subtitles.length === 0) return '0:00';
  
  try {
    const firstTime = subtitles[0].start_time;
    const lastTime = subtitles[subtitles.length - 1].end_time;
    
    // 간단한 시간 계산 (실제로는 더 정확한 계산이 필요)
    const duration = Math.floor(subtitles.length * 3 / 60); // 대략적인 계산
    return `${duration}:${(subtitles.length * 3 % 60).toString().padStart(2, '0')}`;
  } catch {
    return '알 수 없음';
  }
}

function extractCharacter(text: string): string | undefined {
  // 간단한 캐릭터 추출 로직
  const characterPatterns = [
    /^([A-Z][a-z]+):/,
    /^([A-Z][a-z]+)'s voice:/,
    /\(([A-Z][a-z]+)\)/
  ];
  
  for (const pattern of characterPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
} 