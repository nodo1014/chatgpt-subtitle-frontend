import { NextRequest, NextResponse } from 'next/server';
import { ClipDatabaseService } from '../../clips-manage/services/clip-database.service';

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 초기화
    await ClipDatabaseService.initDatabase();
    
    // 현재 저장된 클립 개수 확인
    const allClips = await ClipDatabaseService.getClips();
    
    // 최근 생성된 클립들 확인 (createdAt 기준) - 최대 5개
    const recentClips = await ClipDatabaseService.getClips({ limit: 5 });
    
    return NextResponse.json({
      success: true,
      totalClips: allClips.length,
      recentClips: recentClips.map(clip => ({
        id: clip.id,
        title: clip.title,
        createdAt: clip.createdAt,
        tags: clip.tags
      }))
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
