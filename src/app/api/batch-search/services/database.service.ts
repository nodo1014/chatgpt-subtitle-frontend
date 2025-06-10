
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
    }
    return db;
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
      
      const stmt = database.prepare(`
        SELECT s.media_file, s.text, s.start_time, s.end_time, s.language, s.directory,
               rank
        FROM subtitles_fts fts
        JOIN subtitles s ON s.id = fts.rowid
        WHERE fts.text MATCH ?
        ORDER BY rank
        LIMIT ?
      `);
      
      const results = stmt.all(query, limit) as DatabaseRow[];
      console.log(`📊 FTS 검색 결과: ${results.length}개`);
      
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
   * LIKE를 사용한 폴백 검색 (전체 문구 + 개별 단어 검색)
   * @param query 검색 쿼리
   * @param limit 결과 개수 제한
   * @returns 검색 결과 배열
   */
  static searchWithLike(query: string, limit: number): SearchResult[] {
    try {
      const database = this.getDatabase();
      console.log(`🔍 폴백 LIKE 검색: "${query}" (limit: ${limit})`);
      
      // 먼저 전체 문구로 검색
      const stmt = database.prepare(`
        SELECT media_file, text, start_time, end_time, language, directory
        FROM subtitles 
        WHERE text LIKE ? COLLATE NOCASE
        ORDER BY media_file, start_time
        LIMIT ?
      `);
      
      let results = stmt.all(`%${query}%`, limit) as DatabaseRow[];
      console.log(`📊 전체 문구 검색 결과: ${results.length}개`);
      
      // 결과가 부족하면 개별 단어로 검색
      if (results.length < Math.max(3, limit / 2)) {
        const words = query.split(/\s+/).filter(word => word.length > 2); // 3글자 이상 단어만
        console.log(`🔍 개별 단어 검색: [${words.join(', ')}]`);
        
        const seenTexts = new Set(results.map(r => r.text));
        
        for (const word of words) {
          if (results.length >= limit) break;
          
          const wordStmt = database.prepare(`
            SELECT media_file, text, start_time, end_time, language, directory
            FROM subtitles 
            WHERE text LIKE ? COLLATE NOCASE
            ORDER BY media_file, start_time
            LIMIT ?
          `);
          
          const wordResults = wordStmt.all(`%${word}%`, limit * 2) as DatabaseRow[];
          
          // 중복 제거하면서 추가
          for (const wordResult of wordResults) {
            if (results.length >= limit) break;
            if (!seenTexts.has(wordResult.text)) {
              results.push(wordResult);
              seenTexts.add(wordResult.text);
            }
          }
          
          console.log(`📊 "${word}" 검색으로 추가, 현재 총 ${results.length}개`);
        }
      }
      
      // limit 적용
      results = results.slice(0, limit);
      console.log(`📊 최종 폴백 검색 결과: ${results.length}개`);
      
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
   * 데이터베이스에서 검색 (FTS 우선, 실패 시 또는 결과 없을 시 LIKE 폴백)
   * @param query 검색 쿼리
   * @param limit 결과 개수 제한
   * @returns 검색 결과 배열
   */
  static searchInDatabase(query: string, limit: number): SearchResult[] {
    try {
      // FTS 검색 시도
      const ftsResults = this.searchWithFTS(query, limit);
      
      // FTS 결과가 있으면 반환
      if (ftsResults.length > 0) {
        console.log(`✅ FTS 검색 성공: ${ftsResults.length}개 결과`);
        return ftsResults;
      }
      
      // FTS 결과가 없으면 LIKE 검색으로 폴백
      console.log('🔄 FTS 결과 없음, LIKE 검색으로 폴백');
      return this.searchWithLike(query, limit);
      
    } catch (ftsError) {
      console.error('FTS 검색 실패, 폴백 모드로 전환:', ftsError);
      
      try {
        // 폴백: LIKE 검색
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
