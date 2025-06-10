'use client';

import { useState, useEffect } from 'react';

interface ClipRequest {
  id: string;
  sentence: string;
  media_file: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export default function ClipManager() {
  const [pendingClips, setPendingClips] = useState<ClipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingClips();
  }, []);

  const loadPendingClips = async () => {
    try {
      const response = await fetch('/api/clips');
      const data = await response.json();
      
      if (data.success) {
        setPendingClips(data.clips || []);
      }
    } catch (error) {
      console.error('클립 목록 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualClip = async (clipId: string) => {
    if (!confirm('이 클립을 수동으로 생성하시겠습니까?')) return;

    try {
      // Python 백엔드에 수동 클립 생성 요청
      const response = await fetch('http://localhost:5000/api/create-clip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clip_id: clipId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('클립이 생성되었습니다!');
        loadPendingClips(); // 목록 새로고침
      } else {
        alert(`클립 생성 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('클립 생성 오류:', error);
      alert('클립 생성 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🎬 클립 관리 대시보드</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          대기 중인 클립 요청 ({pendingClips.length}개)
        </h2>
        
        {pendingClips.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            대기 중인 클립 요청이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClips.map((clip) => (
              <div key={clip.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      "{clip.sentence}"
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📁 {clip.media_file}</div>
                      <div>⏰ {clip.start_time} ~ {clip.end_time}</div>
                      <div>📅 {new Date(clip.created_at).toLocaleString('ko-KR')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleManualClip(clip.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🎬 클립 생성
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">📝 클립 생성 가이드</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• 클립 생성은 FFmpeg를 사용하여 수동으로 처리됩니다</li>
          <li>• 자막 시간 기준으로 앞뒤 2초씩 여유를 둡니다</li>
          <li>• 생성된 클립은 clips/ 폴더에 저장됩니다</li>
          <li>• 비디오 파일이 /mnt/qnap/media_eng 경로에 있어야 합니다</li>
        </ul>
      </div>
    </div>
  );
}
