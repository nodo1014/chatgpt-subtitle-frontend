
import { NextRequest, NextResponse } from 'next/server';
import { BatchSearchRequest } from './types';
import { SearchService } from './services/search.service';

/**
 * 배치 검색 API 엔드포인트
 * POST /api/batch-search
 */
export async function POST(request: NextRequest) {
  console.log('🔍 BATCH-SEARCH API 호출됨!');
  
  try {
    // 요청 데이터 파싱
    const requestData: BatchSearchRequest = await request.json();
    const { text, results_per_sentence = 20 } = requestData;

    // 검색 서비스를 통해 배치 검색 수행
    const searchResult = await SearchService.performBatchSearch(text, results_per_sentence);

    // 결과에 따른 적절한 HTTP 상태 코드 반환
    if (searchResult.success) {
      return NextResponse.json(searchResult);
    } else {
      return NextResponse.json(searchResult, { status: 400 });
    }

  } catch (error) {
    console.error('배치 검색 API 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.'
    }, { status: 500 });
  }
}