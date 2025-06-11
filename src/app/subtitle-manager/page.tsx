'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SubtitleManager from '@/components/subtitle/SubtitleManager';
import StandardTabs from '@/components/ui/StandardTabs';

interface VideoInfo {
  id: string;
  title: string;
  duration?: string;
  sourceFile: string;
  hasSubtitles: boolean;
  subtitleLanguages: string[];
  lastUpdated?: string;
}

export default function SubtitleManagePage() {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'batch'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideoList();
  }, []);

  const loadVideoList = async () => {
    try {
      setLoading(true);
      // 클립 목록에서 비디오 정보 추출
      const response = await fetch('/api/clips-manage');
      const data = await response.json();
      
      if (data.success) {
        // 비디오별로 그룹화
        const videoMap = new Map<string, VideoInfo>();
        
        data.data.forEach((clip: any) => {
          const videoId = clip.sourceFile ? 
            clip.sourceFile.split('/').pop()?.replace(/\.[^/.]+$/, '') || clip.id :
            clip.id;
          
          if (!videoMap.has(videoId)) {
            videoMap.set(videoId, {
              id: videoId,
              title: clip.title || videoId,
              sourceFile: clip.sourceFile || '',
              hasSubtitles: false,
              subtitleLanguages: []
            });
          }
        });

        // 자막 정보 추가 확인
        const videoList = Array.from(videoMap.values());
        for (const video of videoList) {
          try {
            const subtitleResponse = await fetch(`/api/subtitles?videoId=${video.id}`);
            const subtitleData = await subtitleResponse.json();
            
            if (subtitleData.success && subtitleData.data) {
              video.hasSubtitles = true;
              video.subtitleLanguages = subtitleData.data.tracks.map((track: any) => 
                track.language === 'en' ? '영어' : '한국어'
              );
              video.lastUpdated = subtitleData.data.lastUpdated;
            }
          } catch (error) {
            console.error(`비디오 ${video.id} 자막 확인 실패:`, error);
          }
        }

        setVideos(videoList);
      }
    } catch (error) {
      console.error('비디오 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(videoId);
    setActiveTab('manage');
  };

  const handleSubtitlesUpdate = () => {
    // 자막 업데이트 후 비디오 목록 새로고침
    loadVideoList();
  };

  const videosWithSubtitles = videos.filter(v => v.hasSubtitles);
  const videosWithoutSubtitles = videos.filter(v => !v.hasSubtitles);

  return (
    <AppLayout
      title="자막 관리"
      subtitle="비디오 자막 업로드, 편집 및 관리"
      icon="📝"
    >
      <div className="space-y-6">
        {/* 탭 네비게이션 */}
        <StandardTabs
          tabs={[
            {
              id: 'overview',
              label: '개요',
              icon: '📊',
              badge: videos.length || undefined
            },
            {
              id: 'manage',
              label: '자막 관리',
              icon: '⚙️',
              badge: selectedVideo ? '선택됨' : undefined
            },
            {
              id: 'batch',
              label: '일괄 처리',
              icon: '🔄'
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
        />

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{videos.length}</div>
                    <div className="text-sm text-gray-600">전체 비디오</div>
                  </div>
                  <div className="text-3xl">🎬</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{videosWithSubtitles.length}</div>
                    <div className="text-sm text-gray-600">자막 있음</div>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{videosWithoutSubtitles.length}</div>
                    <div className="text-sm text-gray-600">자막 없음</div>
                  </div>
                  <div className="text-3xl">❌</div>
                </div>
              </div>
            </div>

            {/* 비디오 목록 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">비디오 목록</h3>
                <button
                  onClick={loadVideoList}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  새로고침
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">로딩 중...</div>
                </div>
              ) : videos.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">비디오가 없습니다.</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {videos.map((video) => (
                    <div key={video.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{video.title}</div>
                          <div className="text-sm text-gray-600">ID: {video.id}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className={`text-xs px-2 py-1 rounded ${
                              video.hasSubtitles 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {video.hasSubtitles ? '자막 있음' : '자막 없음'}
                            </div>
                            {video.subtitleLanguages.length > 0 && (
                              <div className="text-xs text-gray-500">
                                언어: {video.subtitleLanguages.join(', ')}
                              </div>
                            )}
                            {video.lastUpdated && (
                              <div className="text-xs text-gray-500">
                                업데이트: {new Date(video.lastUpdated).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVideoSelect(video.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            자막 관리
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 자막 관리 탭 */}
        {activeTab === 'manage' && (
          <div>
            {selectedVideo ? (
              <SubtitleManager 
                videoId={selectedVideo} 
                onSubtitlesUpdate={handleSubtitlesUpdate}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-500 mb-4">관리할 비디오를 선택해주세요.</div>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  비디오 목록 보기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 일괄 처리 탭 */}
        {activeTab === 'batch' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500 mb-4">일괄 처리 기능은 개발 중입니다.</div>
            <div className="text-sm text-gray-400">
              곧 여러 비디오의 자막을 한번에 업로드하고 관리할 수 있는 기능을 제공할 예정입니다.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
