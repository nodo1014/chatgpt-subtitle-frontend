// 새로운 Video Studio UI 테스트 스크립트
const fetch = require('node-fetch');

async function testNewVideoStudio() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🎬 새로운 Video Studio UI 테스트 시작\n');
  
  try {
    // 1. 워크스페이스 API 테스트
    console.log('1️⃣ 워크스페이스 API 테스트...');
    const workspaceResponse = await fetch(`${baseUrl}/api/v3/workspace?includeStats=true`);
    const workspaceData = await workspaceResponse.json();
    
    if (workspaceData.success) {
      console.log('✅ 워크스페이스 로드 성공');
      console.log(`   - 총 ${workspaceData.workspaces.length}개 워크스페이스`);
      workspaceData.workspaces.forEach(w => {
        console.log(`   - ${w.name}: ${w.sentence_count || 0}개 문장`);
      });
    } else {
      console.log('❌ 워크스페이스 로드 실패:', workspaceData.error);
      return;
    }
    
    // 2. 클립 API 테스트
    console.log('\n2️⃣ 클립 API 테스트...');
    const workspaceId = workspaceData.workspaces[0]?.id;
    let clipData = null;
    
    if (workspaceId) {
      const clipResponse = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/clips`);
      clipData = await clipResponse.json();
      
      if (clipData.success) {
        console.log('✅ 클립 로드 성공');
        console.log(`   - 총 ${clipData.clips.length}개 클립`);
        clipData.clips.slice(0, 3).forEach(clip => {
          console.log(`   - ${clip.title}: "${clip.english_text}"`);
        });
      } else {
        console.log('❌ 클립 로드 실패:', clipData.error);
        return;
      }
    }
    
    // 3. 템플릿 API 테스트
    console.log('\n3️⃣ 템플릿 API 테스트...');
    const templateResponse = await fetch(`${baseUrl}/api/video-studio/render?action=templates`);
    const templateData = await templateResponse.json();
    
    if (templateData.success) {
      console.log('✅ 템플릿 로드 성공');
      console.log(`   - 총 ${templateData.templates.length}개 템플릿`);
      
      // 카테고리별 분류
      const shadowing = templateData.templates.filter(t => t.category === 'shadowing');
      const shorts = templateData.templates.filter(t => t.category === 'shorts');
      
      console.log(`   - 쉐도잉 템플릿: ${shadowing.length}개`);
      shadowing.forEach(t => console.log(`     * ${t.name}`));
      
      console.log(`   - 쇼츠 템플릿: ${shorts.length}개`);
      shorts.forEach(t => console.log(`     * ${t.name}`));
    } else {
      console.log('❌ 템플릿 로드 실패:', templateData.error);
      return;
    }
    
    // 4. 새로운 공통 설정으로 렌더링 테스트
    console.log('\n4️⃣ 공통 설정 렌더링 테스트...');
    
    if (!clipData || !clipData.success || clipData.clips.length === 0) {
      console.log('❌ 클립 데이터가 없어서 렌더링 테스트를 건너뜁니다.');
      return;
    }
    
    const renderRequest = {
      workspace_id: workspaceId.toString(),
      template_id: 'shadowing_basic_16_9',
      clips: clipData.clips.slice(0, 1), // 첫 번째 클립만 테스트
      common_settings: {
        repeatCount: 3,
        subtitlePosition: 'bottom',
        repeatSettings: [
          { showEnglish: true, showKorean: false, showExplanation: false, showPronunciation: false, pauseAfter: 0.5 },
          { showEnglish: true, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 },
          { showEnglish: false, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 }
        ],
        globalOptions: {
          fadeInOut: true,
          backgroundBlur: false,
          showProgress: true
        }
      },
      options: {
        include_english: true,
        include_korean: true,
        include_explanation: false,
        include_pronunciation: false,
        repeat_count: 3,
        subtitle_position: 'bottom'
      }
    };
    
    console.log('📤 렌더링 요청 전송...');
    const renderResponse = await fetch(`${baseUrl}/api/video-studio/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renderRequest)
    });
    
    const renderData = await renderResponse.json();
    
    if (renderData.success) {
      console.log('✅ 렌더링 작업 시작 성공');
      console.log(`   - Job ID: ${renderData.job_id}`);
      console.log(`   - 템플릿: ${renderData.template}`);
      
      // 진행률 모니터링
      console.log('\n⏳ 렌더링 진행률 모니터링...');
      let attempts = 0;
      const maxAttempts = 30; // 최대 1분 대기
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        
        const progressResponse = await fetch(`${baseUrl}/api/video-studio/progress/${renderData.job_id}`);
        const progressData = await progressResponse.json();
        
        console.log(`   진행률: ${progressData.progress}% (${progressData.status})`);
        
        if (progressData.status === 'completed') {
          console.log('🎉 렌더링 완료!');
          console.log(`   - 출력 파일: ${progressData.output_path}`);
          break;
        } else if (progressData.status === 'failed') {
          console.log('❌ 렌더링 실패:', progressData.error);
          break;
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ 렌더링 대기 시간 초과');
      }
      
    } else {
      console.log('❌ 렌더링 시작 실패:', renderData.error);
    }
    
    console.log('\n🎯 새로운 Video Studio UI 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 테스트 실행
testNewVideoStudio();
