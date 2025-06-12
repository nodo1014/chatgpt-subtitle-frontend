'use client';

import { useState } from 'react';
import { ClipMetadata, SearchData } from '../types';
import ClipCard from './ClipCard';
import RightPanel from './RightPanel';

interface ClipsViewProps {
  clips: ClipMetadata[];
  searchData: SearchData | null;
  onDeleteClip: (clipId: string) => void;
  onToast: (message: string) => void;
  onViewModeChange: (mode: 'search' | 'clips') => void;
  onNewSearch: () => void;
  isLoading?: boolean;
}

export default function ClipsView({ 
  clips, 
  searchData, 
  onDeleteClip, 
  onToast, 
  onViewModeChange, 
  onNewSearch,
  isLoading = false
}: ClipsViewProps) {
  const [selectedClip, setSelectedClip] = useState<ClipMetadata | null>(null);

  const handlePlayVideo = (clip: ClipMetadata) => {
    setSelectedClip(clip);
  };

  const handleClosePlayer = () => {
    setSelectedClip(null);
  };

  const handleNextClip = (nextClip: ClipMetadata) => {
    setSelectedClip(nextClip);
  };

  // 클립이 있으면 로딩 상태를 무시하고 클립을 표시
  const shouldShowLoading = isLoading && clips.length === 0;

  return (
    <div className="w-full h-full flex bg-white">
      {/* 메인 클립 목록 영역 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎬 생성된 클립</h2>
            <p className="text-gray-600">총 {clips.length}개의 클립이 있습니다.</p>
            {/* 디버그 정보 추가 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>디버그:</strong> clips 배열 길이: {clips.length}, isLoading: {isLoading.toString()}, shouldShowLoading: {shouldShowLoading.toString()}
                {clips.length > 0 && (
                  <div>첫 번째 클립: {JSON.stringify(clips[0], null, 2)}</div>
                )}
              </div>
            )}
          </div>
          
          {shouldShowLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">클립 목록을 불러오는 중...</p>
            </div>
          ) : clips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {clips.map((clip) => (
                <ClipCard 
                  key={clip.id} 
                  clip={clip} 
                  onDelete={onDeleteClip}
                  onToast={onToast}
                  onPlayVideo={handlePlayVideo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">아직 생성된 클립이 없습니다</h3>
              <p className="text-gray-600 mb-6">검색 결과에서 클립을 생성해보세요.</p>
              {searchData ? (
                <button
                  onClick={() => onViewModeChange('search')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  검색 결과로 이동
                </button>
              ) : (
                <button
                  onClick={onNewSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  새 검색 시작
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 패널 */}
      <RightPanel
        clip={selectedClip}
        isVisible={!!selectedClip}
        onClose={handleClosePlayer}
        clips={clips}
        onNextClip={handleNextClip}
      />
    </div>
  );
}
