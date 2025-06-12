// 렌더링 작업 데이터베이스 관리 서비스

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs/promises';

export interface RenderJob {
  id: string;
  clipId: string;
  pattern: string;
  quality: string;
  outputFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  outputPath?: string;
  fileSize?: number;
  duration?: number;
  errorMessage?: string;
  textOverlay?: string; // JSON string
  customSettings?: string; // JSON string
  estimatedTime?: number;
  actualTime?: number;
}

export interface RenderProgressLog {
  id: number;
  jobId: string;
  stage: string;
  progress: number;
  operation?: string;
  timestamp: string;
}

let db: Database.Database | null = null;

export class RenderJobService {
  
  /**
   * 데이터베이스 연결 및 초기화
   */
  private static async getDatabase(): Promise<Database.Database> {
    if (!db) {
      const dbPath = path.join(process.cwd(), 'public', 'render_jobs.db');
      db = new Database(dbPath);
      
      // 스키마 적용
      await this.initializeSchema();
      
      console.log('📊 렌더링 작업 DB 연결:', dbPath);
    }
    return db;
  }

  /**
   * 데이터베이스 스키마 초기화
   */
  private static async initializeSchema(): Promise<void> {
    if (!db) return;

    try {
      const schemaPath = path.join(process.cwd(), 'public', 'render-jobs-schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf-8');
      
      // SQL 문을 세미콜론으로 분할하여 실행
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement);
        }
      }
      
      console.log('✅ 렌더링 작업 DB 스키마 초기화 완료');
    } catch (error) {
      console.error('❌ 렌더링 작업 DB 스키마 초기화 실패:', error);
    }
  }

  /**
   * 새 렌더링 작업 생성
   */
  static async createJob(job: Omit<RenderJob, 'createdAt' | 'status' | 'progress'>): Promise<RenderJob> {
    const database = await this.getDatabase();
    
    const newJob: RenderJob = {
      ...job,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    const stmt = database.prepare(`
      INSERT INTO render_jobs (
        id, clip_id, pattern, quality, output_format, status, progress,
        created_at, text_overlay, custom_settings, estimated_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newJob.id,
      newJob.clipId,
      newJob.pattern,
      newJob.quality,
      newJob.outputFormat,
      newJob.status,
      newJob.progress,
      newJob.createdAt,
      newJob.textOverlay || null,
      newJob.customSettings || null,
      newJob.estimatedTime || null
    );

    console.log('✅ 렌더링 작업 생성:', newJob.id);
    return newJob;
  }

  /**
   * 작업 상태 업데이트
   */
  static async updateJobStatus(
    jobId: string, 
    updates: Partial<Pick<RenderJob, 'status' | 'progress' | 'startedAt' | 'completedAt' | 'outputPath' | 'fileSize' | 'duration' | 'errorMessage' | 'actualTime'>>
  ): Promise<boolean> {
    const database = await this.getDatabase();
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // camelCase를 snake_case로 변환
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(jobId);
    
    const stmt = database.prepare(`
      UPDATE render_jobs 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes > 0) {
      console.log(`📊 렌더링 작업 업데이트: ${jobId} - ${JSON.stringify(updates)}`);
      return true;
    }
    
    return false;
  }

  /**
   * 작업 조회
   */
  static async getJob(jobId: string): Promise<RenderJob | null> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      SELECT 
        id, clip_id as clipId, pattern, quality, output_format as outputFormat,
        status, progress, created_at as createdAt, started_at as startedAt,
        completed_at as completedAt, output_path as outputPath, file_size as fileSize,
        duration, error_message as errorMessage, text_overlay as textOverlay,
        custom_settings as customSettings, estimated_time as estimatedTime,
        actual_time as actualTime
      FROM render_jobs 
      WHERE id = ?
    `);

    return stmt.get(jobId) as RenderJob | null;
  }

  /**
   * 클립별 작업 목록 조회
   */
  static async getJobsByClip(clipId: string): Promise<RenderJob[]> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      SELECT 
        id, clip_id as clipId, pattern, quality, output_format as outputFormat,
        status, progress, created_at as createdAt, started_at as startedAt,
        completed_at as completedAt, output_path as outputPath, file_size as fileSize,
        duration, error_message as errorMessage, text_overlay as textOverlay,
        custom_settings as customSettings, estimated_time as estimatedTime,
        actual_time as actualTime
      FROM render_jobs 
      WHERE clip_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(clipId) as RenderJob[];
  }

  /**
   * 활성 작업 목록 조회
   */
  static async getActiveJobs(): Promise<RenderJob[]> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      SELECT 
        id, clip_id as clipId, pattern, quality, output_format as outputFormat,
        status, progress, created_at as createdAt, started_at as startedAt,
        completed_at as completedAt, output_path as outputPath, file_size as fileSize,
        duration, error_message as errorMessage, text_overlay as textOverlay,
        custom_settings as customSettings, estimated_time as estimatedTime,
        actual_time as actualTime
      FROM render_jobs 
      WHERE status IN ('pending', 'processing')
      ORDER BY created_at ASC
    `);

    return stmt.all() as RenderJob[];
  }

  /**
   * 최근 작업 목록 조회
   */
  static async getRecentJobs(limit: number = 50): Promise<RenderJob[]> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      SELECT 
        id, clip_id as clipId, pattern, quality, output_format as outputFormat,
        status, progress, created_at as createdAt, started_at as startedAt,
        completed_at as completedAt, output_path as outputPath, file_size as fileSize,
        duration, error_message as errorMessage, text_overlay as textOverlay,
        custom_settings as customSettings, estimated_time as estimatedTime,
        actual_time as actualTime
      FROM render_jobs 
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return stmt.all(limit) as RenderJob[];
  }

  /**
   * 진행 로그 추가
   */
  static async addProgressLog(jobId: string, stage: string, progress: number, operation?: string): Promise<void> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      INSERT INTO render_progress_logs (job_id, stage, progress, operation)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(jobId, stage, progress, operation || null);
  }

  /**
   * 작업별 진행 로그 조회
   */
  static async getProgressLogs(jobId: string): Promise<RenderProgressLog[]> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare(`
      SELECT 
        id, job_id as jobId, stage, progress, operation, timestamp
      FROM render_progress_logs 
      WHERE job_id = ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(jobId) as RenderProgressLog[];
  }

  /**
   * 오래된 작업 정리 (30일 이상)
   */
  static async cleanupOldJobs(): Promise<number> {
    const database = await this.getDatabase();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stmt = database.prepare(`
      DELETE FROM render_jobs 
      WHERE created_at < ? AND status IN ('completed', 'failed')
    `);

    const result = stmt.run(thirtyDaysAgo.toISOString());
    
    if (result.changes > 0) {
      console.log(`🧹 오래된 렌더링 작업 정리: ${result.changes}개 삭제`);
    }
    
    return result.changes;
  }

  /**
   * 작업 통계 조회
   */
  static async getJobStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageTime: number;
  }> {
    const database = await this.getDatabase();
    
    const totalStmt = database.prepare('SELECT COUNT(*) as count FROM render_jobs');
    const statusStmt = database.prepare(`
      SELECT status, COUNT(*) as count 
      FROM render_jobs 
      GROUP BY status
    `);
    const avgTimeStmt = database.prepare(`
      SELECT AVG(actual_time) as avg_time 
      FROM render_jobs 
      WHERE status = 'completed' AND actual_time IS NOT NULL
    `);

    const total = (totalStmt.get() as any).count;
    const statusCounts = statusStmt.all() as any[];
    const avgTimeResult = avgTimeStmt.get() as any;
    
    const stats = {
      total,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      averageTime: avgTimeResult?.avg_time || 0
    };

    for (const statusCount of statusCounts) {
      stats[statusCount.status as keyof typeof stats] = statusCount.count;
    }

    return stats;
  }

  /**
   * 작업 삭제
   */
  static async deleteJob(jobId: string): Promise<boolean> {
    const database = await this.getDatabase();
    
    const stmt = database.prepare('DELETE FROM render_jobs WHERE id = ?');
    const result = stmt.run(jobId);
    
    if (result.changes > 0) {
      console.log(`🗑️ 렌더링 작업 삭제: ${jobId}`);
      return true;
    }
    
    return false;
  }

  /**
   * 데이터베이스 연결 종료
   */
  static async closeDatabase(): Promise<void> {
    if (db) {
      db.close();
      db = null;
      console.log('📊 렌더링 작업 DB 연결 종료');
    }
  }
}
