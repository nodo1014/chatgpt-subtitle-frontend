import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 지원하는 비디오 파일 확장자
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

// 지원하는 자막 파일 확장자
const SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa', '.sub'];

export async function POST(request: NextRequest) {
  try {
    const { path: targetPath } = await request.json();
    
    if (!targetPath) {
      return NextResponse.json({ error: '경로가 필요합니다.' }, { status: 400 });
    }

    console.log('📁 디렉토리 탐색:', targetPath);

    // 경로 존재 확인
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: '경로가 존재하지 않습니다.' }, { status: 404 });
    }

    // 디렉토리인지 확인
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return NextResponse.json({ error: '디렉토리가 아닙니다.' }, { status: 400 });
    }

    // 디렉토리 내용 읽기
    const items = fs.readdirSync(targetPath);
    const files = [];

    for (const item of items) {
      try {
        const itemPath = path.join(targetPath, item);
        const itemStats = fs.statSync(itemPath);
        
        if (itemStats.isDirectory()) {
          // 디렉토리인 경우
          files.push({
            path: itemPath,
            name: item,
            size: 0,
            isDirectory: true,
            hasSubtitle: false
          });
        } else {
          // 파일인 경우 - 비디오 파일만 처리
          const ext = path.extname(item).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext)) {
            const hasSubtitle = checkSubtitleExists(itemPath);
            
            files.push({
              path: itemPath,
              name: item,
              size: itemStats.size,
              isDirectory: false,
              hasSubtitle,
              extension: ext
            });
          }
        }
      } catch (error) {
        console.warn(`파일 처리 오류 (${item}):`, error);
        // 개별 파일 오류는 무시하고 계속 진행
      }
    }

    // 정렬: 디렉토리 먼저, 그 다음 파일명 순
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`📊 탐색 결과: ${files.length}개 항목 (디렉토리: ${files.filter(f => f.isDirectory).length}, 비디오: ${files.filter(f => !f.isDirectory).length})`);

    return NextResponse.json({
      success: true,
      path: targetPath,
      files,
      summary: {
        total: files.length,
        directories: files.filter(f => f.isDirectory).length,
        videos: files.filter(f => !f.isDirectory).length,
        videosWithSubtitles: files.filter(f => !f.isDirectory && f.hasSubtitle).length,
        videosWithoutSubtitles: files.filter(f => !f.isDirectory && !f.hasSubtitle).length
      }
    });

  } catch (error) {
    console.error('디렉토리 탐색 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}

// 자막 파일 존재 여부 확인
function checkSubtitleExists(videoPath: string): boolean {
  const videoDir = path.dirname(videoPath);
  const videoName = path.basename(videoPath, path.extname(videoPath));
  
  try {
    // 같은 디렉토리에서 같은 이름의 자막 파일 찾기
    const files = fs.readdirSync(videoDir);
    
    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      const fileExt = path.extname(file).toLowerCase();
      
      // 파일명이 비디오 파일명과 일치하고 자막 확장자인 경우
      if (fileName === videoName && SUBTITLE_EXTENSIONS.includes(fileExt)) {
        return true;
      }
      
      // 파일명이 비디오 파일명으로 시작하고 자막 확장자인 경우 (언어 코드 포함)
      // 예: movie.en.srt, movie.ko.srt
      if (fileName.startsWith(videoName + '.') && SUBTITLE_EXTENSIONS.includes(fileExt)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn(`자막 파일 확인 오류 (${videoPath}):`, error);
    return false;
  }
} 