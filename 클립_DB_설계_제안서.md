# 🗄️ 클립 관리 데이터베이스 설계 제안서

## 📊 현재 상황 분석

### 현재 구조
- **자막 DB**: `working_subtitles.db` - SQLite 기반 자막 검색 시스템
- **클립 관리**: JSON 파일 기반 메타데이터 관리 (`public/clips/*.json`)
- **물리 파일**: `public/clips/*.mp4`, `public/thumbnails/*.jpg`

### 현재 클립 메타데이터 구조
```typescript
interface ClipMetadata {
  id: string;                    // UUID
  title: string;                 // 클립 제목
  sentence: string;              // 검색된 문장
  englishSubtitle: string;       // 영어 자막
  koreanSubtitle: string;        // 한글 자막
  startTime: string;             // 시작 시간
  endTime: string;               // 종료 시간
  sourceFile: string;            // 원본 미디어 파일
  clipPath: string;              // 클립 파일 경로
  thumbnailPath?: string;        // 썸네일 경로
  createdAt: string;             // 생성 시간
  duration: string;              // 재생 시간
  tags: string[];                // 태그 배열
}
```

## 🎯 클립 관리 요구사항

1. **일괄 삭제**: 선택된 클립들을 한 번에 삭제
2. **카테고리 지정**: 클립을 주제별로 분류
3. **태그 지정**: 다중 태그로 세밀한 분류
4. **북마크**: 즐겨찾기 기능
5. **검색 및 필터링**: 메타데이터 기반 검색

## 🔄 DB 설계 방안 비교

### 방안 1: 독립 클립 DB 🆕
```sql
-- clips.db (새로운 독립 데이터베이스)
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
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    category_id INTEGER,
    view_count INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clip_tags (
    clip_id TEXT,
    tag_id INTEGER,
    PRIMARY KEY (clip_id, tag_id),
    FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_clips_category ON clips(category_id);
CREATE INDEX idx_clips_bookmarked ON clips(is_bookmarked);
CREATE INDEX idx_clips_created ON clips(created_at);
CREATE INDEX idx_clips_source ON clips(source_file);
```

**장점** ✅:
- 클립 전용 최적화 가능
- 기존 자막 DB와 독립적 운영
- 확장성 우수
- 백업/복원 독립적

**단점** ❌:
- DB 파일 2개 관리
- 자막 데이터와 연결 복잡

### 방안 2: 기존 DB 확장 🔄
```sql
-- working_subtitles.db 확장
ALTER TABLE subtitles ADD COLUMN source_media_hash TEXT;

CREATE TABLE clips (
    id TEXT PRIMARY KEY,
    subtitle_id INTEGER,              -- subtitles 테이블 참조
    title TEXT NOT NULL,
    clip_path TEXT NOT NULL,
    thumbnail_path TEXT,
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    category_id INTEGER,
    view_count INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (subtitle_id) REFERENCES subtitles(id)
);

-- 나머지 테이블은 방안 1과 동일
```

**장점** ✅:
- 하나의 DB 파일로 통합 관리
- 자막 데이터와 자연스러운 연결
- 조인 쿼리로 풍부한 검색 가능

**단점** ❌:
- 기존 자막 DB 구조 변경 위험
- 클립 기능이 자막 시스템에 종속

## 🎯 **추천: 독립 클립 DB (방안 1)**

### 선택 이유
1. **안정성**: 기존 자막 시스템에 영향 없음
2. **확장성**: 클립 전용 기능 자유롭게 추가 가능
3. **유지보수**: 각 시스템 독립적 관리
4. **성능**: 클립 검색 최적화 가능
5. **백업**: 클립 데이터만 별도 백업 가능

## 🛠️ 구현 계획

### Phase 1: 기초 클립 DB 구축
```typescript
// 클립 DB 관리 서비스
export class ClipDatabaseService {
  static async initDatabase(): Promise<void>
  static async createClip(metadata: ClipMetadata): Promise<boolean>
  static async getClips(filter?: ClipFilter): Promise<ClipMetadata[]>
  static async updateClip(id: string, updates: Partial<ClipMetadata>): Promise<boolean>
  static async deleteClip(id: string): Promise<boolean>
  static async deleteClips(ids: string[]): Promise<BatchResult>
}
```

### Phase 2: 카테고리 및 태그 시스템
```typescript
export class CategoryService {
  static async createCategory(name: string, description?: string): Promise<number>
  static async getCategories(): Promise<Category[]>
  static async assignCategory(clipId: string, categoryId: number): Promise<boolean>
}

export class TagService {
  static async createTag(name: string): Promise<number>
  static async getTags(): Promise<Tag[]>
  static async addTagToClip(clipId: string, tagId: number): Promise<boolean>
  static async removeTagFromClip(clipId: string, tagId: number): Promise<boolean>
}
```

### Phase 3: 북마크 및 고급 기능
```typescript
export class BookmarkService {
  static async toggleBookmark(clipId: string): Promise<boolean>
  static async getBookmarkedClips(): Promise<ClipMetadata[]>
}

export class ClipSearchService {
  static async searchClips(query: string, filters?: SearchFilter): Promise<ClipMetadata[]>
  static async getClipsByCategory(categoryId: number): Promise<ClipMetadata[]>
  static async getClipsByTag(tagId: number): Promise<ClipMetadata[]>
}
```

## 📁 파일 구조
```
theme-search/
├── public/
│   ├── working_subtitles.db     # 기존 자막 DB (변경 없음)
│   ├── clips.db                 # 새로운 클립 DB
│   ├── clips/                   # 클립 파일들
│   └── thumbnails/              # 썸네일들
├── src/app/api/
│   ├── clips-manage/            # 클립 관리 API
│   │   ├── route.ts             # 메인 CRUD API
│   │   ├── categories/route.ts  # 카테고리 API  
│   │   ├── tags/route.ts        # 태그 API
│   │   ├── bulk/route.ts        # 일괄 작업 API
│   │   └── services/
│   │       ├── clip-database.service.ts
│   │       ├── category.service.ts
│   │       ├── tag.service.ts
│   │       └── bookmark.service.ts
```

## 🔄 기존 시스템과의 통합

### JSON → DB 마이그레이션
```typescript
export class ClipMigrationService {
  static async migrateFromJSON(): Promise<{success: number, failed: number}> {
    // 기존 JSON 파일들을 DB로 마이그레이션
    // 1. public/clips/*.json 파일 스캔
    // 2. 각 JSON을 ClipMetadata로 파싱
    // 3. DB에 삽입
    // 4. 성공/실패 통계 반환
  }
}
```

### 기존 MetadataService 업데이트
```typescript
export class MetadataService {
  // 기존 JSON 저장 방식 유지 (호환성)
  static async saveMetadata(metadata: ClipMetadata): Promise<boolean>
  
  // 새로운 DB 저장 추가
  static async saveToDatabase(metadata: ClipMetadata): Promise<boolean>
}
```

## 🎯 다음 단계

1. **클립 DB 스키마 생성** - SQLite 파일 초기화
2. **기본 CRUD 서비스 구현** - ClipDatabaseService
3. **JSON → DB 마이그레이션 도구** - 기존 데이터 이전
4. **API 엔드포인트 구현** - REST API 제공
5. **프론트엔드 클립 관리 UI** - 사용자 인터페이스

이 구조로 구현하면 **안정적이고 확장 가능한 클립 관리 시스템**을 구축할 수 있습니다! 🚀
