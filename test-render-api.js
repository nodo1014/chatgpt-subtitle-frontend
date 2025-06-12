const fs = require('fs');
const path = require('path');

async function testRenderAPI() {
  const testVideoPath = '/home/kang/docker/youtube/indexer/indexer_v3/theme-search/public/clips/0339ab9b-35c4-43ae-9dfb-8263798c29ed.mp4';
  
  // 파일이 존재하는지 확인
  if (!fs.existsSync(testVideoPath)) {
    console.log('테스트 비디오 파일이 없습니다:', testVideoPath);
    return;
  }
  
  console.log('테스트 비디오 파일 확인됨:', testVideoPath);
  
  const renderSettings = {
    aspectRatio: '16:9',
    quality: 'medium',
    textOverlay: {
      enabled: true,
      englishText: 'Test English Subtitle',
      koreanText: '테스트 한국어 자막',
      position: 'bottom',
      fontSize: 24,
      fontColor: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      opacity: 0.9
    }
  };
  
  const mediaFiles = [{
    id: '0339ab9b-35c4-43ae-9dfb-8263798c29ed',
    name: 'test-video.mp4',
    path: testVideoPath,
    type: 'video',
    size: fs.statSync(testVideoPath).size,
    duration: 10
  }];
  
  try {
    console.log('렌더링 API 테스트 시작...');
    
    const response = await fetch('http://localhost:3001/api/video-editor/render-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaFiles,
        settings: renderSettings
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('렌더링 요청 성공!');
    
    // 스트리밍 응답 읽기
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('렌더링 완료!');
            return;
          }
          
          try {
            const progressData = JSON.parse(data);
            console.log('진행상황:', progressData);
          } catch (e) {
            console.log('기타 메시지:', data);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('렌더링 테스트 실패:', error);
  }
}

testRenderAPI();
