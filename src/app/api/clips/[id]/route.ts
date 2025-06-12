import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '클립 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const clipsDir = path.join(process.cwd(), 'public', 'clips');
    const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');
    
    // 클립 파일 경로들
    const clipPath = path.join(clipsDir, `${id}.mp4`);
    const thumbnailPath = path.join(thumbnailsDir, `${id}.jpg`);
    const metadataPath = path.join(clipsDir, `${id}.json`);

    // 메타데이터 파일 확인
    try {
      await fs.promises.access(metadataPath);
    } catch {
      return NextResponse.json(
        { success: false, error: '클립을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일들 삭제
    const deletePromises = [];
    
    // 클립 파일 삭제
    deletePromises.push(
      fs.promises.unlink(clipPath).catch(() => {
        console.log(`클립 파일이 존재하지 않습니다: ${clipPath}`);
      })
    );
    
    // 썸네일 파일 삭제
    deletePromises.push(
      fs.promises.unlink(thumbnailPath).catch(() => {
        console.log(`썸네일 파일이 존재하지 않습니다: ${thumbnailPath}`);
      })
    );
    
    // 메타데이터 파일 삭제
    deletePromises.push(
      fs.promises.unlink(metadataPath).catch(() => {
        console.log(`메타데이터 파일이 존재하지 않습니다: ${metadataPath}`);
      })
    );
    
    await Promise.all(deletePromises);
    
    return NextResponse.json({
      success: true,
      message: '클립이 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('클립 삭제 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '클립 삭제 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: '클립 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const clipsDir = path.join(process.cwd(), 'public', 'clips');
    const metadataPath = path.join(clipsDir, `${id}.json`);
    
    // 메타데이터 파일 확인
    try {
      await fs.promises.access(metadataPath);
    } catch {
      return NextResponse.json(
        { error: '클립을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 메타데이터 읽기
    const metadataContent = await fs.promises.readFile(metadataPath, 'utf-8');
    const clipData = JSON.parse(metadataContent);
    
    // 비디오 파일 존재 확인
    const videoPath = path.join(clipsDir, `${id}.mp4`);
    let videoExists = true;
    try {
      await fs.promises.access(videoPath);
    } catch {
      videoExists = false;
    }
    
    return NextResponse.json({
      ...clipData,
      videoUrl: videoExists ? `/clips/${id}.mp4` : null,
      thumbnailUrl: clipData.thumbnailPath || `/thumbnails/${id}.jpg`
    });
    
  } catch (error) {
    console.error('클립 로드 오류:', error);
    return NextResponse.json(
      { error: '클립 로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
