import path from 'path';

// 미디어 파일 경로 설정
export const MEDIA_CONFIG = {
  // 기본 미디어 디렉토리
  MEDIA_BASE_PATH: '/mnt/qnap/media_eng',
  
  // 클립 저장 경로 (public 폴더 내)
  CLIPS_OUTPUT_PATH: path.join(process.cwd(), 'public', 'clips'),
  
  // 썸네일 저장 경로 (public 폴더 내)
  THUMBNAILS_OUTPUT_PATH: path.join(process.cwd(), 'public', 'thumbnails'),
  
  // FFmpeg 설정
  FFMPEG_SETTINGS: {
    VIDEO_CODEC: 'libx264',
    AUDIO_CODEC: 'aac',
    THUMBNAIL_FORMAT: 'jpg',
    THUMBNAIL_SIZE: '320x180', // 16:9 비율
    THUMBNAIL_QUALITY: 2, // JPEG 품질 (1-31, 낮을수록 고품질)
    THUMBNAIL_BRIGHTNESS: 0.1, // 밝기 조정 (-1.0 ~ 1.0)
    THUMBNAIL_CONTRAST: 1.2, // 대비 조정 (0.0 ~ 4.0)
    THUMBNAIL_SATURATION: 1.1, // 채도 조정 (0.0 ~ 3.0)
  },
  
  // 클립 생성 설정
  CLIP_SETTINGS: {
    MAX_CLIPS_PER_BATCH: 20, // 배치당 최대 클립 수
    PADDING_SECONDS: 0.5,   // 시작/끝 시간 여유분
    MAX_DURATION: 30,       // 최대 클립 길이 (초)
  }
};

// 미디어 파일 경로 생성 헬퍼 함수
export function getMediaFilePath(relativePath: string, directory?: string): string {
  // 이미 절대 경로인 경우 (DB에서 가져온 전체 경로) 그대로 사용
  if (relativePath.startsWith('/')) {
    console.log(`📁 절대 경로 사용: ${relativePath}`);
    return relativePath;
  }
  
  // relativePath에서 leading slash 제거
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // directory가 제공된 경우 경로에 포함
  if (directory) {
    // directory도 절대 경로인 경우 확인
    if (directory.startsWith('/')) {
      return `${directory}/${cleanPath}`;
    }
    return `${MEDIA_CONFIG.MEDIA_BASE_PATH}/${directory}/${cleanPath}`;
  }
  
  return `${MEDIA_CONFIG.MEDIA_BASE_PATH}/${cleanPath}`;
}

// 클립 파일 경로 생성 헬퍼 함수
export function getClipOutputPath(clipId: string): string {
  return `${MEDIA_CONFIG.CLIPS_OUTPUT_PATH}/${clipId}.mp4`;
}

// 썸네일 파일 경로 생성 헬퍼 함수
export function getThumbnailOutputPath(clipId: string): string {
  return `${MEDIA_CONFIG.THUMBNAILS_OUTPUT_PATH}/${clipId}.${MEDIA_CONFIG.FFMPEG_SETTINGS.THUMBNAIL_FORMAT}`;
}

// 웹에서 접근 가능한 클립 URL 생성
export function getClipWebPath(clipId: string): string {
  return `/clips/${clipId}.mp4`;
}

// 웹에서 접근 가능한 썸네일 URL 생성
export function getThumbnailWebPath(clipId: string): string {
  return `/thumbnails/${clipId}.${MEDIA_CONFIG.FFMPEG_SETTINGS.THUMBNAIL_FORMAT}`;
}
