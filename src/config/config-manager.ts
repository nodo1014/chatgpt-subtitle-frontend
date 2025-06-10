// 🔒 안전한 설정 관리 시스템
import { MEDIA_CONFIG } from './media-config';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const USER_SETTINGS_PATH = path.join(process.cwd(), 'config', 'user-settings.json');
const SETTINGS_BACKUP_PATH = path.join(process.cwd(), 'config', 'user-settings.backup.json');
const SETTINGS_LOCK_PATH = path.join(process.cwd(), 'config', '.settings.lock');

// 설정 스키마 정의 (유효성 검증용)
const VALID_CONFIG_SCHEMA = {
  mediaConfig: {
    MEDIA_BASE_PATH: 'string',
    CLIPS_OUTPUT_PATH: 'string', 
    THUMBNAILS_OUTPUT_PATH: 'string',
    FFMPEG_SETTINGS: {
      VIDEO_CODEC: 'string',
      AUDIO_CODEC: 'string',
      THUMBNAIL_FORMAT: 'string',
      THUMBNAIL_SIZE: 'string',
      THUMBNAIL_QUALITY: 'number',
      THUMBNAIL_BRIGHTNESS: 'number',
      THUMBNAIL_CONTRAST: 'number',
      THUMBNAIL_SATURATION: 'number'
    },
    CLIP_SETTINGS: {
      MAX_CLIPS_PER_BATCH: 'number',
      PADDING_SECONDS: 'number',
      MAX_DURATION: 'number'
    }
  },
  searchConfig: {
    DEFAULT_RESULTS_PER_SENTENCE: 'number',
    CONFIDENCE_THRESHOLD: 'number', 
    MAX_SEARCH_RESULTS: 'number',
    SEARCH_TIMEOUT: 'number'
  }
};

// 허용된 값 범위 정의
const CONFIG_LIMITS = {
  THUMBNAIL_QUALITY: { min: 1, max: 31 },
  THUMBNAIL_BRIGHTNESS: { min: -1.0, max: 1.0 },
  THUMBNAIL_CONTRAST: { min: 0.0, max: 4.0 },
  THUMBNAIL_SATURATION: { min: 0.0, max: 3.0 },
  MAX_CLIPS_PER_BATCH: { min: 1, max: 100 },
  PADDING_SECONDS: { min: 0, max: 5 },
  MAX_DURATION: { min: 5, max: 300 },
  DEFAULT_RESULTS_PER_SENTENCE: { min: 1, max: 100 },
  CONFIDENCE_THRESHOLD: { min: 0.0, max: 1.0 },
  MAX_SEARCH_RESULTS: { min: 10, max: 10000 },
  SEARCH_TIMEOUT: { min: 5, max: 300 }
};

// 🔍 설정 유효성 검증 함수
function validateConfigStructure(config: any): boolean {
  try {
    // 필수 구조 검증
    if (!config.mediaConfig || !config.searchConfig) {
      console.error('❌ 설정 구조 오류: mediaConfig 또는 searchConfig 누락');
      return false;
    }

    // 값 범위 검증
    const { mediaConfig, searchConfig } = config;
    
    // FFmpeg 설정 검증
    const ffmpeg = mediaConfig.FFMPEG_SETTINGS;
    if (ffmpeg.THUMBNAIL_QUALITY < CONFIG_LIMITS.THUMBNAIL_QUALITY.min || 
        ffmpeg.THUMBNAIL_QUALITY > CONFIG_LIMITS.THUMBNAIL_QUALITY.max) {
      console.error('❌ THUMBNAIL_QUALITY 값이 허용 범위를 벗어남');
      return false;
    }

    // 클립 설정 검증
    const clip = mediaConfig.CLIP_SETTINGS;
    if (clip.MAX_CLIPS_PER_BATCH < CONFIG_LIMITS.MAX_CLIPS_PER_BATCH.min ||
        clip.MAX_CLIPS_PER_BATCH > CONFIG_LIMITS.MAX_CLIPS_PER_BATCH.max) {
      console.error('❌ MAX_CLIPS_PER_BATCH 값이 허용 범위를 벗어남');
      return false;
    }

    // 검색 설정 검증
    if (searchConfig.CONFIDENCE_THRESHOLD < CONFIG_LIMITS.CONFIDENCE_THRESHOLD.min ||
        searchConfig.CONFIDENCE_THRESHOLD > CONFIG_LIMITS.CONFIDENCE_THRESHOLD.max) {
      console.error('❌ CONFIDENCE_THRESHOLD 값이 허용 범위를 벗어남');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 설정 검증 중 오류:', error);
    return false;
  }
}

// 🔒 설정 잠금 확인
async function isSettingsLocked(): Promise<boolean> {
  try {
    await fs.access(SETTINGS_LOCK_PATH);
    return true;
  } catch {
    return false;
  }
}

// 🔐 설정 잠금 생성
async function createSettingsLock(reason: string): Promise<void> {
  const lockData = {
    timestamp: new Date().toISOString(),
    reason,
    pid: process.pid
  };
  await fs.writeFile(SETTINGS_LOCK_PATH, JSON.stringify(lockData, null, 2));
}

// 🔓 설정 잠금 해제
async function removeSettingsLock(): Promise<void> {
  try {
    await fs.unlink(SETTINGS_LOCK_PATH);
  } catch {
    // 잠금 파일이 없어도 무시
  }
}

// 💾 안전한 백업 생성
async function createSettingsBackup(): Promise<void> {
  try {
    const currentSettings = await fs.readFile(USER_SETTINGS_PATH, 'utf-8');
    await fs.writeFile(SETTINGS_BACKUP_PATH, currentSettings);
    console.log('✅ 설정 백업 생성 완료');
  } catch (error) {
    console.warn('⚠️ 설정 백업 생성 실패:', error);
  }
}

// 🔄 백업에서 설정 복원
async function restoreFromBackup(): Promise<boolean> {
  try {
    const backupSettings = await fs.readFile(SETTINGS_BACKUP_PATH, 'utf-8');
    const parsedBackup = JSON.parse(backupSettings);
    
    if (validateConfigStructure(parsedBackup)) {
      await fs.writeFile(USER_SETTINGS_PATH, backupSettings);
      console.log('✅ 백업에서 설정 복원 완료');
      return true;
    } else {
      console.error('❌ 백업 파일도 손상됨');
      return false;
    }
  } catch (error) {
    console.error('❌ 백업 복원 실패:', error);
    return false;
  }
}

// 🔐 안전한 설정 로드 (메인 함수)
export async function getEffectiveConfig() {
  try {
    // 잠금 상태 확인
    if (await isSettingsLocked()) {
      console.warn('⚠️ 설정이 잠금 상태입니다. 기본 설정을 사용합니다.');
      return MEDIA_CONFIG;
    }

    // 사용자 설정 로드 및 검증
    const userSettingsData = await fs.readFile(USER_SETTINGS_PATH, 'utf-8');
    const userSettings = JSON.parse(userSettingsData);
    
    // 설정 구조 검증
    if (!validateConfigStructure(userSettings)) {
      console.error('❌ 사용자 설정이 손상됨. 백업에서 복원 시도...');
      
      const restored = await restoreFromBackup();
      if (!restored) {
        console.error('❌ 백업 복원 실패. 기본 설정을 사용합니다.');
        await createSettingsLock('사용자 설정 손상됨');
        return MEDIA_CONFIG;
      }
      
      // 복원된 설정 재로드
      const restoredData = await fs.readFile(USER_SETTINGS_PATH, 'utf-8');
      const restoredSettings = JSON.parse(restoredData);
      
      return {
        ...MEDIA_CONFIG,
        ...restoredSettings.mediaConfig
      };
    }
    
    // 정상적인 경우 설정 병합
    return {
      ...MEDIA_CONFIG,
      ...userSettings.mediaConfig
    };
  } catch (error) {
    console.warn('⚠️ 사용자 설정을 찾을 수 없음, 기본 설정 사용:', error);
    return MEDIA_CONFIG;
  }
}

export async function getSearchConfig() {
  try {
    // 잠금 상태 확인
    if (await isSettingsLocked()) {
      console.warn('⚠️ 설정이 잠금 상태입니다. 기본 검색 설정을 사용합니다.');
      return getDefaultSearchConfig();
    }

    const userSettingsData = await fs.readFile(USER_SETTINGS_PATH, 'utf-8');
    const userSettings = JSON.parse(userSettingsData);
    
    if (!validateConfigStructure(userSettings)) {
      console.error('❌ 검색 설정이 손상됨. 기본값을 사용합니다.');
      return getDefaultSearchConfig();
    }
    
    return userSettings.searchConfig;
  } catch (error) {
    console.warn('⚠️ 검색 설정 로드 실패, 기본값 사용:', error);
    return getDefaultSearchConfig();
  }
}

// 📋 기본 검색 설정 반환
function getDefaultSearchConfig() {
  return {
    DEFAULT_RESULTS_PER_SENTENCE: 5,
    CONFIDENCE_THRESHOLD: 0.7,
    MAX_SEARCH_RESULTS: 1000,
    SEARCH_TIMEOUT: 30,
  };
}

// 💾 안전한 설정 저장
export async function saveUserSettings(newSettings: any): Promise<{ success: boolean; error?: string }> {
  try {
    // 잠금 상태 확인
    if (await isSettingsLocked()) {
      return { success: false, error: '설정이 잠금 상태입니다. 잠금을 해제한 후 다시 시도하세요.' };
    }

    // 설정 구조 검증
    if (!validateConfigStructure(newSettings)) {
      return { success: false, error: '유효하지 않은 설정 구조입니다.' };
    }

    // 현재 설정 백업
    await createSettingsBackup();

    // 새 설정 저장
    const settingsWithMetadata = {
      ...newSettings,
      lastModified: new Date().toISOString(),
      version: '1.0.0',
      checksum: crypto.createHash('md5').update(JSON.stringify(newSettings)).digest('hex')
    };

    await fs.writeFile(USER_SETTINGS_PATH, JSON.stringify(settingsWithMetadata, null, 2));
    console.log('✅ 사용자 설정 저장 완료');
    
    return { success: true };
  } catch (error) {
    console.error('❌ 설정 저장 실패:', error);
    return { success: false, error: '설정 저장 중 오류가 발생했습니다.' };
  }
}

// 🔓 설정 잠금 해제 (관리자 기능)
export async function unlockSettings(adminKey?: string): Promise<boolean> {
  try {
    // 간단한 관리자 키 검증 (실제로는 더 복잡한 인증 필요)
    const expectedKey = process.env.ADMIN_UNLOCK_KEY || 'unlock-settings-2024';
    
    if (adminKey !== expectedKey) {
      console.error('❌ 잘못된 관리자 키');
      return false;
    }

    await removeSettingsLock();
    console.log('✅ 설정 잠금이 해제되었습니다');
    return true;
  } catch (error) {
    console.error('❌ 잠금 해제 실패:', error);
    return false;
  }
}

// 📊 설정 상태 조회
export async function getSettingsStatus() {
  const isLocked = await isSettingsLocked();
  
  let lockInfo = null;
  if (isLocked) {
    try {
      const lockData = await fs.readFile(SETTINGS_LOCK_PATH, 'utf-8');
      lockInfo = JSON.parse(lockData);
    } catch {
      lockInfo = { reason: '알 수 없음' };
    }
  }

  return {
    isLocked,
    lockInfo,
    hasBackup: await fs.access(SETTINGS_BACKUP_PATH).then(() => true).catch(() => false),
    userSettingsExists: await fs.access(USER_SETTINGS_PATH).then(() => true).catch(() => false)
  };
}
