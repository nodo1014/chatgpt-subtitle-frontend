import { SearchResult, SentenceResult, ClipGenerationStats, ClipMetadata, BatchResult } from '../types';
import { removeDuplicateResults } from '../utils';
import { BatchProcessingService } from './batch.service';
import { ClipDatabaseService } from '../../clips-manage/services/clip-database.service';

/**
 * 자동 클립 생성 서비스 클래스
 */
export class AutoClipsService {
  /**
   * 자동 클립 생성 프로세스 실행
   */
  static async processAutoClips(sentenceResults: SentenceResult[]): Promise<ClipGenerationStats> {
    console.log('🎯 자동 클립 생성 서비스 시작');
    
    // 1. 검색 결과 수집
    const allResults = this.collectSearchResults(sentenceResults);
    console.log(`🎬 총 ${allResults.length}개 클립 생성 시작`);
    
    // 2. 중복 제거
    const { unique: uniqueResults, duplicatesCount } = removeDuplicateResults(allResults);
    console.log(`📊 중복 제거 후: ${uniqueResults.length}개 클립`);
    
    // 3. 3단계 처리
    const startTime = Date.now();
    const processingResult = await this.execute3StageProcessing(uniqueResults);
    const totalTime = Date.now() - startTime;
    
    // 4. 데이터베이스에 성공한 클립들 저장
    await this.saveCompletedClipsToDatabase(processingResult.jsonResults, processingResult.clipResults.success);
    
    // 5. 결과 반환
    return this.generateResponse(allResults.length, duplicatesCount, processingResult, totalTime);
  }

  private static collectSearchResults(sentenceResults: SentenceResult[]): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    sentenceResults.forEach((sentenceResult, index) => {
      console.log(`�� 문장 ${index + 1}: "${sentenceResult.search_sentence}"`);
      
      if (sentenceResult.results && Array.isArray(sentenceResult.results)) {
        sentenceResult.results.forEach((result: SearchResult) => {
          allResults.push({
            ...result,
            sentence: sentenceResult.search_sentence
          });
        });
      }
    });
    
    return allResults;
  }

  private static async execute3StageProcessing(uniqueResults: SearchResult[]) {
    // 1단계: JSON 생성
    const stage1StartTime = Date.now();
    const jsonResults = await BatchProcessingService.createJSONBatch(uniqueResults);
    const stage1Time = Date.now() - stage1StartTime;

    // 2단계: 썸네일 생성
    const stage2StartTime = Date.now();
    const thumbnailResults = await BatchProcessingService.createThumbnailBatch(jsonResults);
    const stage2Time = Date.now() - stage2StartTime;

    // 3단계: 클립 생성
    const stage3StartTime = Date.now();
    const clipResults = await BatchProcessingService.createClipBatch(jsonResults);
    const stage3Time = Date.now() - stage3StartTime;

    return {
      jsonResults,
      thumbnailResults,
      clipResults,
      stageTimes: { stage1: stage1Time, stage2: stage2Time, stage3: stage3Time }
    };
  }

  private static async saveCompletedClipsToDatabase(jsonResults: ClipMetadata[], successCount: number) {
    if (successCount > 0) {
      console.log(`💾 데이터베이스에 ${successCount}개 클립 저장 시작...`);
      
      // 데이터베이스 초기화
      await ClipDatabaseService.initDatabase();
      
      // 성공적으로 생성된 클립들만 저장 (completed 태그를 가진 클립들)
      const completedClips = jsonResults.filter(clip => 
        clip.tags && clip.tags.includes('completed')
      );
      
      let savedCount = 0;
      for (const clip of completedClips) {
        try {
          const success = await ClipDatabaseService.createClip(clip);
          if (success) {
            savedCount++;
          }
        } catch (error) {
          console.error(`❌ 클립 DB 저장 실패: ${clip.id}`, error);
        }
      }
      
      console.log(`💾 데이터베이스에 ${savedCount}/${completedClips.length}개 클립 저장 완료`);
    }
  }

  private static generateResponse(
    totalRequested: number,
    duplicatesCount: number,
    processingResult: {
      jsonResults: ClipMetadata[];
      thumbnailResults: BatchResult;
      clipResults: BatchResult;
      stageTimes: { stage1: number; stage2: number; stage3: number };
    },
    totalTime: number
  ): ClipGenerationStats {
    const { jsonResults, thumbnailResults, clipResults } = processingResult;

    return {
      total_requested: totalRequested,
      duplicates_removed: duplicatesCount,
      json_created: jsonResults.length,
      thumbnails_created: thumbnailResults.success,
      clips_created: clipResults.success,
      total_time_seconds: totalTime / 1000,
      stage_times: {
        json: processingResult.stageTimes.stage1 / 1000,
        thumbnails: processingResult.stageTimes.stage2 / 1000,
        clips: processingResult.stageTimes.stage3 / 1000
      }
    };
  }
}
