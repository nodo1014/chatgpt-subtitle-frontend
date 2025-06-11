import fs from 'fs';
import path from 'path';
import { MEDIA_CONFIG, getClipWebPath } from '@/config/media-config';
import { ClipMetadata, SearchResult } from '../types';
import { extractTitle, timeToSeconds } from '../utils';

/**
 * 메타데이터 관리 서비스
 * 
 * 책임:
 * - 클립 메타데이터 CRUD 작업
 * - JSON 파일 저장/로드
 * - 중복 검사
 * - 단계별 태그 관리
 */
export class MetadataService {
  /**
   * 기존 메타데이터 로드
   * @returns 기존 클립 메타데이터 배열
   */
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

  /**
   * 중복 확인
   * @param result 검색 결과
   * @param existingMetadata 기존 메타데이터 배열
   * @returns 중복 여부
   */
  static isDuplicate(result: SearchResult, existingMetadata: ClipMetadata[]): boolean {
    return existingMetadata.some(existing => 
      existing.sourceFile === result.media_file &&
      existing.startTime === result.start_time &&
      existing.endTime === result.end_time
    );
  }

  /**
   * 메타데이터 생성
   * @param result 검색 결과
   * @param clipId 클립 ID
   * @returns 생성된 메타데이터
   */
  static createMetadata(result: SearchResult, clipId: string): ClipMetadata {
    const title = extractTitle(result.media_file);
    
    return {
      id: clipId,
      title,
      sentence: result.sentence || '', // 사용자 검색어
      englishSubtitle: result.subtitle_text,
      koreanSubtitle: this.findKoreanSubtitle(result) || 'X', // 한글 자막 또는 X
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

  /**
   * 한글 자막 찾기 (현재는 DB에 한글 자막이 없으므로 null 반환)
   * @param result 검색 결과
   * @returns 한글 자막 또는 null
   */
  private static findKoreanSubtitle(result: SearchResult): string | null {
    // TODO: 향후 한글 자막 DB가 구축되면 여기서 검색
    // 현재는 한글 자막이 DB에 없으므로 null 반환
    return null;
  }

  /**
   * 메타데이터 파일 저장
   * @param metadata 저장할 메타데이터
   * @returns 저장 성공 여부
   */
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

  /**
   * 메타데이터 업데이트 (단계별 태그 관리)
   * @param metadata 기존 메타데이터
   * @param updates 업데이트할 필드들
   * @returns 업데이트 성공 여부
   */
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

  /**
   * 메타데이터 삭제
   * @param clipId 클립 ID
   * @returns 삭제 성공 여부
   */
  static async deleteMetadata(clipId: string): Promise<boolean> {
    try {
      const metadataPath = path.join(MEDIA_CONFIG.CLIPS_OUTPUT_PATH, `${clipId}.json`);
      await fs.promises.unlink(metadataPath);
      return true;
    } catch (error) {
      console.log(`❌ JSON 삭제 실패: ${error}`);
      return false;
    }
  }

  /**
   * 특정 메타데이터 로드
   * @param clipId 클립 ID
   * @returns 메타데이터 또는 null
   */
  static async loadMetadata(clipId: string): Promise<ClipMetadata | null> {
    try {
      const metadataPath = path.join(MEDIA_CONFIG.CLIPS_OUTPUT_PATH, `${clipId}.json`);
      const content = await fs.promises.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 태그로 메타데이터 필터링
   * @param tag 필터링할 태그
   * @returns 해당 태그를 가진 메타데이터 배열
   */
  static async getMetadataByTag(tag: string): Promise<ClipMetadata[]> {
    const allMetadata = await this.loadExistingMetadata();
    return allMetadata.filter(metadata => metadata.tags.includes(tag));
  }
}
