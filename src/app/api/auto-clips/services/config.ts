// 클립 생성 설정값들
export const CLIP_CONFIG = {
  // 문제가 있는 파일 블랙리스트 (타임아웃이 자주 발생하는 파일들)
  PROBLEMATIC_FILES: [
    // 'Aladdin.1992.REPACK.1080p.BluRay.x264.AAC5.1-[YTS.MX].mp4'
  ] as string[],

  // 파일 크기 제한 (GB)
  MAX_FILE_SIZE_GB: 10,

  // 클립 길이 제한 (초)
  MAX_CLIP_DURATION: 300, // 5분

  // 병렬 처리 설정
  BATCH_CONFIG: {
    THUMBNAIL_BATCH_SIZE: 2, // 동시 썸네일 생성 개수
    CLIP_BATCH_SIZE: 2,      // 동시 클립 생성 개수
    CLIP_TIMEOUT: 60000,     // 클립 생성 타임아웃 (60초)
    THUMBNAIL_TIMEOUT: 45000 // 썸네일 생성 타임아웃 (45초)
  },

  // FFmpeg 설정
  FFMPEG: {
    // 클립 생성 기본 옵션
    CLIP_OPTIONS: [
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y'
    ],

    // 썸네일 생성 기본 옵션
    THUMBNAIL_OPTIONS: [
      '-vframes', '1',
      '-vf', 'scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2',
      '-q:v', '3',
      '-y'
    ]
  }
};
