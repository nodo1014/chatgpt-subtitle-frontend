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
    THUMBNAIL_BATCH_SIZE: 1, // 동시 썸네일 생성 개수 (안정성 우선)
    CLIP_BATCH_SIZE: 1,      // 동시 클립 생성 개수 (안정성 우선)
    CLIP_TIMEOUT: 180000,    // 클립 생성 타임아웃 (180초 = 3분)
    THUMBNAIL_TIMEOUT: 15000 // 썸네일 생성 타임아웃 (15초)
  },

  // FFmpeg 설정
  FFMPEG: {
    // 클립 생성 기본 옵션 (웹 호환성을 위한 표준 코덱 사용)
    CLIP_OPTIONS: [
      '-c:v', 'libx264',        // H.264 비디오 코덱 (웹 표준)
      '-c:a', 'aac',            // AAC 오디오 코덱 (웹 표준)
      '-preset', 'ultrafast',   // 인코딩 속도 (ultrafast=최고속도, fast=균형, slow=고품질)
      '-crf', '28',             // 품질 설정 (18=고품질, 23=기본값, 28=적절)
      '-movflags', '+faststart', // 웹 스트리밍 최적화
      '-threads', '0',          // 모든 CPU 코어 사용
      '-avoid_negative_ts', 'make_zero',
      '-y'
    ],

    // 썸네일 생성 기본 옵션 (밝기/대비 개선)
    THUMBNAIL_OPTIONS: [
      '-vframes', '1',
      '-vf', 'scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2,eq=brightness=0.15:contrast=1.3:saturation=1.2',
      '-q:v', '2',  // 품질 향상 (3→2)
      '-y'
    ]
  }
};
