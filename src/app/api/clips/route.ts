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

export async function GET() {
  try {
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

    const files = await fs.promises.readdir(clipsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const clips: ClipMetadata[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(clipsDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        clips.push(metadata);
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
