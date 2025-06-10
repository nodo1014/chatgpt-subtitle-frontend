-- 클립 관리 데이터베이스 스키마
-- filepath: /home/kang/docker/youtube/indexer/indexer_v2/theme-search/public/clips-schema.sql

-- 클립 메타데이터 테이블
CREATE TABLE clips (
    id TEXT PRIMARY KEY,              -- UUID
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

-- 카테고리 테이블
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 태그 테이블
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#10B981',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 클립-태그 관계 테이블 (다대다)
CREATE TABLE clip_tags (
    clip_id TEXT,
    tag_id INTEGER,
    PRIMARY KEY (clip_id, tag_id),
    FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 성능을 위한 인덱스
CREATE INDEX idx_clips_category ON clips(category_id);
CREATE INDEX idx_clips_bookmarked ON clips(is_bookmarked);
CREATE INDEX idx_clips_created ON clips(created_at);
CREATE INDEX idx_clips_source ON clips(source_file);
CREATE INDEX idx_clips_title ON clips(title);
CREATE INDEX idx_clips_sentence ON clips(sentence);

-- 기본 카테고리 데이터
INSERT INTO categories (name, description, color) VALUES 
('일반', '기본 카테고리', '#3B82F6'),
('즐겨찾기', '북마크된 클립', '#F59E0B'),
('학습', '학습용 클립', '#10B981'),
('예제', '예제 클립', '#8B5CF6');

-- 기본 태그 데이터
INSERT INTO tags (name, color) VALUES 
('auto-generated', '#6B7280'),
('completed', '#10B981'),
('Friends', '#F59E0B'),
('Drama', '#8B5CF6'),
('학습', '#3B82F6');
