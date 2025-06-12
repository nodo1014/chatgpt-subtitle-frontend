const testRender = async () => {
  try {
    console.log('Video Studio 렌더링 테스트 시작...');
    
    // 실제 클립 데이터로 렌더링 요청
    const renderData = {
      workspace_id: "test-workspace",
      template_id: "shadowing_9_16", // 9:16 세로 형식
      clips: [
        {
          id: "3947175c-f717-4dca-a53f-84c73637004b",
          title: "SPAWN - S02 E04 - Send in the KKKlowns",
          english_text: "DOES HE THINK HE CAN FUCK WITH ME?",
          korean_text: "", // X는 빈 문자열로 처리
          explanation: "SPAWN 애니메이션에서 추출된 클립",
          pronunciation: "does he think he can fuck with me",
          video_path: "/clips/3947175c-f717-4dca-a53f-84c73637004b.mp4",
          duration: 2.212,
          working_dir: "test",
          settings: {
            repeatCount: 1,
            showEnglish: true,
            showKorean: false, // X로 표시된 한글은 제외
            showExplanation: true,
            showPronunciation: true,
            subtitlePosition: "bottom"
          }
        }
      ],
      options: {
        outputWidth: 720,
        outputHeight: 1280,
        backgroundMusic: false,
        fadeTransitions: true
      }
    };

    console.log('렌더링 요청 데이터:', JSON.stringify(renderData, null, 2));

    const response = await fetch('http://localhost:3000/api/video-studio/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(renderData)
    });

    const result = await response.json();
    console.log('렌더링 응답:', result);

    if (result.success && result.job_id) {
      console.log(`렌더링 작업 시작됨: ${result.job_id}`);
      
      // 진행률 모니터링
      const monitorProgress = async () => {
        try {
          const progressResponse = await fetch(`http://localhost:3000/api/video-studio/progress/${result.job_id}`);
          const progressData = await progressResponse.json();
          
          console.log(`진행률: ${progressData.progress}% - ${progressData.status}`);
          console.log('전체 응답 데이터:', progressData);
          
          if (progressData.status === 'completed') {
            console.log('✅ 렌더링 완료!');
            console.log('출력 파일:', progressData.output_path);
            clearInterval(progressInterval);
          } else if (progressData.status === 'failed') {
            console.log('❌ 렌더링 실패:', progressData.error);
            clearInterval(progressInterval);
          }
        } catch (error) {
          console.error('진행률 확인 중 오류:', error);
        }
      };

      // 5초마다 진행률 확인
      const progressInterval = setInterval(monitorProgress, 5000);
      
      // 첫 번째 진행률 확인
      setTimeout(monitorProgress, 2000);
      
    } else {
      console.error('렌더링 시작 실패:', result);
    }

  } catch (error) {
    console.error('테스트 중 오류:', error);
  }
};

// 테스트 실행
testRender();
