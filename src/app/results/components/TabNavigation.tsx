'use client';

import { SearchData, ViewMode } from '../types';

interface TabNavigationProps {
  viewMode: ViewMode;
  searchData: SearchData | null;
  clipsCount: number;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TabNavigation({ 
  viewMode, 
  searchData, 
  clipsCount, 
  onViewModeChange 
}: TabNavigationProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6">
      <div className="flex">
        <button
          onClick={() => onViewModeChange('search')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'search'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          } ${!searchData ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!searchData}
        >
          🔍 검색 결과 {searchData ? `(${searchData.search_summary.total_results})` : ''}
        </button>
        <button
          onClick={() => onViewModeChange('clips')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'clips'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎬 클립 ({clipsCount})
        </button>
      </div>
      {/* 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2">
          DEBUG: viewMode={viewMode}, hasSearchData={!!searchData}, clipsCount={clipsCount}
        </div>
      )}
    </div>
  );
}
