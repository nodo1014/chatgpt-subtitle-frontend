import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { torrentName, downloadPath, downloadId } = await request.json();
    
    console.log('🎉 토렌트 다운로드 완료:', {
      torrentName,
      downloadPath,
      downloadId
    });

    // 다운로드된 파일들 찾기
    const torrentDir = path.join(downloadPath, torrentName.replace('.torrent', ''));
    
    if (!fs.existsSync(torrentDir)) {
      console.error('다운로드 폴더를 찾을 수 없습니다:', torrentDir);
      return NextResponse.json({ error: '다운로드 폴더를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 비디오 파일 찾기
    const videoFiles = findVideoFiles(torrentDir);
    console.log('🎬 발견된 비디오 파일들:', videoFiles);

    // 각 비디오 파일에 대해 자막 다운로드
    const subtitleResults = [];
    
    for (const videoFile of videoFiles) {
      try {
        console.log('📥 자막 다운로드 시작:', videoFile);
        
        // YIFY 자막 다운로드 API 호출
        const subtitleResponse = await fetch('http://localhost:3015/api/subtitle-manager/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: videoFile
          })
        });

        if (subtitleResponse.ok) {
          const subtitleResult = await subtitleResponse.json();
          subtitleResults.push({
            videoFile,
            success: true,
            englishSubtitle: subtitleResult.englishSubtitle,
            koreanSubtitle: subtitleResult.koreanSubtitle,
            message: subtitleResult.message
          });
          console.log('✅ 자막 다운로드 성공:', {
            영어: subtitleResult.englishSubtitle ? '✅' : '❌',
            한글: subtitleResult.koreanSubtitle ? '✅' : '❌',
            메시지: subtitleResult.message
          });
        } else {
          subtitleResults.push({
            videoFile,
            success: false,
            error: '자막 다운로드 실패'
          });
          console.warn('⚠️ 자막 다운로드 실패:', videoFile);
        }
      } catch (error) {
        console.error('자막 다운로드 오류:', error);
        subtitleResults.push({
          videoFile,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    // 파일을 적절한 카테고리 폴더로 이동
    const organizedFiles = await organizeFiles(torrentDir, videoFiles);

    // 다운로드 상태 업데이트
    const activeDownloads = global.activeDownloads || new Map();
    const downloadInfo = activeDownloads.get(downloadId);
    
    if (downloadInfo) {
      downloadInfo.status = 'completed';
      downloadInfo.progress = 100;
      downloadInfo.completedTime = new Date().toISOString();
      downloadInfo.videoFiles = videoFiles;
      downloadInfo.subtitleResults = subtitleResults;
      downloadInfo.organizedFiles = organizedFiles;
    }

    console.log('🎊 토렌트 처리 완료:', {
      downloadId,
      videoCount: videoFiles.length,
      subtitleCount: subtitleResults.filter(r => r.success).length,
      organizedFiles: organizedFiles.length
    });

    return NextResponse.json({
      success: true,
      downloadId,
      torrentName,
      videoFiles,
      subtitleResults,
      organizedFiles,
      message: '토렌트 다운로드 및 후처리가 완료되었습니다.'
    });

  } catch (error) {
    console.error('토렌트 완료 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}

// 비디오 파일 찾기 함수
function findVideoFiles(directory: string): string[] {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const videoFiles: string[] = [];

  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (videoExtensions.includes(ext)) {
          videoFiles.push(fullPath);
        }
      }
    }
  }

  scanDirectory(directory);
  return videoFiles;
}

// 파일 정리 함수 (카테고리별 폴더로 이동)
async function organizeFiles(torrentDir: string, videoFiles: string[]): Promise<string[]> {
  const organizedFiles: string[] = [];
  
  for (const videoFile of videoFiles) {
    try {
      // 파일명에서 카테고리 추정
      const fileName = path.basename(videoFile);
      let category = 'Movies'; // 기본값
      
      // TV 시리즈 감지
      if (fileName.match(/S\d{2}E\d{2}|Season|Episode/i)) {
        category = 'TV';
      }
      
      // 애니메이션 감지
      if (fileName.match(/anime|manga/i)) {
        category = 'Anime';
      }

      // 대상 디렉토리 생성
      const targetDir = path.join('/mnt/qnap/media_eng', category);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 파일 이동 (실제로는 복사 후 원본 삭제)
      const targetPath = path.join(targetDir, fileName);
      
      // 동일한 파일이 이미 존재하는지 확인
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(videoFile, targetPath);
        console.log(`📁 파일 이동: ${videoFile} → ${targetPath}`);
        organizedFiles.push(targetPath);
      } else {
        console.log(`⚠️ 파일이 이미 존재함: ${targetPath}`);
        organizedFiles.push(targetPath);
      }
      
    } catch (error) {
      console.error('파일 정리 오류:', error);
    }
  }
  
  return organizedFiles;
} 