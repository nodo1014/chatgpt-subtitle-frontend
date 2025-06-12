-- 렌더링 작업 관리를 위한 데이터베이스 스키마

-- 렌더링 작업 테이블
CREATE TABLE IF NOT EXISTS render_jobs (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'medium',
  output_format TEXT NOT NULL DEFAULT 'mp4',
  
  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER NOT NULL DEFAULT 0,    -- 0-100
  
  -- 시간 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  
  -- 결과 정보
  output_path TEXT,
  file_size INTEGER,
  duration REAL,
  error_message TEXT,
  
  -- 설정 정보 (JSON)
  text_overlay TEXT, -- JSON string
  custom_settings TEXT, -- JSON string
  
  -- 추가 메타데이터
  estimated_time INTEGER, -- 예상 소요 시간 (초)
  actual_time INTEGER     -- 실제 소요 시간 (초)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_render_jobs_clip_id ON render_jobs(clip_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at);

-- 렌더링 진행 로그 테이블 (선택적)
CREATE TABLE IF NOT EXISTS render_progress_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  progress INTEGER NOT NULL,
  operation TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_id) REFERENCES render_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_render_progress_logs_job_id ON render_progress_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_render_progress_logs_timestamp ON render_progress_logs(timestamp);
