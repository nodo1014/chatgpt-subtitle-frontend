#!/usr/bin/env node

/**
 * 빠른 검색 테스트 스크립트
 * 클립 생성 없이 검색 기능만 빠르게 테스트
 */

const fetch = require('node-fetch');

// 빠른 테스트용 검색어
const QUICK_TESTS = [
  "hello",
  "thank you", 
  "i'm sorry",
  "what did you",
  "how are you"
];

async function quickTest() {
  console.log('🚀 빠른 검색 테스트 시작');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  let totalResults = 0;
  let successCount = 0;
  
  for (let i = 0; i < QUICK_TESTS.length; i++) {
    const query = QUICK_TESTS[i];
    const testStart = Date.now();
    
    try {
      console.log(`[${i + 1}/${QUICK_TESTS.length}] 검색: "${query}"`);
      
      const response = await fetch('http://localhost:3000/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          results_per_sentence: 5
        }),
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        const resultCount = data.search_summary?.total_results || 0;
        const testTime = Date.now() - testStart;
        
        console.log(`   ✅ ${resultCount}개 결과 (${testTime}ms)`);
        totalResults += resultCount;
        successCount++;
      } else {
        console.log(`   ❌ HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('=' .repeat(50));
  console.log(`📊 테스트 완료:`);
  console.log(`   성공: ${successCount}/${QUICK_TESTS.length}`);
  console.log(`   총 결과: ${totalResults}개`);
  console.log(`   총 시간: ${totalTime}ms`);
  console.log(`   평균 시간: ${Math.round(totalTime / QUICK_TESTS.length)}ms`);
}

// 포트 자동 감지 및 실행
async function main() {
  const ports = [3000, 3006, 3008, 3010];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, { 
        timeout: 2000,
        method: 'HEAD'
      });
      if (response.ok) {
        console.log(`✅ 서버 감지: http://localhost:${port}`);
        
        // 전역 fetch URL 업데이트
        const originalFetch = fetch;
        global.fetch = (url, options) => {
          if (typeof url === 'string' && url.startsWith('/')) {
            url = `http://localhost:${port}${url}`;
          }
          return originalFetch(url, options);
        };
        
        await quickTest();
        return;
      }
    } catch (error) {
      // 다음 포트 시도
    }
  }
  
  console.error('❌ 개발 서버를 찾을 수 없습니다. npm run dev를 실행해주세요.');
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
} 