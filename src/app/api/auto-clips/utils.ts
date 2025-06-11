import path from 'path';
import fs from 'fs';
import { CLIP_CONFIG } from './config';

// 시간 문자열을 초로 변환
export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0]);
  const milliseconds = parseInt(secondsParts[1] || '0');
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// 파일명에서 제목 추출
export function extractTitle(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // 시리즈 제목 추출 (예: "Batman The Animated Series (1992) - S01E01...")
  const seriesMatch = fileName.match(/^([^(]+(?:\([^)]+\))?)\s*-?\s*S\d+E\d+/);
  if (seriesMatch) {
    return seriesMatch[1].trim();
  }
  
  // 영화 제목 추출
  const movieMatch = fileName.match(/^([^(]+(?:\([^)]+\))?)/);
  if (movieMatch) {
    return movieMatch[1].trim();
  }
  
  return fileName;
}

// 파일 크기 체크 함수
export function checkFileSize(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeGB = stats.size / (1024 * 1024 * 1024);
    
    if (fileSizeGB > CLIP_CONFIG.MAX_FILE_SIZE_GB) {
      console.log(`❌ 파일 크기 초과: ${fileSizeGB.toFixed(2)}GB > ${CLIP_CONFIG.MAX_FILE_SIZE_GB}GB`);
      return false;
    }
    
    console.log(`📏 파일 크기: ${fileSizeGB.toFixed(2)}GB (허용 범위)`);
    return true;
  } catch (error) {
    console.log(`❌ 파일 크기 확인 실패: ${error}`);
    return false;
  }
}

// 블랙리스트 체크 함수
export function isBlacklistedFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const isBlacklisted = CLIP_CONFIG.PROBLEMATIC_FILES.some(blacklisted => 
    fileName.includes(blacklisted)
  );
  
  if (isBlacklisted) {
    console.log(`🚫 블랙리스트 파일 감지 - 스킵: ${fileName}`);
  }
  
  return isBlacklisted;
}

// 중복 제거 유틸리티
export function removeDuplicateResults<T extends { media_file: string; start_time: string; end_time: string }>(
  results: T[]
): { unique: T[]; duplicatesCount: number } {
  const processedClips = new Set<string>();
  const unique: T[] = [];

  for (const result of results) {
    const clipKey = `${result.media_file}|${result.start_time}|${result.end_time}`;
    
    if (processedClips.has(clipKey)) {
      console.log(`🔄 중복 클립 건너뛰기: ${result.media_file} (${result.start_time} ~ ${result.end_time})`);
      continue;
    }
    
    processedClips.add(clipKey);
    unique.push(result);
  }

  return {
    unique,
    duplicatesCount: results.length - unique.length
  };
}

// 파일 존재 확인 및 통계 정보
export async function validateMediaFile(filePath: string): Promise<{
  exists: boolean;
  isFile: boolean;
  sizeMB: number;
  error?: string;
}> {
  try {
    const stats = await fs.promises.stat(filePath);
    
    if (!stats.isFile()) {
      return {
        exists: true,
        isFile: false,
        sizeMB: 0,
        error: '경로가 파일이 아닙니다'
      };
    }
    
    const sizeMB = stats.size / 1024 / 1024;
    
    // 파일 크기 제한 체크 (3GB)
    if (sizeMB > 3000) {
      return {
        exists: true,
        isFile: true,
        sizeMB,
        error: `파일 크기 초과 (${Math.round(sizeMB)}MB > 3000MB)`
      };
    }
    
    return {
      exists: true,
      isFile: true,
      sizeMB,
    };
  } catch (error) {
    return {
      exists: false,
      isFile: false,
      sizeMB: 0,
      error: '파일을 찾을 수 없습니다'
    };
  }
}

// 진행 상황 로깅 헬퍼
export function logProgress(current: number, total: number, operation: string, item?: string): void {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  
  console.log(`📊 ${operation} [${progressBar}] ${current}/${total} (${percentage}%)${item ? ` - ${item}` : ''}`);
}
