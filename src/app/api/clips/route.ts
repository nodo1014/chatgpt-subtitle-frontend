import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface ClipMetadata {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle: string;
  koreanSubtitle: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration: string;
  tags: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get('id');
    
    const clipsDir = path.join(process.cwd(), 'public', 'clips');
    
    // 클립 디렉토리가 없으면 빈 배열 반환
    try {
      await fs.promises.access(clipsDir);
    } catch {
      return NextResponse.json({
        success: true,
        clips: []
      });
    }

    // 특정 클립 조회
    if (clipId) {
      const clipJsonPath = path.join(clipsDir, `${clipId}.json`);
      const clipMp4Path = path.join(clipsDir, `${clipId}.mp4`);

      try {
        // JSON 파일과 MP4 파일 존재 확인
        await fs.promises.access(clipJsonPath);
        await fs.promises.access(clipMp4Path);

        const clipData = await fs.promises.readFile(clipJsonPath, 'utf-8');
        const clip = JSON.parse(clipData);

        return NextResponse.json({
          success: true,
          clip: {
            ...clip,
            videoUrl: `/clips/${clipId}.mp4`,
            hasKoreanSubtitle: clip.koreanSubtitle && clip.koreanSubtitle !== 'X'
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Clip not found'
        }, { status: 404 });
      }
    }

    // 전체 클립 목록 조회
    const files = await fs.promises.readdir(clipsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const clips: ClipMetadata[] = [];
    
    for (const file of jsonFiles) {
      try {
        const clipId = file.replace('.json', '');
        const filePath = path.join(clipsDir, file);
        const mp4Path = path.join(clipsDir, `${clipId}.mp4`);
        
        // MP4 파일 존재 확인
        await fs.promises.access(mp4Path);
        
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        clips.push({
          ...metadata,
          videoUrl: `/clips/${clipId}.mp4`,
          hasKoreanSubtitle: metadata.koreanSubtitle && metadata.koreanSubtitle !== 'X'
        });
      } catch (error) {
        console.error(`메타데이터 파일 읽기 오류: ${file}`, error);
      }
    }
    
    // 생성 날짜 순으로 정렬 (최신순)
    clips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({
      success: true,
      clips
    });
  } catch (error) {
    console.error('클립 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '클립 목록을 불러오는 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}
