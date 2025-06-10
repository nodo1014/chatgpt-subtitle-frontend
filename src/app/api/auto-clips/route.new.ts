import { NextRequest, NextResponse } from 'next/server';
import { SearchResult, SentenceResult, ClipGenerationStats } from './types';
import { removeDuplicateResults } from './utils';
import { BatchProcessingService } from './batch.service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('🎯 AUTO-CLIPS API 호출됨!');
    console.log(`📥 받은 데이터:`, { sentence_results_count: data.sentence_results?.length || 0 });

    if (!data.sentence_results || !Array.isArray(data.sentence_results)) {
      return NextResponse.json({ 
        error: 'sentence_results가 필요합니다.' 
      }, { status: 400 });
    }

    const allResults: SearchResult[] = [];
    
    // 모든 검색 결과를 하나의 배열로 수집
    data.sentence_results.forEach((sentenceResult: SentenceResult, index: number) => {
      console.log(`📝 문장 ${index + 1}: "${sentenceResult.search_sentence}" - ${sentenceResult.results?.length || 0}개 결과`);
      
      if (sentenceResult.results && Array.isArray(sentenceResult.results)) {
        sentenceResult.results.forEach((result: SearchResult, resultIndex: number) => {
          console.log(`   결과 ${resultIndex + 1}: ${result.media_file} (${result.start_time} ~ ${result.end_time})`);
          allResults.push({
            ...result,
            sentence: sentenceResult.search_sentence // 원본 검색 문장 추가
          });
        });
      }
    });

    console.log(`🎬 총 ${allResults.length}개 클립 생성 시작 - 3단계 배치 처리`);
    console.log(`⏰ 시작 시간: ${new Date().toLocaleTimeString()}`);

    // 중복 제거 (동일한 미디어 파일 + 시간대)
    const { unique: uniqueResults, duplicatesCount } = removeDuplicateResults(allResults);
    
    console.log(`📊 중복 제거 후: ${uniqueResults.length}개 클립 (${duplicatesCount}개 중복 제거)`);

    // 🔥 3단계 배치 처리 시작
    const batchStartTime = Date.now();
    
    // ===== 1단계: JSON 메타데이터 일괄 생성 =====
    const stage1StartTime = Date.now();
    const jsonResults = await BatchProcessingService.createJSONBatch(uniqueResults);
    const stage1Time = Date.now() - stage1StartTime;
    
    console.log(`✅ 1단계 완료: ${jsonResults.length}개 JSON 생성 (소요시간: ${stage1Time/1000}초)`);
    
    // ===== 2단계: 썸네일 일괄 생성 =====
    const stage2StartTime = Date.now();
    const thumbnailResults = await BatchProcessingService.createThumbnailBatch(jsonResults);
    const stage2Time = Date.now() - stage2StartTime;
    
    console.log(`✅ 2단계 완료: ${thumbnailResults.success}개 썸네일 생성, ${thumbnailResults.failed}개 실패 (소요시간: ${stage2Time/1000}초)`);
    
    // ===== 3단계: 영상 클립 일괄 생성 =====
    const stage3StartTime = Date.now();
    const clipResults = await BatchProcessingService.createClipBatch(jsonResults);
    const stage3Time = Date.now() - stage3StartTime;
    
    console.log(`✅ 3단계 완료: ${clipResults.success}개 클립 생성, ${clipResults.failed}개 실패 (소요시간: ${stage3Time/1000}초)`);
    
    // 최종 결과 정리
    const totalTime = Date.now() - batchStartTime;
    console.log(`\n🎉 === 3단계 배치 처리 완료 ===`);
    console.log(`📊 총 처리 시간: ${totalTime/1000}초`);
    console.log(`   - 1단계 (JSON): ${stage1Time/1000}초`);
    console.log(`   - 2단계 (썸네일): ${stage2Time/1000}초`);
    console.log(`   - 3단계 (클립): ${stage3Time/1000}초`);
    console.log(`📈 성공률: JSON ${jsonResults.length}개, 썸네일 ${thumbnailResults.success}개, 클립 ${clipResults.success}개`);
    console.log(`⏰ 완료 시간: ${new Date().toLocaleTimeString()}`);

    const stats: ClipGenerationStats = {
      total_requested: allResults.length,
      duplicates_removed: duplicatesCount,
      json_created: jsonResults.length,
      thumbnails_created: thumbnailResults.success,
      clips_created: clipResults.success,
      total_time_seconds: totalTime / 1000,
      stage_times: {
        json: stage1Time / 1000,
        thumbnails: stage2Time / 1000,
        clips: stage3Time / 1000
      }
    };

    return NextResponse.json({
      success: true,
      message: `3단계 배치 처리 완료`,
      total_created: clipResults.success, // 프론트엔드에서 사용하는 필드
      total_processed: jsonResults.length, // 프론트엔드에서 사용하는 필드
      stats
    });

  } catch (error) {
    console.error('❌ AUTO-CLIPS API 오류:', error);
    return NextResponse.json({ 
      error: '클립 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
