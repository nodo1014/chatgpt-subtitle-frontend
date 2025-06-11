
import path from 'path';
import Database from 'better-sqlite3';
import { SearchResult, DatabaseRow } from '../types';
import { calculateConfidence, calculateFallbackConfidence } from '../utils';

// DB 연결 캐시
let db: Database.Database | null = null;

/**
 * 데이터베이스 연결 관리 클래스
 */
export class DatabaseService {
  /**
   * 데이터베이스 인스턴스 가져오기
   */
  private static getDatabase(): Database.Database {
    if (!db) {
      const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
      db = new Database(dbPath, { readonly: true });
      console.log('📊 DB 연결됨:', dbPath);
      
      // FTS 동기화 상태 확인 (첫 연결 시에만)
      this.checkFTSSync();
    }
    return db;
  }

  /**
   * FTS 테이블 동기화 상태 확인 및 경고
   */
  private static checkFTSSync(): void {
    try {
      if (!db) return;
      
      const subtitlesCount = db.prepare("SELECT COUNT(*) as count FROM subtitles").get() as { count: number };
      const ftsCount = db.prepare("SELECT COUNT(*) as count FROM subtitles_fts").get() as { count: number };
      
      const diff = subtitlesCount.count - ftsCount.count;
      
      if (diff > 0) {
        console.log(`⚠️ FTS 동기화 필요: ${diff}개 레코드 차이`);
        console.log('💡 해결 방법: node fts-sync-manager.js 실행');
      } else if (diff === 0) {
        console.log('✅ FTS 완전 동기화됨');
      }
      
    } catch (error) {
      console.error('FTS 동기화 확인 실패:', error);
    }
  }

  /**
   * FTS(Full Text Search)를 사용한 검색
   * @param query 검색 쿼리
   * @param limit 결과 개수 제한
   * @returns 검색 결과 배열
   */
  static searchWithFTS(query: string, limit: number): SearchResult[] {
    try {
      const database = this.getDatabase();
      console.log(`🔍 FTS 검색: "${query}" (limit: ${limit})`);
      
      // 1단계: 정확한 문구 검색 시도
      let results: DatabaseRow[] = [];
      
      // 따옴표로 감싸서 정확한 문구 검색
      const exactQuery = `"${query}"`;
      const exactStmt = database.prepare(`
        SELECT s.media_file, s.text, s.start_time, s.end_time, s.language, s.directory,
               rank
        FROM subtitles_fts fts
        JOIN subtitles s ON s.id = fts.rowid
        WHERE fts.text MATCH ?
        ORDER BY rank
        LIMIT ?
      `);
      
      try {
        results = exactStmt.all(exactQuery, limit) as DatabaseRow[];
        console.log(`📊 정확한 문구 FTS 검색 결과: ${results.length}개`);
      } catch (exactError: any) {
        console.log(`⚠️ 정확한 문구 검색 실패: ${exactError.message}`);
      }
      
      // 2단계: 결과가 부족하면 AND 조건으로 개별 단어 검색
      if (results.length < Math.max(3, Math.ceil(limit / 2))) {
        const words = query.split(/\s+/).filter(word => word.length > 2);
        if (words.length > 1) {
          const andQuery = words.join(' AND ');
          console.log(`🔍 AND 조건 검색: "${andQuery}"`);
          
          try {
            const andStmt = database.prepare(`
              SELECT s.media_file, s.text, s.start_time, s.end_time, s.language, s.directory,
                     rank
              FROM subtitles_fts fts
              JOIN subtitles s ON s.id = fts.rowid
              WHERE fts.text MATCH ?
              ORDER BY rank
              LIMIT ?
            `);
            
            const andResults = andStmt.all(andQuery, limit) as DatabaseRow[];
            console.log(`📊 AND 조건 검색 결과: ${andResults.length}개`);
            
            // 중복 제거하면서 합치기
            const seenTexts = new Set(results.map(r => r.text));
            for (const andResult of andResults) {
              if (results.length >= limit) break;
              if (!seenTexts.has(andResult.text)) {
                results.push(andResult);
                seenTexts.add(andResult.text);
              }
            }
          } catch (andError: any) {
            console.log(`⚠️ AND 조건 검색 실패: ${andError.message}`);
          }
        }
      }
      
      console.log(`📊 최종 FTS 검색 결과: ${results.length}개`);
      
      return results.map((row, index) => ({
        media_file: row.media_file,
        subtitle_text: row.text,
        start_time: row.start_time,
        end_time: row.end_time,
        language: row.language,
        directory: row.directory,
        confidence: calculateConfidence(index)
      }));

    } catch (error) {
      console.error('FTS 검색 오류:', error);
      throw error;
    }
  }

  /**
   * LIKE를 사용한 폴백 검색 (정확성 우선)
   * @param query 검색 쿼리
   * @param limit 결과 개수 제한
   * @returns 검색 결과 배열
   */
  static searchWithLike(query: string, limit: number): SearchResult[] {
    try {
      const database = this.getDatabase();
      console.log(`🔍 폴백 LIKE 검색: "${query}" (limit: ${limit})`);
      
      // 1단계: 전체 문구로 정확히 검색
      const exactStmt = database.prepare(`
        SELECT media_file, text, start_time, end_time, language, directory
        FROM subtitles 
        WHERE text LIKE ? COLLATE NOCASE
        ORDER BY length(text), media_file, start_time
        LIMIT ?
      `);
      
      let results = exactStmt.all(`%${query}%`, limit) as DatabaseRow[];
      console.log(`📊 전체 문구 LIKE 검색 결과: ${results.length}개`);
      
      // 2단계: 결과가 매우 부족하면 주요 단어들로 보완 검색
      if (results.length < Math.max(2, Math.ceil(limit / 3))) {
        const words = query.split(/\s+/).filter(word => word.length > 3); // 4글자 이상만
        console.log(`🔍 주요 단어 보완 검색: [${words.join(', ')}]`);
        
        if (words.length > 1) {
          const seenTexts = new Set(results.map(r => r.text));
          
          // 모든 주요 단어를 포함하는 문장 찾기
          const allWordsStmt = database.prepare(`
            SELECT media_file, text, start_time, end_time, language, directory
            FROM subtitles 
            WHERE ${words.map(() => 'text LIKE ? COLLATE NOCASE').join(' AND ')}
            ORDER BY length(text), media_file, start_time
            LIMIT ?
          `);
          
          const allWordsParams = [...words.map(word => `%${word}%`), limit];
          const allWordsResults = allWordsStmt.all(...allWordsParams) as DatabaseRow[];
          
          console.log(`📊 모든 주요 단어 포함 결과: ${allWordsResults.length}개`);
          
          // 중복 제거하면서 추가
          for (const wordResult of allWordsResults) {
            if (results.length >= limit) break;
            if (!seenTexts.has(wordResult.text)) {
              results.push(wordResult);
              seenTexts.add(wordResult.text);
            }
          }
        }
      }
      
      // limit 적용
      results = results.slice(0, limit);
      console.log(`📊 최종 LIKE 검색 결과: ${results.length}개`);
      
      return results.map((row, index) => ({
        media_file: row.media_file,
        subtitle_text: row.text,
        start_time: row.start_time,
        end_time: row.end_time,
        language: row.language,
        directory: row.directory,
        confidence: calculateFallbackConfidence(index)
      }));
      
    } catch (error) {
      console.error('폴백 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스에서 검색 (FTS 우선, 결과가 부족하면 LIKE로 보완)
   * @param query 검색 쿼리
   * @param limit 결과 개수 제한
   * @returns 검색 결과 배열
   */
  static searchInDatabase(query: string, limit: number): SearchResult[] {
    try {
      // FTS 검색 시도
      const ftsResults = this.searchWithFTS(query, limit);
      
      // FTS 결과가 충분하면 반환 (최소 3개 또는 요청된 개수의 절반 이상)
      const minimumResults = Math.max(3, Math.ceil(limit / 2));
      if (ftsResults.length >= minimumResults) {
        console.log(`✅ FTS 검색 충분: ${ftsResults.length}개 결과`);
        return ftsResults;
      }
      
      // FTS 결과가 부족하면 LIKE 검색으로 보완
      console.log(`🔄 FTS 결과 부족 (${ftsResults.length}개), LIKE 검색으로 보완`);
      const likeResults = this.searchWithLike(query, limit);
      
      // FTS와 LIKE 결과 합치기 (중복 제거)
      const combinedResults = [...ftsResults];
      const seenTexts = new Set(ftsResults.map(r => r.subtitle_text));
      
      for (const likeResult of likeResults) {
        if (combinedResults.length >= limit) break;
        if (!seenTexts.has(likeResult.subtitle_text)) {
          combinedResults.push(likeResult);
          seenTexts.add(likeResult.subtitle_text);
        }
      }
      
      console.log(`✅ 통합 검색 완료: FTS ${ftsResults.length}개 + LIKE 추가 ${combinedResults.length - ftsResults.length}개 = 총 ${combinedResults.length}개`);
      return combinedResults.slice(0, limit);
      
    } catch (ftsError) {
      console.error('FTS 검색 실패, 폴백 모드로 전환:', ftsError);
      
      try {
        // 폴백: LIKE 검색만 사용
        return this.searchWithLike(query, limit);
      } catch (fallbackError) {
        console.error('폴백 검색도 실패:', fallbackError);
        return [];
      }
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  static closeDatabase(): void {
    if (db) {
      db.close();
      db = null;
      console.log('📊 DB 연결 종료됨');
    }
  }
}
