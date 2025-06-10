'use client';

import { SearchData, ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  searchData: SearchData | null;
  onToggleSidebar: () => void;
  onClipsView: () => void;
}

export default function Header({ viewMode, searchData, onToggleSidebar, onClipsView }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between min-h-[60px]">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="bg-transparent border border-gray-200 text-gray-700 p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center w-9 h-9 hover:bg-gray-50"
        >
          <span>☰</span>
        </button>
        <div className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          🎯 {viewMode === 'clips' ? '클립 보기' : '검색 결과'}
          {searchData && (
            <span className="text-sm text-gray-500">
              {searchData.search_summary.total_sentences}개 문장, 총 {searchData.search_summary.total_results}개 결과
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-3 text-sm text-gray-500">
        {searchData && (
          <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
            <span>⏱️</span>
            <span>{searchData.search_summary.search_time}초</span>
          </div>
        )}
        <button 
          onClick={onClipsView}
          className="bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-xl flex items-center gap-1 text-blue-700 transition-colors cursor-pointer"
        >
          <span>🎬</span>
          <span>클립 보기</span>
        </button>
      </div>
    </div>
  );
}
