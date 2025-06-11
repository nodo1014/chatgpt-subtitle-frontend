#!/usr/bin/env node

/**
 * 기존 클립들의 메타데이터를 새로운 형식으로 업데이트하는 스크립트
 * - sentence: 영어 자막 → 사용자 검색어
 * - koreanSubtitle: "검색어: ..." → "X" (한글 자막이 없으므로)
 */

const fs = require('fs');
const path = require('path');

const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');

async function updateClipMetadata() {
  console.log('🔄 클립 메타데이터 업데이트 시작...');
  
  try {
    // 모든 JSON 파일 목록 가져오기
    const jsonFiles = fs.readdirSync(CLIPS_DIR).filter(file => file.endsWith('.json'));
    console.log(`📄 총 ${jsonFiles.length}개 JSON 파일 발견`);
    
    let updatedCount = 0;
    
    for (const jsonFile of jsonFiles) {
      const clipId = path.basename(jsonFile, '.json');
      const jsonPath = path.join(CLIPS_DIR, jsonFile);
      
      // JSON 파일 읽기
      const metadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      // 기존 koreanSubtitle에서 검색어 추출
      let searchTerm = '';
      if (metadata.koreanSubtitle && metadata.koreanSubtitle.startsWith('검색어: ')) {
        searchTerm = metadata.koreanSubtitle.replace('검색어: ', '');
      } else if (metadata.koreanSubtitle && metadata.koreanSubtitle.startsWith('한글 번역: ')) {
        searchTerm = metadata.koreanSubtitle.replace('한글 번역: ', '');
      }
      
      // 메타데이터 업데이트
      const originalSentence = metadata.sentence; // 원본 영어 자막 백업
      
      metadata.sentence = searchTerm; // 사용자 검색어
      metadata.englishSubtitle = originalSentence; // 영어 자막은 그대로
      metadata.koreanSubtitle = 'X'; // 한글 자막이 없으므로 X
      
      // JSON 파일 업데이트
      fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));
      updatedCount++;
      
      console.log(`✅ 업데이트: ${clipId}`);
      console.log(`   검색어: "${searchTerm}"`);
      console.log(`   영어자막: "${originalSentence.substring(0, 50)}..."`);
      console.log(`   한글자막: X`);
    }
    
    console.log(`\n📊 작업 완료:`);
    console.log(`   - 업데이트됨: ${updatedCount}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
updateClipMetadata();
