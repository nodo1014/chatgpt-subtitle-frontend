import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  MEDIA_CONFIG, 
  getMediaFilePath, 
  getClipOutputPath, 
  getThumbnailOutputPath,
  getClipWebPath,
  getThumbnailWebPath
} from '@/config/media-config';

import { ClipMetadata, SearchResult, BatchResult } from './types';
import { CLIP_CONFIG } from './config';
import { extractTitle, timeToSeconds, validateMediaFile, logProgress } from './utils';
import { FFmpegService } from './ffmpeg.service';

// 메타데이터 관리 서비스
export class MetadataService {
  // 기존 메타데이터 로드
  static async loadExistingMetadata(): Promise<ClipMetadata[]> {
    const clipsDir = MEDIA_CONFIG.CLIPS_OUTPUT_PATH;
    const existingFiles = await fs.promises.readdir(clipsDir).catch(() => []);
    const existingMetadata: ClipMetadata[] = [];
    
    for (const file of existingFiles) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(clipsDir, file);
          const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf-8'));
          existingMetadata.push(metadata);
        } catch {
          continue;
        }
      }
    }
    
    return existingMetadata;
  }

  // 중복 확인
  static isDuplicate(result: SearchResult, existingMetadata: ClipMetadata[]): boolean {
    return existingMetadata.some(existing => 
      existing.sourceFile === result.media_file &&
      existing.startTime === result.start_time &&
      existing.endTime === result.end_time
    );
  }

  // 데이터베이스에서 한글해설과 한글발음 정보 가져오기
  static async getKoreanInfo(mediaFile: string, startTime: string, endTime: string): Promise<{
    koreanExplanation?: string;
    koreanPronunciation?: string;
  }> {
    try {
      const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
      const db = new Database(dbPath);
      
      // 미디어 파일명과 시간 범위로 자막 정보 검색
      const query = `
        SELECT korean_explanation, korean_pronunciation 
        FROM subtitles 
        WHERE media_file = ? 
        AND start_time = ? 
        AND end_time = ?
        LIMIT 1
      `;
      
      const result = db.prepare(query).get(mediaFile, startTime, endTime);
      db.close();
      
      if (result) {
        return {
          koreanExplanation: result.korean_explanation || '',
          koreanPronunciation: result.korean_pronunciation || ''
        };
      }
      
      return {
        koreanExplanation: '',
        koreanPronunciation: ''
      };
    } catch (error) {
      console.error('❌ 한글 정보 조회 실패:', error);
      return {
        koreanExplanation: '',
        koreanPronunciation: ''
      };
    }
  }

  // 메타데이터 생성
  static async createMetadata(result: SearchResult, clipId: string): Promise<ClipMetadata> {
    const title = extractTitle(result.media_file);
    
    // 데이터베이스에서 한글해설과 한글발음 정보 가져오기
    const koreanInfo = await this.getKoreanInfo(result.media_file, result.start_time, result.end_time);
    
    // 한글 자막 생성 로직
    let koreanSubtitle: string;
    if (koreanInfo.koreanExplanation && koreanInfo.koreanExplanation.trim() !== '') {
      // 한글 설명이 있는 경우 그대로 사용
      koreanSubtitle = koreanInfo.koreanExplanation;
    } else {
      // 한글 설명이 없는 경우 기본 형태로 생성
      koreanSubtitle = `한글 자막이 표시됩니다. ${result.subtitle_text}`;
    }
    
    return {
      id: clipId,
      title,
      sentence: result.subtitle_text,
      englishSubtitle: result.subtitle_text,
      koreanSubtitle: koreanSubtitle,
      koreanExplanation: koreanInfo.koreanExplanation,
      koreanPronunciation: koreanInfo.koreanPronunciation,
      startTime: result.start_time,
      endTime: result.end_time,
      sourceFile: result.media_file,
      clipPath: getClipWebPath(clipId),
      thumbnailPath: undefined,
      createdAt: new Date().toISOString(),
      duration: `${timeToSeconds(result.end_time) - timeToSeconds(result.start_time)}초`,
      tags: [title.split(' ')[0], 'auto-generated', 'stage-1-json']
    };
  }

  // 메타데이터 파일 저장
  static async saveMetadata(metadata: ClipMetadata): Promise<boolean> {
    try {
      const metadataPath = path.join(MEDIA_CONFIG.CLIPS_OUTPUT_PATH, `${metadata.id}.json`);
      await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      return true;
    } catch (error) {
      console.log(`❌ JSON 생성 실패: ${error}`);
      return false;
    }
  }

  // 메타데이터 업데이트 (단계별 태그 관리)
  static async updateMetadata(
    metadata: ClipMetadata, 
    updates: Partial<ClipMetadata>
  ): Promise<boolean> {
    try {
      const updatedMetadata = { ...metadata, ...updates };
      const metadataPath = path.join(MEDIA_CONFIG.CLIPS_OUTPUT_PATH, `${metadata.id}.json`);
      await fs.promises.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
      return true;
    } catch (error) {
      console.log(`❌ JSON 업데이트 실패: ${error}`);
      return false;
    }
  }
}

// 3단계 배치 처리 서비스
export class BatchProcessingService {
  // ===== 1단계: JSON 메타데이터 일괄 생성 =====
  static async createJSONBatch(results: SearchResult[]): Promise<ClipMetadata[]> {
    console.log(`\n🏗️ === 1단계: JSON 메타데이터 일괄 생성 (${results.length}개) ===`);
    
    const jsonResults: ClipMetadata[] = [];
    const existingMetadata = await MetadataService.loadExistingMetadata();
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      logProgress(i + 1, results.length, '📝 JSON 생성', result.media_file);
      
      // 문제 파일 스킵
      const fileName = path.basename(result.media_file);
      if (CLIP_CONFIG.PROBLEMATIC_FILES.includes(fileName)) {
        console.log(`⚠️ 문제 파일 스킵: ${fileName} (블랙리스트에 등록됨)`);
        continue;
      }
      
      // 중복 확인
      if (MetadataService.isDuplicate(result, existingMetadata)) {
        console.log(`🔄 기존 클립 발견, 건너뛰기: ${result.media_file}`);
        continue;
      }
      
      // 미디어 파일 검증
      const mediaFilePath = getMediaFilePath(result.media_file, result.directory);
      const validation = await validateMediaFile(mediaFilePath);
      
      if (!validation.exists || !validation.isFile || validation.error) {
        console.log(`❌ 파일 검증 실패: ${mediaFilePath} - ${validation.error}`);
        continue;
      }
      
      console.log(`✅ 파일 확인: ${mediaFilePath} (${Math.round(validation.sizeMB)}MB)`);
      
      // JSON 메타데이터 생성 및 저장
      const clipId = uuidv4();
      const metadata = await MetadataService.createMetadata(result, clipId);
      
      if (await MetadataService.saveMetadata(metadata)) {
        jsonResults.push(metadata);
        console.log(`✅ JSON 생성: ${clipId}`);
      }
    }
    
    return jsonResults;
  }

  // ===== 2단계: 썸네일 일괄 생성 =====
  static async createThumbnailBatch(jsonResults: ClipMetadata[]): Promise<BatchResult> {
    console.log(`\n📸 === 2단계: 썸네일 일괄 생성 (${jsonResults.length}개) ===`);
    
    const BATCH_SIZE = CLIP_CONFIG.BATCH_CONFIG.THUMBNAIL_BATCH_SIZE;
    let success = 0;
    let failed = 0;
    
    // 배치 단위로 처리
    for (let i = 0; i < jsonResults.length; i += BATCH_SIZE) {
      const batch = jsonResults.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(jsonResults.length/BATCH_SIZE);
      
      console.log(`📸 썸네일 배치 ${batchNumber}/${totalBatches}: ${batch.length}개 처리`);
      
      const promises = batch.map(async (metadata) => {
        const thumbnailPath = getThumbnailOutputPath(metadata.id);
        const mediaFilePath = getMediaFilePath(metadata.sourceFile);
        
        console.log(`🖼️ 썸네일 생성 시작: ${metadata.id}`);
        const thumbnailSuccess = await FFmpegService.createThumbnail(
          mediaFilePath, 
          metadata.startTime, 
          thumbnailPath
        );
        
        if (thumbnailSuccess) {
          // JSON 업데이트 (썸네일 경로 추가, 단계 태그 업데이트)
          const updates: Partial<ClipMetadata> = {
            thumbnailPath: getThumbnailWebPath(metadata.id),
            tags: metadata.tags.filter(tag => tag !== 'stage-1-json').concat(['stage-2-thumbnail'])
          };
          
          await MetadataService.updateMetadata(metadata, updates);
          console.log(`✅ 썸네일 완료: ${metadata.id}`);
          return true;
        } else {
          console.log(`❌ 썸네일 실패: ${metadata.id}`);
          return false;
        }
      });
      
      const results = await Promise.all(promises);
      const batchSuccess = results.filter(r => r).length;
      const batchFailed = results.filter(r => !r).length;
      
      success += batchSuccess;
      failed += batchFailed;
      
      console.log(`📊 배치 ${batchNumber} 완료: 성공 ${batchSuccess}개, 실패 ${batchFailed}개`);
    }
    
    return { success, failed };
  }

  // ===== 3단계: 영상 클립 일괄 생성 =====
  static async createClipBatch(jsonResults: ClipMetadata[]): Promise<BatchResult> {
    console.log(`\n🎬 === 3단계: 영상 클립 일괄 생성 (${jsonResults.length}개) ===`);
    
    const BATCH_SIZE = CLIP_CONFIG.BATCH_CONFIG.CLIP_BATCH_SIZE;
    let success = 0;
    let failed = 0;
    
    // 배치 단위로 처리
    for (let i = 0; i < jsonResults.length; i += BATCH_SIZE) {
      const batch = jsonResults.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(jsonResults.length/BATCH_SIZE);
      
      console.log(`🎬 클립 배치 ${batchNumber}/${totalBatches}: ${batch.length}개 처리`);
      
      const promises = batch.map(async (metadata) => {
        const clipPath = getClipOutputPath(metadata.id);
        const mediaFilePath = getMediaFilePath(metadata.sourceFile);
        
        console.log(`🎬 클립 생성 시작: ${metadata.id}`);
        const clipSuccess = await FFmpegService.createClip(
          mediaFilePath, 
          metadata.startTime, 
          metadata.endTime, 
          clipPath
        );
        
        if (clipSuccess) {
          // JSON 업데이트 (최종 완료 태그)
          const updates: Partial<ClipMetadata> = {
            tags: metadata.tags.filter(tag => !tag.startsWith('stage-')).concat(['completed'])
          };
          
          await MetadataService.updateMetadata(metadata, updates);
          console.log(`✅ 클립 완료: ${metadata.id}`);
          return true;
        } else {
          console.log(`❌ 클립 실패: ${metadata.id}`);
          return false;
        }
      });
      
      const results = await Promise.all(promises);
      const batchSuccess = results.filter(r => r).length;
      const batchFailed = results.filter(r => !r).length;
      
      success += batchSuccess;
      failed += batchFailed;
      
      console.log(`📊 배치 ${batchNumber} 완료: 성공 ${batchSuccess}개, 실패 ${batchFailed}개`);
    }
    
    return { success, failed };
  }
}
