
import { SentenceResult, BatchSearchResponse } from '../types';
import { extractEnglishSentences, validateSearchRequest } from '../utils';
import { DatabaseService } from './database.service';

/**
 * 배치 검색 서비스 클래스
 */
export class SearchService {
  /**
   * 배치 검색 수행
   * @param text 검색할 텍스트
   * @param resultsPerSentence 문장당 결과 개수
   * @returns 검색 결과 응답
   */
  static async performBatchSearch(
    text: string, 
    resultsPerSentence: number = 20
  ): Promise<BatchSearchResponse> {
    console.log('🔍 배치 검색 시작');
    console.log('📥 검색 텍스트:', text);
    console.log('📥 문장당 결과 수:', resultsPerSentence);

    // 입력 유효성 검사
    const validation = validateSearchRequest(text);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      // 영어 문장 추출
      const extractedSentences = extractEnglishSentences(text);
      console.log('📝 추출된 문장들:', extractedSentences);

      // 각 문장에 대해 검색 수행
      const sentenceResults = await this.searchSentences(extractedSentences, resultsPerSentence);
      
      // 검색 결과 요약 계산
      const searchSummary = this.calculateSearchSummary(sentenceResults);

      return {
        success: true,
        extracted_sentences: extractedSentences,
        search_summary: searchSummary,
        sentence_results: sentenceResults,
        auto_create_clips: true
      };

    } catch (error) {
      console.error('배치 검색 오류:', error);
      return {
        success: false,
        error: '검색 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 여러 문장에 대한 검색 수행
   * @param sentences 검색할 문장들
   * @param resultsPerSentence 문장당 결과 개수
   * @returns 문장별 검색 결과
   */
  private static async searchSentences(
    sentences: string[], 
    resultsPerSentence: number
  ): Promise<SentenceResult[]> {
    const sentenceResults: SentenceResult[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      console.log(`🔍 문장 ${i + 1}/${sentences.length} 검색: "${sentence}"`);
      
      try {
        const searchResults = DatabaseService.searchInDatabase(sentence, resultsPerSentence);
        
        sentenceResults.push({
          sentence_index: i + 1,
          search_sentence: sentence,
          found_count: searchResults.length,
          results: searchResults
        });

        console.log(`✅ 문장 ${i + 1} 검색 완료: ${searchResults.length}개 결과`);
        
      } catch (error) {
        console.error(`❌ 문장 ${i + 1} 검색 실패:`, error);
        
        // 실패한 경우에도 빈 결과로 추가
        sentenceResults.push({
          sentence_index: i + 1,
          search_sentence: sentence,
          found_count: 0,
          results: []
        });
      }
    }

    return sentenceResults;
  }

  /**
   * 검색 결과 요약 계산
   * @param sentenceResults 문장별 검색 결과
   * @returns 검색 요약 정보
   */
  private static calculateSearchSummary(sentenceResults: SentenceResult[]) {
    const totalResults = sentenceResults.reduce((acc, sr) => acc + sr.found_count, 0);
    const totalSentences = sentenceResults.length;
    
    return {
      total_sentences: totalSentences,
      total_results: totalResults,
      average_per_sentence: totalSentences > 0 ? (totalResults / totalSentences).toFixed(1) : '0',
      search_time: 1.2 // 실제로는 측정된 시간으로 교체 필요
    };
  }
}
