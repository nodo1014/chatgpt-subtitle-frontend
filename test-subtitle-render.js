const fs = require('fs').promises;
const path = require('path');

async function testSubtitleRender() {
  console.log('🎬 자막 렌더링 테스트 시작...');
  
  // 테스트용 클립 데이터 (자막 설정 포함)
  const testClips = [
    {
      id: "test-1",
      english_text: "Hello, how are you?",
      korean_text: "안녕하세요, 어떻게 지내세요?",
      explanation: "일상적인 인사말입니다",
      pronunciation: "헬로우, 하우 아 유?",
      clipPath: "/clips/hello_how_are_you_01.mp4",
      settings: {
        repeatCount: 2,
        showEnglish: true,
        showKorean: true,
        showExplanation: true,
        showPronunciation: false,
        subtitlePosition: "bottom"
      }
    }
  ];

  const renderData = {
    workspace_id: 'test_subtitle_workspace',
    template_id: 'shadowing_16_9',
    clips: testClips,
    options: {
      quality: 'high'
    }
  };

  try {
    // 렌더링 API 호출
    const response = await fetch('http://localhost:3000/api/video-studio/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(renderData),
    });

    const result = await response.json();
    console.log('📡 렌더링 응답:', result);

    if (result.success) {
      console.log(`✅ 렌더링 작업 시작됨. Job ID: ${result.job_id}`);
      
      // 진행 상황 모니터링
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5분 대기
      
      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
        attempts++;
        
        try {
          const progressResponse = await fetch(`http://localhost:3000/api/video-studio/progress/${result.job_id}`);
          const progressResult = await progressResponse.json();
          
          if (progressResult.success) {
            const job = progressResult.job;
            console.log(`📊 진행률: ${job.progress}% (상태: ${job.status})`);
            
            if (job.status === 'completed') {
              console.log(`🎉 렌더링 완료! 출력 파일: ${job.output_path}`);
              completed = true;
              
              // 출력 파일 존재 확인
              const outputPath = path.join(process.cwd(), 'public', job.output_path);
              try {
                const stats = await fs.stat(outputPath);
                console.log(`📁 파일 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`📍 파일 위치: ${outputPath}`);
              } catch (error) {
                console.error('❌ 출력 파일을 찾을 수 없음:', error.message);
              }
              
            } else if (job.status === 'failed') {
              console.error(`❌ 렌더링 실패: ${job.error}`);
              completed = true;
            }
          }
        } catch (error) {
          console.error('진행 상황 확인 실패:', error.message);
        }
      }
      
      if (!completed) {
        console.error('⏰ 렌더링 시간 초과');
      }
      
    } else {
      console.error('❌ 렌더링 시작 실패:', result.error);
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 테스트 실행
testSubtitleRender().catch(console.error);
