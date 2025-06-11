'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import StandardTabs from '@/components/ui/StandardTabs';
import Link from 'next/link';

interface ClipData {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle?: string;
  koreanSubtitle?: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration?: string;
  tags: string[];
  isBookmarked?: boolean;
}

interface ClippingOptions {
  quality: '480p' | '720p' | '1080p';
  format: 'mp4' | 'webm' | 'gif';
  subtitles: 'none' | 'english' | 'korean' | 'both';
  padding: number; // 앞뒤 여유시간 (초)
  preset: 'youtube' | 'social' | 'gif' | 'study' | 'custom';
}

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

const QUALITY_PRESETS = {
  youtube: { quality: '1080p', format: 'mp4', subtitles: 'both', padding: 1, preset: 'youtube' },
  social: { quality: '720p', format: 'mp4', subtitles: 'both', padding: 0.5, preset: 'social' },
  gif: { quality: '480p', format: 'gif', subtitles: 'none', padding: 0, preset: 'gif' },
  study: { quality: '1080p', format: 'mp4', subtitles: 'both', padding: 2, preset: 'study' },
  custom: { quality: '720p', format: 'mp4', subtitles: 'english', padding: 1, preset: 'custom' }
} as const;

export default function ClipStudioPage() {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'selection' | 'batch'>('bookmarks');
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<ClippingOptions>({
    ...QUALITY_PRESETS.youtube,
    preset: 'youtube'
  });
  const [progress, setProgress] = useState<BatchProgress>({ 
    total: 0, 
    completed: 0, 
    failed: 0, 
    status: 'idle' 
  });

  useEffect(() => {
    loadBookmarkedClips();
  }, []);

  const loadBookmarkedClips = async () => {
    try {
      setLoading(true);
      // 북마크된 클립만 조회
      const response = await fetch('/api/clips-manage?isBookmarked=true');
      const data = await response.json();
      
      if (data.success) {
        setClips(data.data);
      }
    } catch (error) {
      console.error('북마크 클립 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClipSelect = (clipId: string) => {
    const newSelection = new Set(selectedClips);
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId);
    } else {
      newSelection.add(clipId);
    }
    setSelectedClips(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedClips.size === clips.length) {
      setSelectedClips(new Set());
    } else {
      setSelectedClips(new Set(clips.map(clip => clip.id)));
    }
  };

  const handlePresetChange = (preset: keyof typeof QUALITY_PRESETS) => {
    setOptions({
      ...QUALITY_PRESETS[preset],
      preset
    });
  };

  const startBatchClipping = async () => {
    if (selectedClips.size === 0) {
      alert('클리핑할 클립을 선택해주세요.');
      return;
    }

    setProgress({
      total: selectedClips.size,
      completed: 0,
      failed: 0,
      status: 'processing'
    });

    try {
      const selectedClipData = clips.filter(clip => selectedClips.has(clip.id));
      
      console.log('🎬 배치 클리핑 시작:', selectedClipData.length, '개 클립');
      console.log('옵션:', options);
      
      const response = await fetch('/api/clips/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: selectedClipData,
          options: options
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setProgress({
          total: selectedClips.size,
          completed: result.data.successful,
          failed: result.data.failed,
          status: 'completed'
        });
        
        setActiveTab('batch'); // 배치 처리 탭으로 이동
        
                alert(`클리핑 완료!\n✅ 성공: ${result.data.successful}개\n❌ 실패: ${result.data.failed}개`);
        
        // 성공한 클립들은 선택에서 제거
        const successfulClips = new Set(
          result.data.results
            .filter((r: any) => r.success)
            .map((r: any) => r.clipId)
        );
        setSelectedClips(prev => new Set([...prev].filter(id => !successfulClips.has(id))));
        
      } else {
        throw new Error(result.error || '알 수 없는 오류');
      }
    } catch (error) {
      console.error('배치 클리핑 실패:', error);
      setProgress(prev => ({ ...prev, status: 'error' }));
      alert(`클리핑 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const bookmarkedClips = clips.filter((clip: any) => clip.isBookmarked);
  const selectedClipsList = clips.filter((clip: any) => selectedClips.has(clip.id));

  return (
    <AppLayout
      title="클립 스튜디오"
      subtitle="북마크 기반 고급 클리핑 도구"
      icon="🎬"
      headerChildren={
        <Link 
          href="/clips-manage"
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← 클립 관리
        </Link>
      }
    >
      <div className="space-y-6">
        {/* 탭 네비게이션 */}
        <StandardTabs
          tabs={[
            {
              id: 'bookmarks',
              label: '북마크 클립',
              icon: '⭐',
              badge: bookmarkedClips.length || undefined
            },
            {
              id: 'selection',
              label: '선택된 클립',
              icon: '✅',
              badge: selectedClips.size || undefined
            },
            {
              id: 'batch',
              label: '배치 처리',
              icon: '⚙️',
              badge: progress.status === 'processing' ? '처리중' : undefined
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
        />

        {/* 북마크 클립 탭 */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            {/* 클리핑 옵션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 클리핑 옵션</h3>
              
              {/* 프리셋 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">프리셋 선택</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key as keyof typeof QUALITY_PRESETS)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        options.preset === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold">{key === 'youtube' ? '유튜브' : key === 'social' ? '소셜' : key === 'gif' ? 'GIF' : key === 'study' ? '학습용' : '커스텀'}</div>
                      <div className="text-xs text-gray-500">{preset.quality} {preset.format.toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 세부 옵션 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">화질</label>
                  <select
                    value={options.quality}
                    onChange={(e) => setOptions({...options, quality: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">포맷</label>
                  <select
                    value={options.format}
                    onChange={(e) => setOptions({...options, format: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자막</label>
                  <select
                    value={options.subtitles}
                    onChange={(e) => setOptions({...options, subtitles: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="none">자막 없음</option>
                    <option value="english">영어만</option>
                    <option value="korean">한글만</option>
                    <option value="both">영어+한글</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">여유시간 (초)</label>
                  <input
                    type="number"
                    value={options.padding}
                    onChange={(e) => setOptions({...options, padding: parseFloat(e.target.value)})}
                    min="0"
                    max="5"
                    step="0.5"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 북마크 클립 목록 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  ⭐ 북마크된 클립 ({bookmarkedClips.length}개)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {selectedClips.size === clips.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    onClick={startBatchClipping}
                    disabled={selectedClips.size === 0 || progress.status === 'processing'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🎬 선택 클립 처리 ({selectedClips.size})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">로딩 중...</div>
                </div>
              ) : bookmarkedClips.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">북마크된 클립이 없습니다.</div>
                  <Link href="/clips-manage" className="mt-2 text-blue-600 hover:text-blue-800">
                    클립 관리에서 북마크 추가하기 →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bookmarkedClips.map((clip) => (
                    <div key={clip.id} className={`p-4 hover:bg-gray-50 ${selectedClips.has(clip.id) ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedClips.has(clip.id)}
                          onChange={() => handleClipSelect(clip.id)}
                          className="rounded border-gray-300"
                        />
                        {clip.thumbnailPath && (
                          <img
                            src={clip.thumbnailPath}
                            alt="썸네일"
                            className="w-20 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{clip.title}</div>
                          <div className="text-sm text-gray-600">{clip.sentence}</div>
                          <div className="text-xs text-gray-500">
                            {clip.startTime} ~ {clip.endTime} | {clip.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 선택된 클립 탭 */}
        {activeTab === 'selection' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                ✅ 선택된 클립 ({selectedClips.size}개)
              </h3>
            </div>
            <div className="p-6">
              {selectedClips.size === 0 ? (
                <div className="text-center text-gray-500">선택된 클립이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {selectedClipsList.map((clip) => (
                    <div key={clip.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {clip.thumbnailPath && (
                        <img
                          src={clip.thumbnailPath}
                          alt="썸네일"
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{clip.title}</div>
                        <div className="text-sm text-gray-600">{clip.sentence}</div>
                      </div>
                      <button
                        onClick={() => handleClipSelect(clip.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 배치 처리 탭 */}
        {activeTab === 'batch' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">⚙️ 배치 처리 현황</h3>
            </div>
            <div className="p-6">
              {progress.status === 'idle' ? (
                <div className="text-center text-gray-500">배치 처리를 시작하려면 클립을 선택하고 처리 버튼을 클릭하세요.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>진행률</span>
                    <span>{progress.completed} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{progress.completed}</div>
                      <div className="text-sm text-gray-600">완료</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                      <div className="text-sm text-gray-600">실패</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{progress.total - progress.completed - progress.failed}</div>
                      <div className="text-sm text-gray-600">대기</div>
                    </div>
                  </div>
                  {progress.current && (
                    <div className="text-sm text-gray-600">
                      현재 처리 중: {progress.current}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
