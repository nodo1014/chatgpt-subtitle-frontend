// Results 페이지 관련 타입 정의

export interface SearchResult {
  media_file: string;
  subtitle_text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
  confidence: number;
}

export interface SentenceResult {
  sentence_index: number;
  search_sentence: string;
  found_count: number;
  results: SearchResult[];
}

export interface SearchSummary {
  total_sentences: number;
  total_results: number;
  search_time: number;
  unique_files: number;
}

export interface SearchData {
  sentence_results: SentenceResult[];
  search_summary: SearchSummary;
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

export interface HistoryItem {
  title: string;
  count: number;
  timestamp: string;
}

export interface AutoClipProgress {
  isCreating: boolean;
  progress: number;
  total: number;
  current: string;
}

export type ViewMode = 'search' | 'clips';

export interface ClippingStatus {
  [key: string]: boolean;
}

export interface StageInfo {
  stage: number;
  status: string;
  icon: string;
  color: string;
  bgColor: string;
}
