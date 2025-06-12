// 폰트 설정 기능 테스트 스크립트
const fetch = require('node-fetch');

async function testFontSettings() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🎨 폰트 설정 기능 테스트 시작\n');
  
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
    
    // 사용자 정의 폰트 설정으로 렌더링 테스트
    const customFontTests = [
      {
        name: '큰 폰트 + 빨간색',
        fontSettings: {
          size: 96,
          color: '#FF0000',
          strokeColor: '#000000',
          strokeWidth: 3,
          fontFamily: 'Noto Sans KR'
        }
      },
      {
        name: '작은 폰트 + 파란색',
        fontSettings: {
          size: 48,
          color: '#0066FF',
          strokeColor: '#FFFFFF',
          strokeWidth: 2,
          fontFamily: 'Noto Sans KR'
        }
      },
      {
        name: '노란색 + 테두리 없음',
        fontSettings: {
          size: 72,
          color: '#FFFF00',
          strokeColor: '#000000',
          strokeWidth: 0,
          fontFamily: 'Noto Sans KR'
        }
      }
    ];
    
    for (let i = 0; i < customFontTests.length; i++) {
      const test = customFontTests[i];
      console.log(`\\n${i + 1}️⃣ ${test.name} 테스트...`);
      
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
      
      console.log(`📤 렌더링 요청:`, test.fontSettings);
      
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
        
        while (!completed && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
          console.log(`⏰ 타임아웃`);
        }
        
      } else {
        console.log(`❌ 렌더링 시작 실패: ${renderData.error}`);
      }
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\\n🎯 폰트 설정 테스트 완료!');
    console.log('생성된 파일들을 확인해서 폰트 설정이 올바르게 적용되었는지 확인하세요.');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

// 테스트 실행
testFontSettings();
