#!/usr/bin/env node

// FFmpeg 렌더링 엔진 테스트 스크립트

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const CLIPS_DIR = path.join(PUBLIC_DIR, 'clips');

async function testRender() {
  console.log('🎬 렌더링 엔진 테스트 시작');
  
  // 1. 클립 파일 확인
  console.log('\n📁 클립 파일 확인...');
  try {
    const clipFiles = fs.readdirSync(CLIPS_DIR).filter(file => file.endsWith('.mp4'));
    console.log(`✅ 발견된 클립 파일: ${clipFiles.length}개`);
    
    if (clipFiles.length === 0) {
      console.log('❌ 클립 파일이 없습니다.');
      return;
    }
    
    const testClip = clipFiles[0];
    const clipId = testClip.replace('.mp4', '');
    console.log(`🎯 테스트 클립: ${testClip} (ID: ${clipId})`);
    
    // 2. API 테스트
    console.log('\n🚀 API 테스트...');
    const response = await fetch('http://localhost:3005/api/video-editor/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clipId: clipId,
        pattern: 'repeat-3',
        quality: 'medium',
        textOverlay: {
          english: 'Test English Subtitle',
          korean: '테스트 한글 자막',
          style: 'subtitle'
        }
      })
    });
    
    const result = await response.json();
    console.log('📊 API 응답:', result);
    
    if (result.success) {
      console.log('✅ 렌더링 작업 시작 성공');
      console.log(`📋 작업 ID: ${result.jobId}`);
      
      if (result.outputPath) {
        console.log(`🎥 출력 파일: ${result.outputPath}`);
      }
    } else {
      console.log('❌ 렌더링 작업 시작 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

// ES modules 환경에서 실행
if (require.main === module) {
  testRender();
}

module.exports = { testRender };
