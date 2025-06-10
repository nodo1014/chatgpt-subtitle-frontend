import Database from 'better-sqlite3';
import { join } from 'path';

/**
 * 클립 메타데이터 인터페이스
 */
export interface ClipMetadata {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle?: string;
  koreanSubtitle?: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration?: string;
  tags: string[];
  isBookmarked?: boolean;
  categoryId?: number;
  viewCount?: number;
  rating?: number;
  notes?: string;
}

/**
 * 카테고리 인터페이스
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

/**
 * 태그 인터페이스
 */
export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

/**
 * 검색 필터 인터페이스
 */
export interface ClipFilter {
  categoryId?: number;
  tagIds?: number[];
  isBookmarked?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * 배치 작업 결과
 */
export interface BatchResult {
  success: number;
  failed: number;
  details: Array<{id: string, success: boolean, error?: string}>;
}

/**
 * 클립 데이터베이스 관리 서비스
 */
export class ClipDatabaseService {
  private static dbPath = join(process.cwd(), 'public', 'clips.db');
  private static db: Database.Database | null = null;

  /**
   * 데이터베이스 초기화
   */
  static async initDatabase(): Promise<void> {
    try {
      // 이미 초기화된 경우 스킵
      if (this.db) {
        return;
      }

      this.db = new Database(this.dbPath);
      
      // 테이블 존재 여부 확인
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clips'").all();
      
      if (tables.length === 0) {
        // 테이블이 없으면 생성
        console.log('🔨 클립 데이터베이스 테이블 생성 중...');
        this.createBasicTables();
        console.log('✅ 클립 데이터베이스 초기화 완료');
      } else {
        console.log('✅ 클립 데이터베이스 연결 완료 (기존 테이블 사용)');
      }
    } catch (error) {
      console.error('❌ 클립 데이터베이스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 테이블 생성
   */
  private static createBasicTables(): void {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다');

    const schema = `
      CREATE TABLE IF NOT EXISTS clips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        sentence TEXT NOT NULL,
        english_subtitle TEXT,
        korean_subtitle TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        source_file TEXT NOT NULL,
        clip_path TEXT NOT NULL,
        thumbnail_path TEXT,
        duration_seconds REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_bookmarked BOOLEAN DEFAULT FALSE,
        category_id INTEGER,
        view_count INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 0,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#10B981',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clip_tags (
        clip_id TEXT,
        tag_id INTEGER,
        PRIMARY KEY (clip_id, tag_id),
        FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_clips_category ON clips(category_id);
      CREATE INDEX IF NOT EXISTS idx_clips_bookmarked ON clips(is_bookmarked);
      CREATE INDEX IF NOT EXISTS idx_clips_created ON clips(created_at);
      CREATE INDEX IF NOT EXISTS idx_clips_source ON clips(source_file);
      CREATE INDEX IF NOT EXISTS idx_clips_title ON clips(title);
      CREATE INDEX IF NOT EXISTS idx_clips_sentence ON clips(sentence);

      -- 기본 데이터 삽입
      INSERT OR IGNORE INTO categories (id, name, description, color) VALUES 
        (1, '일반', '기본 카테고리', '#3B82F6'),
        (2, '즐겨찾기', '북마크된 클립', '#F59E0B'),
        (3, '학습', '학습용 클립', '#10B981'),
        (4, '예제', '예제 클립', '#8B5CF6');

      INSERT OR IGNORE INTO tags (name, color) VALUES 
        ('auto-generated', '#6B7280'),
        ('completed', '#10B981'),
        ('Friends', '#F59E0B'),
        ('Drama', '#8B5CF6'),
        ('학습', '#3B82F6');
    `;

    this.db.exec(schema);
  }

  /**
   * 데이터베이스 연결 가져오기
   */
  private static getDb(): Database.Database {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다. initDatabase()를 먼저 호출하세요.');
    }
    return this.db;
  }

  /**
   * 클립 생성
   */
  static async createClip(metadata: ClipMetadata): Promise<boolean> {
    try {
      const db = this.getDb();
      
      // 시간 파싱
      const durationSeconds = this.parseDuration(metadata.duration);
      
      const stmt = db.prepare(`
        INSERT INTO clips (
          id, title, sentence, english_subtitle, korean_subtitle,
          start_time, end_time, source_file, clip_path, thumbnail_path,
          duration_seconds, created_at, is_bookmarked, category_id, view_count, rating, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        metadata.id,
        metadata.title,
        metadata.sentence,
        metadata.englishSubtitle || null,
        metadata.koreanSubtitle || null,
        metadata.startTime,
        metadata.endTime,
        metadata.sourceFile,
        metadata.clipPath,
        metadata.thumbnailPath || null,
        durationSeconds,
        metadata.createdAt,
        metadata.isBookmarked ? 1 : 0,  // SQLite에서는 boolean을 숫자로
        metadata.categoryId || 1,
        metadata.viewCount || 0,
        metadata.rating || 0,
        metadata.notes || null
      );

      // 태그 연결
      if (metadata.tags && metadata.tags.length > 0) {
        await this.updateClipTags(metadata.id, metadata.tags);
      }

      console.log(`✅ 클립 DB 저장 완료: ${metadata.id}`);
      return true;
    } catch (error) {
      console.error(`❌ 클립 DB 저장 실패: ${metadata.id}`, error);
      return false;
    }
  }

  /**
   * 클립 조회
   */
  static async getClips(filter?: ClipFilter): Promise<ClipMetadata[]> {
    const db = this.getDb();
    
    let query = `
      SELECT c.*, 
             cat.name as category_name,
             GROUP_CONCAT(t.name) as tag_names
      FROM clips c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN clip_tags ct ON c.id = ct.clip_id
      LEFT JOIN tags t ON ct.tag_id = t.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter) {
      if (filter.categoryId) {
        conditions.push('c.category_id = ?');
        params.push(filter.categoryId);
      }
      
      if (filter.isBookmarked !== undefined) {
        conditions.push('c.is_bookmarked = ?');
        params.push(filter.isBookmarked);
      }
      
      if (filter.search) {
        conditions.push('(c.title LIKE ? OR c.sentence LIKE ?)');
        params.push(`%${filter.search}%`, `%${filter.search}%`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      
      if (filter.offset) {
        query += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    const rows = db.prepare(query).all(...params);
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      sentence: row.sentence,
      englishSubtitle: row.english_subtitle,
      koreanSubtitle: row.korean_subtitle,
      startTime: row.start_time,
      endTime: row.end_time,
      sourceFile: row.source_file,
      clipPath: row.clip_path,
      thumbnailPath: row.thumbnail_path,
      createdAt: row.created_at,
      duration: this.formatDuration(row.duration_seconds),
      tags: row.tag_names ? row.tag_names.split(',') : [],
      isBookmarked: Boolean(row.is_bookmarked),
      categoryId: row.category_id,
      viewCount: row.view_count,
      rating: row.rating,
      notes: row.notes
    }));
  }

  /**
   * 클립 업데이트
   */
  static async updateClip(id: string, updates: Partial<ClipMetadata>): Promise<boolean> {
    try {
      const db = this.getDb();
      
      const fields: string[] = [];
      const params: any[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        params.push(updates.title);
      }
      
      if (updates.isBookmarked !== undefined) {
        fields.push('is_bookmarked = ?');
        params.push(updates.isBookmarked ? 1 : 0);  // SQLite에서는 boolean을 숫자로
      }
      
      if (updates.categoryId !== undefined) {
        fields.push('category_id = ?');
        params.push(updates.categoryId);
      }
      
      if (updates.rating !== undefined) {
        fields.push('rating = ?');
        params.push(updates.rating);
      }
      
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        params.push(updates.notes);
      }

      if (fields.length === 0) {
        return true; // 업데이트할 내용이 없음
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE clips SET ${fields.join(', ')} WHERE id = ?`;
      const result = db.prepare(query).run(...params);

      if (updates.tags) {
        await this.updateClipTags(id, updates.tags);
      }

      return result.changes > 0;
    } catch (error) {
      console.error(`❌ 클립 업데이트 실패: ${id}`, error);
      return false;
    }
  }

  /**
   * 클립 삭제
   */
  static async deleteClip(id: string): Promise<boolean> {
    try {
      const db = this.getDb();
      const result = db.prepare('DELETE FROM clips WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error(`❌ 클립 삭제 실패: ${id}`, error);
      return false;
    }
  }

  /**
   * 클립 일괄 삭제
   */
  static async deleteClips(ids: string[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: 0,
      failed: 0,
      details: []
    };

    for (const id of ids) {
      const success = await this.deleteClip(id);
      result.details.push({ id, success });
      
      if (success) {
        result.success++;
      } else {
        result.failed++;
      }
    }

    return result;
  }

  /**
   * 클립 태그 업데이트
   */
  private static async updateClipTags(clipId: string, tagNames: string[]): Promise<void> {
    const db = this.getDb();
    
    // 기존 태그 연결 삭제
    db.prepare('DELETE FROM clip_tags WHERE clip_id = ?').run(clipId);
    
    // 새 태그 연결
    for (const tagName of tagNames) {
      let tagId = await this.findOrCreateTag(tagName);
      db.prepare('INSERT OR IGNORE INTO clip_tags (clip_id, tag_id) VALUES (?, ?)').run(clipId, tagId);
    }
  }

  /**
   * 태그 찾기 또는 생성
   */
  private static async findOrCreateTag(name: string): Promise<number> {
    const db = this.getDb();
    
    // 기존 태그 찾기
    const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name);
    if (existing) {
      return (existing as any).id;
    }
    
    // 새 태그 생성
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
    return result.lastInsertRowid as number;
  }

  /**
   * 지속시간 파싱 (예: "3.7069999999999936초" → 3.707)
   */
  private static parseDuration(durationStr?: string): number | null {
    if (!durationStr) return null;
    
    const match = durationStr.match(/^([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * 지속시간 포맷팅 (초 → "3.71초")
   */
  private static formatDuration(seconds?: number): string | undefined {
    if (seconds === null || seconds === undefined) return undefined;
    return `${seconds.toFixed(2)}초`;
  }

  /**
   * 카테고리 목록 조회
   */
  static async getCategories(): Promise<Category[]> {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
    
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: row.created_at
    }));
  }

  /**
   * 태그 목록 조회
   */
  static async getTags(): Promise<Tag[]> {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM tags ORDER BY name').all();
    
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at
    }));
  }

  /**
   * 데이터베이스 연결 종료
   */
  static close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
