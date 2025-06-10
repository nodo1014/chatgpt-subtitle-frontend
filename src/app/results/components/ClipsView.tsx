'use client';

import { ClipMetadata, SearchData } from '../types';
import ClipCard from './ClipCard';

interface ClipsViewProps {
  clips: ClipMetadata[];
  searchData: SearchData | null;
  onDeleteClip: (clipId: string) => void;
  onToast: (message: string) => void;
  onViewModeChange: (mode: 'search' | 'clips') => void;
  onNewSearch: () => void;
}

export default function ClipsView({ 
  clips, 
  searchData, 
  onDeleteClip, 
  onToast, 
  onViewModeChange, 
  onNewSearch 
}: ClipsViewProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎬 생성된 클립</h2>
        <p className="text-gray-600">총 {clips.length}개의 클립이 있습니다.</p>
        {/* 디버그 정보 추가 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>디버그:</strong> clips 배열 길이: {clips.length}
            {clips.length > 0 && (
              <div>첫 번째 클립: {JSON.stringify(clips[0], null, 2)}</div>
            )}
          </div>
        )}
      </div>
      
      {clips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clips.map((clip) => (
            <ClipCard 
              key={clip.id} 
              clip={clip} 
              onDelete={onDeleteClip}
              onToast={onToast}
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
  );
}
