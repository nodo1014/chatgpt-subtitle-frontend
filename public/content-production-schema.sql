-- 유튜브 컨텐츠 제작 시스템 DB 스키마
-- 생성일: 2025-06-12

-- 1. 컨텐츠 카테고리 테이블
CREATE TABLE IF NOT EXISTS content_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,           -- "비즈니스 영어", "여행 영어", "일상 대화"
  description TEXT,                     -- 카테고리 상세 설명
  icon VARCHAR(10),                     -- 이모지 아이콘
  category_type VARCHAR(20) NOT NULL,   -- "theme", "media", "expression_type"
  filter_conditions JSON NOT NULL,      -- 필터 조건 (JSON 형태)
  target_audience VARCHAR(50),          -- "beginner", "intermediate", "advanced"
  estimated_clips INTEGER DEFAULT 0,    -- 예상 클립 수
  is_active BOOLEAN DEFAULT 1,          -- 활성화 여부
  sort_order INTEGER DEFAULT 0,         -- 정렬 순서
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 유튜브 컨텐츠 시리즈 테이블
CREATE TABLE IF NOT EXISTS youtube_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_name VARCHAR(100) NOT NULL,    -- "프렌즈로 배우는 영어 100선"
  series_description TEXT,              -- 시리즈 설명
  thumbnail_url VARCHAR(255),           -- 시리즈 썸네일
  target_episode_count INTEGER DEFAULT 10, -- 목표 에피소드 수
  current_episode_count INTEGER DEFAULT 0, -- 현재 제작된 에피소드 수
  category_id INTEGER,                  -- 컨텐츠 카테고리 참조
  status VARCHAR(20) DEFAULT 'planning', -- "planning", "in_progress", "completed"
  upload_schedule VARCHAR(50),          -- "weekly", "daily", "monthly"
  estimated_views INTEGER DEFAULT 0,    -- 예상 조회수
  target_duration INTEGER DEFAULT 600,  -- 목표 영상 길이 (초)
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES content_categories(id)
);

-- 3. 시리즈 클립 매핑 테이블
CREATE TABLE IF NOT EXISTS series_clip_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL,
  subtitle_id INTEGER NOT NULL,         -- 기존 subtitles 테이블 참조
  episode_number INTEGER,               -- 시리즈 내 에피소드 번호
  clip_order INTEGER DEFAULT 0,         -- 에피소드 내 클립 순서
  clip_score FLOAT DEFAULT 0,           -- AI 품질 점수 (0-100)
  usage_type VARCHAR(20) DEFAULT 'main', -- "main", "intro", "outro", "transition"
  editing_notes TEXT,                   -- 편집 가이드/노트
  duration_start_ms INTEGER,            -- 클립 시작 시점 (밀리초)
  duration_end_ms INTEGER,              -- 클립 종료 시점 (밀리초)
  is_used BOOLEAN DEFAULT 0,            -- 실제 사용 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES youtube_series(id),
  FOREIGN KEY (subtitle_id) REFERENCES subtitles(id),
  UNIQUE(series_id, subtitle_id)
);

-- 4. 사이드바 메뉴 테이블
CREATE TABLE IF NOT EXISTS sidebar_menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,           -- 메뉴 이름
  icon VARCHAR(10),                     -- 이모지 아이콘
  menu_type VARCHAR(20) NOT NULL,       -- "category", "series", "tool", "external"
  target_id INTEGER,                    -- 연결된 ID (category_id 또는 series_id)
  url VARCHAR(255),                     -- 직접 URL (tool, external 타입용)
  parent_id INTEGER,                    -- 부모 메뉴 (계층 구조)
  workflow_stage VARCHAR(30),           -- "planning", "collection", "editing", "publishing"
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES sidebar_menus(id)
);

-- 5. 컨텐츠 제작 통계 테이블
CREATE TABLE IF NOT EXISTS production_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER,
  category_id INTEGER,
  action_type VARCHAR(50) NOT NULL,     -- "clip_added", "episode_created", "series_completed"
  clip_count INTEGER DEFAULT 0,         -- 처리된 클립 수
  total_duration_seconds INTEGER DEFAULT 0, -- 총 영상 길이
  estimated_views INTEGER DEFAULT 0,    -- 예상 조회수
  production_stage VARCHAR(30),         -- "research", "collection", "editing", "review"
  quality_score FLOAT DEFAULT 0,        -- 컨텐츠 품질 점수
  session_id VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES youtube_series(id),
  FOREIGN KEY (category_id) REFERENCES content_categories(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_categories_type ON content_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_youtube_series_status ON youtube_series(status);
CREATE INDEX IF NOT EXISTS idx_series_clip_mappings_series_id ON series_clip_mappings(series_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_menus_parent_id ON sidebar_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_production_analytics_series_id ON production_analytics(series_id);

-- 초기 데이터 삽입
INSERT OR IGNORE INTO content_categories (name, description, icon, category_type, filter_conditions, target_audience, sort_order) VALUES
('비즈니스 영어', '직장에서 사용하는 전문 영어 표현', '💼', 'theme', '{"keywords": ["business", "office", "meeting", "presentation"]}', 'intermediate', 1),
('여행 영어', '여행 시 필요한 실용 영어 표현', '✈️', 'theme', '{"keywords": ["travel", "airport", "hotel", "restaurant"]}', 'beginner', 2),
('일상 대화', '친구, 가족과의 자연스러운 대화', '🍽️', 'theme', '{"keywords": ["daily", "conversation", "friends", "family"]}', 'beginner', 3),
('감정 표현', '기쁨, 슬픔, 분노 등 감정을 나타내는 표현', '❤️', 'theme', '{"keywords": ["emotion", "feeling", "happy", "sad", "angry"]}', 'intermediate', 4),
('프렌즈 시리즈', 'Friends TV 시리즈의 모든 에피소드', '📺', 'media', '{"media": ["Friends"]}', 'intermediate', 5),
('디즈니 애니메이션', '디즈니 애니메이션 영화 컬렉션', '🎭', 'media', '{"media": ["Disney"]}', 'beginner', 6);

INSERT OR IGNORE INTO sidebar_menus (name, icon, menu_type, target_id, workflow_stage, sort_order) VALUES
('컨텐츠 제작 워크플로우', '🎬', 'tool', NULL, 'planning', 0),
('기획 단계', '📋', 'tool', NULL, 'planning', 1),
('클립 수집 단계', '🔍', 'tool', NULL, 'collection', 2),
('테마별 컨텐츠', '🏷️', 'category', NULL, 'collection', 3),
('진행 중인 시리즈', '🎥', 'series', NULL, 'editing', 4),
('제작 도구', '🛠️', 'tool', NULL, 'publishing', 5);
