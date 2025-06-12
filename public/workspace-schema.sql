-- v3 DB 관리 툴 - 워크스페이스 관리 스키마
-- 작업명으로 검색한 문장들을 관리하는 시스템

-- 워크스페이스 테이블 (작업명)
CREATE TABLE IF NOT EXISTS workspaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,    -- 작업명 (예: "비즈니스 영어 학습", "Friends 시즌1")
  description TEXT,                     -- 작업 설명
  workspace_type VARCHAR(20) DEFAULT 'learning', -- "learning", "content", "research"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  settings JSON                         -- 워크스페이스 설정 (JSON)
);

-- 워크스페이스 문장 테이블 (검색한 문장을 작업명으로 저장)
CREATE TABLE IF NOT EXISTS workspace_sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  subtitle_id INTEGER NOT NULL,         -- 기존 subtitles 테이블 참조
  sentence_text TEXT NOT NULL,          -- 선택된 문장
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source_file TEXT NOT NULL,
  
  -- 메타데이터 관리
  is_bookmarked BOOLEAN DEFAULT 0,      -- 북마크 여부
  category_name VARCHAR(50),            -- 카테고리 (자유형)
  tags JSON,                           -- 태그 배열 (JSON)
  korean_translation TEXT,             -- 한글 번역
  notes TEXT,                          -- 해설/메모
  difficulty_level VARCHAR(20),        -- "beginner", "intermediate", "advanced"
  
  -- 학습 관리
  study_count INTEGER DEFAULT 0,       -- 학습 횟수
  last_studied_at DATETIME,            -- 마지막 학습 시간
  mastery_level INTEGER DEFAULT 0,     -- 숙달도 (0-100)
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, subtitle_id)     -- 같은 워크스페이스에서 중복 방지
);

-- 번역 히스토리 테이블
CREATE TABLE IF NOT EXISTS translation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_sentence_id INTEGER NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  translation_type VARCHAR(20) DEFAULT 'manual', -- "manual", "ai", "deepl"
  translator_info VARCHAR(100),        -- 번역자 정보
  quality_score INTEGER DEFAULT 0,     -- 번역 품질 점수 (0-100)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_sentence_id) REFERENCES workspace_sentences(id) ON DELETE CASCADE
);

-- 북마크 컬렉션 테이블
CREATE TABLE IF NOT EXISTS bookmark_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL,
  collection_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- 컬렉션 색상
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 문장-북마크컬렉션 매핑 테이블
CREATE TABLE IF NOT EXISTS sentence_bookmark_mappings (
  workspace_sentence_id INTEGER NOT NULL,
  collection_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  
  PRIMARY KEY (workspace_sentence_id, collection_id),
  FOREIGN KEY (workspace_sentence_id) REFERENCES workspace_sentences(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES bookmark_collections(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workspace_sentences_workspace ON workspace_sentences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_sentences_bookmark ON workspace_sentences(is_bookmarked);
CREATE INDEX IF NOT EXISTS idx_workspace_sentences_category ON workspace_sentences(category_name);
CREATE INDEX IF NOT EXISTS idx_workspace_sentences_difficulty ON workspace_sentences(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workspace_sentences_studied ON workspace_sentences(last_studied_at);

-- 기본 데이터 삽입
INSERT OR IGNORE INTO workspaces (id, name, description, workspace_type) VALUES 
  (1, '기본 워크스페이스', '기본 작업 공간', 'learning'),
  (2, 'Friends 학습', 'Friends 드라마를 활용한 영어 학습', 'learning'),
  (3, '비즈니스 영어', '비즈니스 상황 영어 표현 수집', 'content');

INSERT OR IGNORE INTO bookmark_collections (id, workspace_id, collection_name, description, color) VALUES 
  (1, 1, '즐겨찾기', '자주 사용하는 표현', '#F59E0B'),
  (2, 1, '어려운 문장', '이해하기 어려운 문장들', '#EF4444'),
  (3, 1, '완료된 학습', '학습을 완료한 문장들', '#10B981'),
  (4, 2, 'Friends 명대사', 'Friends의 인상깊은 대사들', '#8B5CF6'),
  (5, 3, '회의 표현', '회의에서 사용하는 표현', '#3B82F6');
