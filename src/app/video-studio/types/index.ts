// Video Studio 타입 정의
export interface RenderTemplate {
  id: string;
  name: string;
  description: string;
  category: 'shadowing' | 'shorts';
  format: '16:9' | '9:16';
  resolution: string;
  settings: {
    background: string;
    font_family: string;
    font_size: number;
    stroke_width: number;
    text_color: string;
    stroke_color: string;
  };
}

export interface WorkspaceClip {
  id: string;
  title: string;
  english_text: string;
  korean_text: string;
  explanation?: string;
  pronunciation?: string;
  video_path: string;
  duration: number;
  working_dir?: string;
}

// 각 반복회차별 설정
export interface RepeatSettings {
  showEnglish: boolean;
  showKorean: boolean;
  showExplanation: boolean;
  showPronunciation: boolean;
  pauseAfter: number; // 이 회차 후 일시정지 시간
}

// 공통 렌더링 설정 (모든 클립에 적용)
export interface CommonRenderSettings {
  repeatCount: number;
  subtitlePosition: 'top' | 'middle' | 'bottom';
  repeatSettings: RepeatSettings[]; // 각 회차별 설정 배열
  globalOptions: {
    fadeInOut: boolean;
    backgroundBlur: boolean;
    showProgress: boolean;
  };
  fontSettings: {
    size: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    fontFamily: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  clip_count: number;
  description?: string;
}

// 자막 위치 옵션
export const SUBTITLE_POSITIONS = [
  { value: 'top' as const, label: '상단', icon: '⬆️' },
  { value: 'middle' as const, label: '중앙', icon: '⬅️➡️' },
  { value: 'bottom' as const, label: '하단', icon: '⬇️' }
] as const;
