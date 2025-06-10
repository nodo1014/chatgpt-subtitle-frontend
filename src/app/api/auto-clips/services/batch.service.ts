import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  getMediaFilePath, 
  getClipOutputPath, 
  getThumbnailOutputPath,
  getThumbnailWebPath
} from '@/config/media-config';

import { ClipMetadata, SearchResult, BatchResult } from '../types';
import { CLIP_CONFIG } from './config';
import { validateMediaFile, logProgress } from '../utils';
import { ClipService } from './clip.service';
import { ThumbnailService } from './thumbnail.service';
import { MetadataService } from './metadata.service';

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
      const metadata = MetadataService.createMetadata(result, clipId);
      
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
        const thumbnailSuccess = await ThumbnailService.createThumbnail(
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
        const clipSuccess = await ClipService.createClip(
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
