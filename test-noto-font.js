// Noto Sans KR 폰트 테스트 스크립트
const fetch = require('node-fetch');

async function testNotoSansKR() {
  const baseUrl = 'http://localhost:3003';
  
  console.log('🎨 Noto Sans KR 폰트 테스트 시작\n');
  
  try {
    // 워크스페이스와 클립 정보 가져오기
    const workspaceResponse = await fetch(`${baseUrl}/api/v3/workspace?includeStats=true`);
    const workspaceData = await workspaceResponse.json();
    
    const workspaceId = workspaceData.workspaces[0]?.id;
    const clipResponse = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/clips`);
    const clipData = await clipResponse.json();
    
    console.log('📊 테스트 데이터:');
    console.log(`- 워크스페이스: ${workspaceData.workspaces[0]?.name}`);
    console.log(`- 클립 개수: ${clipData.clips.length}`);
    console.log(`- 테스트 클립: "${clipData.clips[0]?.english_text}"`);
    
    // Noto Sans KR 폰트로만 다양한 설정 테스트
    const notoFontTests = [
      {
        name: '기본 Noto Sans KR - 중간 크기',
        fontSettings: {
          size: 84,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 1,
          fontFamily: 'Noto Sans KR'
        }
      },
      {
        name: 'Noto Sans KR - 큰 크기 + 빨간색',
        fontSettings: {
          size: 120,
          color: '#FF3333',
          strokeColor: '#000000',
          strokeWidth: 2,
          fontFamily: 'Noto Sans KR'
        }
      },
      {
        name: 'Noto Sans KR - 작은 크기 + 파란색',
        fontSettings: {
          size: 48,
          color: '#3366FF',
          strokeColor: '#FFFFFF',
          strokeWidth: 3,
          fontFamily: 'Noto Sans KR'
        }
      }
    ];
    
    for (let i = 0; i < notoFontTests.length; i++) {
      const test = notoFontTests[i];
      console.log(`\n${i + 1}️⃣ ${test.name} 테스트...`);
      
      const renderRequest = {
        workspace_id: workspaceId.toString(),
        template_id: 'shadowing_basic_16_9',
        clips: clipData.clips.slice(0, 1), // 첫 번째 클립만
        common_settings: {
          repeatCount: 2, // 빠른 테스트를 위해 2회만
          subtitlePosition: 'bottom',
          repeatSettings: [
            { showEnglish: true, showKorean: false, showExplanation: false, showPronunciation: false, pauseAfter: 0.5 },
            { showEnglish: false, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 }
          ],
          globalOptions: {
            fadeInOut: false,
            backgroundBlur: false,
            showProgress: false
          },
          fontSettings: test.fontSettings
        },
        options: {
          include_english: true,
          include_korean: true,
          include_explanation: false,
          include_pronunciation: false
        }
      };
      
      console.log(`📤 폰트 설정:`, test.fontSettings);
      
      const renderResponse = await fetch(`${baseUrl}/api/video-studio/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renderRequest)
      });
      
      const renderData = await renderResponse.json();
      
      if (renderData.success) {
        console.log(`✅ 렌더링 시작: ${renderData.job_id}`);
        
        // 완료까지 대기
        let completed = false;
        let attempts = 0;
        
        while (!completed && attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const progressResponse = await fetch(`${baseUrl}/api/video-studio/progress/${renderData.job_id}`);
          const progressData = await progressResponse.json();
          
          console.log(`   진행률: ${progressData.progress}%`);
          
          if (progressData.status === 'completed') {
            console.log(`🎉 완료! 출력: ${progressData.output_path}`);
            completed = true;
          } else if (progressData.status === 'failed') {
            console.log(`❌ 실패: ${progressData.error}`);
            break;
          }
          
          attempts++;
        }
        
        if (!completed) {
          console.log(`⏰ 타임아웃 (${attempts * 3}초)`);
        }
        
      } else {
        console.log(`❌ 렌더링 시작 실패: ${renderData.error}`);
      }
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎯 Noto Sans KR 폰트 테스트 완료!');
    console.log('생성된 파일들을 확인해서 한글 폰트가 올바르게 렌더링되었는지 확인하세요.');
    console.log('특히 한글 문자가 깨지지 않고 명확하게 표시되는지 확인해보세요.');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

// 테스트 실행
testNotoSansKR();
