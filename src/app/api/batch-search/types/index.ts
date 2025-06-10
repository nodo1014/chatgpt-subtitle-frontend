
export interface SubtitleData {
  media_file: string;
  text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
}

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

export interface BatchSearchRequest {
  text: string;
  results_per_sentence?: number;
}

export interface BatchSearchResponse {
  success: boolean;
  extracted_sentences?: string[];
  search_summary?: {
    total_sentences: number;
    total_results: number;
    average_per_sentence: string;
    search_time: number;
  };
  sentence_results?: SentenceResult[];
  auto_create_clips?: boolean;
  error?: string;
}

export interface DatabaseRow {
  media_file: string;
  text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
  rank?: number;
}
