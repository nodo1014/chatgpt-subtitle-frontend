'use client';

import { HistoryItem } from '../types';

interface SidebarProps {
  collapsed: boolean;
  searchHistory: HistoryItem[];
  onNewSearch: () => void;
}

export default function Sidebar({ collapsed, searchHistory, onNewSearch }: SidebarProps) {
  return (
    <div className={`${collapsed ? 'w-0 overflow-hidden' : 'w-64'} bg-[#171717] text-[#ececf1] flex flex-col border-r border-[#2d2d2d] transition-all duration-300 z-50`}>
      <div className="p-4 border-b border-[#2d2d2d] flex justify-between items-center">
        <button 
          onClick={onNewSearch}
          className="flex-1 bg-transparent border border-[#2d2d2d] text-[#ececf1] p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm mr-2 hover:bg-[#2d2d2d]"
        >
          <span>➕</span>
          <span>새 테마 검색</span>
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">최근 검색</h3>
          {searchHistory.map((item, index) => (
            <div key={index} className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
              {item.title} ({item.count}개 문장)
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">즐겨찾기</h3>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
            ⭐ TOEIC 필수 표현
          </div>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
            ⭐ 면접 영어 표현
          </div>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
            ⭐ 친구와의 대화
          </div>
        </div>
      </div>
    </div>
  );
}
