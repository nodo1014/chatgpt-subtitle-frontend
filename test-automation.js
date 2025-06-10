#!/usr/bin/env node

/**
 * 검색 테스트 자동화 스크립트
 * 
 * 사용법:
 * node test-automation.js
 * node test-automation.js --quick (빠른 테스트, 클립 생성 없이)
 * node test-automation.js --search "hello world" (특정 검색어)
 * node test-automation.js --batch (배치 테스트)
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// 설정
const CONFIG = {
  BASE_URL: 'http://localhost:3000', // 개발 서버 주소 (포트 자동 감지)
  RESULTS_PER_SENTENCE: 5,
  TEST_RESULTS_DIR: './test-results',
  TIMEOUT: 30000 // 30초 타임아웃
};

// 테스트용 검색어 모음
const TEST_QUERIES = {
  // 빠른 테스트용 (결과가 많이 나올 것으로 예상)
  quick: [
    "hello",
    "thank you", 
    "i'm sorry",
    "what did you",
    "how are you"
  ],
  
  // 일반 테스트용
  normal: [
    "good morning",
    "see you later", 
    "nice to meet you",
    "excuse me",
    "you're welcome",
    "i don't know",
    "what's your name",
    "where are you from"
  ],
  
  // 배치 테스트용 (결과가 적을 수 있는 검색어)
  batch: [
    "absolutely fantastic",
    "congratulations",
    "unfortunately",
    "specifically",
    "definitely maybe",
    "extraordinary",
    "sophisticated",
    "nevertheless"
  ]
};

// 포트 자동 감지
async function detectPort() {
  const ports = [3000, 3006, 3008, 3010];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, { 
        timeout: 2000,
        method: 'HEAD'
      });
      if (response.ok) {
        console.log(`✅ 개발 서버 감지: http://localhost:${port}`);
        return port;
      }
    } catch (error) {
      // 포트가 사용 중이 아님
    }
  }
  
  throw new Error('❌ 개발 서버를 찾을 수 없습니다. npm run dev를 실행해주세요.');
}

// 검색 API 호출
async function performSearch(query, createClips = false) {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 검색 시작: "${query}"`);
    
    const response = await fetch(`${CONFIG.BASE_URL}/api/batch-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: query,
        results_per_sentence: CONFIG.RESULTS_PER_SENTENCE
      }),
      timeout: CONFIG.TIMEOUT
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const searchData = await response.json();
    const searchTime = Date.now() - startTime;
    
    console.log(`📊 검색 완료 (${searchTime}ms): ${searchData.search_summary?.total_results || 0}개 결과`);
    
    let clipResult = null;
    
    // 클립 생성 요청 (옵션)
    if (createClips && searchData.search_summary?.total_results > 0) {
      console.log(`🎬 클립 생성 시작...`);
      const clipStartTime = Date.now();
      
      const clipResponse = await fetch(`${CONFIG.BASE_URL}/api/auto-clips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sentence_results: searchData.sentence_results 
        }),
        timeout: 120000 // 2분 타임아웃
      });

      if (clipResponse.ok) {
        clipResult = await clipResponse.json();
        const clipTime = Date.now() - clipStartTime;
        console.log(`✅ 클립 생성 완료 (${clipTime}ms): ${clipResult.total_created || 0}개 생성`);
      } else {
        console.log(`❌ 클립 생성 실패: ${clipResponse.status}`);
      }
    }
    
    return {
      query,
      searchTime,
      searchData,
      clipResult,
      totalTime: Date.now() - startTime
    };
    
  } catch (error) {
    console.log(`❌ 검색 실패: ${error.message}`);
    return {
      query,
      error: error.message,
      searchTime: Date.now() - startTime
    };
  }
}

// 테스트 결과 저장
async function saveTestResults(results, testType) {
  try {
    await fs.mkdir(CONFIG.TEST_RESULTS_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-${testType}-${timestamp}.json`;
    const filepath = path.join(CONFIG.TEST_RESULTS_DIR, filename);
    
    const summary = {
      testType,
      timestamp: new Date().toISOString(),
      totalQueries: results.length,
      successfulQueries: results.filter(r => !r.error).length,
      failedQueries: results.filter(r => r.error).length,
      totalResults: results.reduce((sum, r) => sum + (r.searchData?.search_summary?.total_results || 0), 0),
      totalClipsCreated: results.reduce((sum, r) => sum + (r.clipResult?.total_created || 0), 0),
      averageSearchTime: results.reduce((sum, r) => sum + r.searchTime, 0) / results.length,
      results
    };
    
    await fs.writeFile(filepath, JSON.stringify(summary, null, 2));
    console.log(`📄 테스트 결과 저장: ${filepath}`);
    
    return summary;
  } catch (error) {
    console.error(`❌ 결과 저장 실패: ${error.message}`);
  }
}

// 테스트 결과 분석 및 출력
function printTestSummary(summary) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 테스트 결과 요약 (${summary.testType})`);
  console.log('='.repeat(60));
  console.log(`🔍 총 검색 쿼리: ${summary.totalQueries}개`);
  console.log(`✅ 성공: ${summary.successfulQueries}개`);
  console.log(`❌ 실패: ${summary.failedQueries}개`);
  console.log(`📈 총 검색 결과: ${summary.totalResults}개`);
  console.log(`🎬 총 클립 생성: ${summary.totalClipsCreated}개`);
  console.log(`⏱️ 평균 검색 시간: ${Math.round(summary.averageSearchTime)}ms`);
  
  console.log('\n📋 상세 결과:');
  summary.results.forEach((result, index) => {
    const status = result.error ? '❌' : '✅';
    const resultCount = result.searchData?.search_summary?.total_results || 0;
    const clipCount = result.clipResult?.total_created || 0;
    
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${status} "${result.query}" - ${resultCount}개 결과, ${clipCount}개 클립 (${result.searchTime}ms)`);
    
    if (result.error) {
      console.log(`     오류: ${result.error}`);
    }
  });
  
  console.log('='.repeat(60));
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  
  try {
    // 포트 자동 감지
    const port = await detectPort();
    CONFIG.BASE_URL = `http://localhost:${port}`;
    
    let testType = 'normal';
    let queries = TEST_QUERIES.normal;
    let createClips = false;
    
    // 명령행 인수 처리
    if (args.includes('--quick')) {
      testType = 'quick';
      queries = TEST_QUERIES.quick;
      console.log('🚀 빠른 테스트 모드 (클립 생성 없음)');
    } else if (args.includes('--batch')) {
      testType = 'batch';
      queries = TEST_QUERIES.batch;
      createClips = true;
      console.log('📦 배치 테스트 모드 (클립 생성 포함)');
    } else if (args.includes('--clips')) {
      createClips = true;
      console.log('🎬 클립 생성 포함 테스트');
    }
    
    // 특정 검색어 지정
    const searchIndex = args.findIndex(arg => arg === '--search');
    if (searchIndex !== -1 && args[searchIndex + 1]) {
      queries = [args[searchIndex + 1]];
      testType = 'custom';
      console.log(`🎯 사용자 지정 검색어: "${queries[0]}"`);
    }
    
    console.log(`\n🧪 테스트 시작: ${queries.length}개 검색어`);
    console.log(`🌐 서버: ${CONFIG.BASE_URL}`);
    console.log(`🎬 클립 생성: ${createClips ? '예' : '아니오'}`);
    console.log('-'.repeat(60));
    
    // 순차적으로 검색 실행
    const results = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n[${i + 1}/${queries.length}] 검색 중...`);
      
      const result = await performSearch(query, createClips);
      results.push(result);
      
      // 서버 부하 방지를 위한 대기 (클립 생성 시에만)
      if (createClips && i < queries.length - 1) {
        console.log('⏳ 서버 부하 방지를 위해 3초 대기...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // 결과 저장 및 출력
    const summary = await saveTestResults(results, testType);
    if (summary) {
      printTestSummary(summary);
    }
    
  } catch (error) {
    console.error(`❌ 테스트 실행 오류: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { performSearch, saveTestResults }; 