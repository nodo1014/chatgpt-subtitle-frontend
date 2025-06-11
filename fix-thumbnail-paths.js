#!/usr/bin/env node

/**
 * 기존 클립들의 썸네일 경로를 일괄 업데이트하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');
const THUMBNAILS_DIR = path.join(process.cwd(), 'public', 'thumbnails');

async function fixThumbnailPaths() {
  console.log('🔧 썸네일 경로 일괄 수정 시작...');
  
  try {
    // 모든 JSON 파일 목록 가져오기
    const jsonFiles = fs.readdirSync(CLIPS_DIR).filter(file => file.endsWith('.json'));
    console.log(`📄 총 ${jsonFiles.length}개 JSON 파일 발견`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const jsonFile of jsonFiles) {
      const clipId = path.basename(jsonFile, '.json');
      const jsonPath = path.join(CLIPS_DIR, jsonFile);
      const thumbnailPath = path.join(THUMBNAILS_DIR, `${clipId}.jpg`);
      
      // JSON 파일 읽기
      const metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      // 이미 thumbnailPath가 있는 경우 스킵
      if (metadata.thumbnailPath) {
        skippedCount++;
        continue;
      }
      
      // 썸네일 파일이 존재하는지 확인
      if (fs.existsSync(thumbnailPath)) {
        // thumbnailPath 추가
        metadata.thumbnailPath = `/thumbnails/${clipId}.jpg`;
        
        // JSON 파일 업데이트
        fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));
        updatedCount++;
        
        console.log(`✅ 업데이트: ${clipId}`);
      } else {
        console.log(`⚠️  썸네일 없음: ${clipId}`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 작업 완료:`);
    console.log(`   - 업데이트됨: ${updatedCount}개`);
    console.log(`   - 스킵됨: ${skippedCount}개`);
    console.log(`   - 총 처리: ${jsonFiles.length}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
fixThumbnailPaths();
