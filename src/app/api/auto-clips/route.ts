
import { NextRequest, NextResponse } from 'next/server';
import { SentenceResult } from './types';
import { AutoClipsService } from './services/auto-clips.service';

/**
 * 자동 클립 생성 API 엔드포인트
 * POST /api/auto-clips
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 요청 데이터 검증
    if (!data.sentence_results || !Array.isArray(data.sentence_results)) {
      return NextResponse.json({ 
        error: 'sentence_results가 필요합니다.' 
      }, { status: 400 });
    }

    // 자동 클립 생성 서비스 실행
    const result = await AutoClipsService.processAutoClips(data.sentence_results as SentenceResult[]);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ AUTO-CLIPS API 오류:', error);
    
    return NextResponse.json({ 
      success: false,
      error: '클립 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
