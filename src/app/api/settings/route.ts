// 🔒 안전한 설정 API - AI로부터 보호된 설정 관리
import { NextRequest, NextResponse } from 'next/server';
import { 
  getEffectiveConfig, 
  getSearchConfig, 
  saveUserSettings, 
  getSettingsStatus,
  unlockSettings 
} from '../../../config/config-manager';

// 기본 설정값 (fallback)
const DEFAULT_SETTINGS = {
  mediaConfig: {
    MEDIA_BASE_PATH: '/mnt/qnap/media_eng',
    CLIPS_OUTPUT_PATH: 'public/clips',
    THUMBNAILS_OUTPUT_PATH: 'public/thumbnails',
    FFMPEG_SETTINGS: {
      VIDEO_CODEC: 'libx264',
      AUDIO_CODEC: 'aac',
      THUMBNAIL_FORMAT: 'jpg',
      THUMBNAIL_SIZE: '320x180',
      THUMBNAIL_QUALITY: 2,
      THUMBNAIL_BRIGHTNESS: 0.1,
      THUMBNAIL_CONTRAST: 1.2,
      THUMBNAIL_SATURATION: 1.1,
    },
    CLIP_SETTINGS: {
      MAX_CLIPS_PER_BATCH: 20,
      PADDING_SECONDS: 0.5,
      MAX_DURATION: 30,
    }
  },
  searchConfig: {
    DEFAULT_RESULTS_PER_SENTENCE: 5,
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_SEARCH_RESULTS: 1000,
    SEARCH_TIMEOUT: 30,
  }
};

// 🔍 GET: 설정 불러오기 (안전한 버전)
export async function GET() {
  try {
    console.log('🔍 안전한 설정 로드 요청');
    
    // 설정 상태 확인
    const status = await getSettingsStatus();
    console.log('📊 설정 상태:', status);

    if (status.isLocked) {
      console.warn('⚠️ 설정이 잠금 상태입니다');
      return NextResponse.json({
        success: false,
        error: `설정이 잠금 상태입니다. 이유: ${status.lockInfo?.reason || '알 수 없음'}`,
        locked: true,
        lockInfo: status.lockInfo,
        data: DEFAULT_SETTINGS // 기본 설정 제공
      });
    }

    // 안전한 설정 로드
    const mediaConfig = await getEffectiveConfig();
    const searchConfig = await getSearchConfig();
    
    return NextResponse.json({
      success: true,
      locked: false,
      data: {
        mediaConfig,
        searchConfig
      }
    });
  } catch (error) {
    console.error('❌ 설정 로드 실패:', error);
    return NextResponse.json({
      success: false,
      error: '설정을 불러오는데 실패했습니다.',
      data: DEFAULT_SETTINGS
    });
  }
}

// 💾 POST: 설정 저장하기 (안전한 버전)
export async function POST(request: NextRequest) {
  try {
    console.log('💾 안전한 설정 저장 요청');
    
    const body = await request.json();
    const { mediaConfig, searchConfig, adminKey } = body;

    // 관리자 키가 제공된 경우 잠금 해제 시도
    if (adminKey) {
      const unlocked = await unlockSettings(adminKey);
      if (!unlocked) {
        return NextResponse.json({
          success: false,
          error: '잘못된 관리자 키입니다.'
        });
      }
      console.log('🔓 관리자 키로 잠금 해제됨');
    }

    // 설정 유효성 검증 및 저장
    const newSettings = { mediaConfig, searchConfig };
    const result = await saveUserSettings(newSettings);

    if (result.success) {
      console.log('✅ 설정 저장 성공');
      return NextResponse.json({
        success: true,
        message: '설정이 성공적으로 저장되었습니다.'
      });
    } else {
      console.error('❌ 설정 저장 실패:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ 설정 저장 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '설정을 저장하는데 실패했습니다.'
    });
  }
}

// 🔄 PUT: 설정 초기화 (안전한 버전)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 설정 초기화 요청');
    
    const body = await request.json();
    const { adminKey } = body;

    // 관리자 키 확인
    if (adminKey) {
      const unlocked = await unlockSettings(adminKey);
      if (!unlocked) {
        return NextResponse.json({
          success: false,
          error: '잘못된 관리자 키입니다.'
        });
      }
    }

    // 기본 설정으로 초기화
    const result = await saveUserSettings(DEFAULT_SETTINGS);

    if (result.success) {
      console.log('✅ 설정 초기화 성공');
      return NextResponse.json({
        success: true,
        message: '설정이 기본값으로 초기화되었습니다.',
        data: DEFAULT_SETTINGS
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ 설정 초기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: '설정을 초기화하는데 실패했습니다.'
    });
  }
}

// 📊 PATCH: 설정 상태 조회
export async function PATCH() {
  try {
    const status = await getSettingsStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ 설정 상태 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: '설정 상태를 조회하는데 실패했습니다.'
    });
  }
}
