// 클립 생성 관련 타입 정의
export interface SearchResult {
  media_file: string;
  subtitle_text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
  confidence: number;
  sentence?: string; // 원본 검색 문장 (선택적)
}

export interface SentenceResult {
  sentence_index: number;
  search_sentence: string;
  found_count: number;
  results: SearchResult[];
}

export interface ClipMetadata {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle: string;
  koreanSubtitle: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration: string;
  tags: string[];
}

export interface BatchResult {
  success: number;
  failed: number;
}

export interface ClipGenerationStats {
  total_requested: number;
  duplicates_removed: number;
  json_created: number;
  thumbnails_created: number;
  clips_created: number;
  total_time_seconds: number;
  stage_times: {
    json: number;
    thumbnails: number;
    clips: number;
  };
}
