'use client';

import { useRouter } from 'next/navigation';

interface HistoryItem {
  title: string;
  count: number;
  timestamp: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  searchHistory: HistoryItem[];
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, searchHistory, onToggle }: SidebarProps) {
  const router = useRouter();

  return (
    <div className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-64'} bg-[#171717] text-[#ececf1] flex flex-col border-r border-[#2d2d2d] transition-all duration-300 z-50`}>
      <div className="p-4 border-b border-[#2d2d2d] flex justify-between items-center">
        <button className="flex-1 bg-transparent border border-[#2d2d2d] text-[#ececf1] p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm mr-2 hover:bg-[#2d2d2d]">
          <span>➕</span>
          <span>새 검색</span>
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">검색 히스토리</h3>
          {searchHistory.map((item, index) => (
            <div 
              key={index} 
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]"
            >
              {item.title} ({item.count}개 문장)
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">학습 메뉴</h3>
          <div 
            onClick={() => router.push('/ebook')}
            className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
          >
            <span>📚</span>
            <span>전자책 읽기</span>
          </div>
          <div 
            onClick={() => router.push('/results?view=clips')}
            className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
          >
            <span>🎬</span>
            <span>클립 보기</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">시스템</h3>
          <div 
            onClick={() => router.push('/clips-manage')}
            className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
          >
            <span>🗄️</span>
            <span>클립 관리</span>
          </div>
          <div 
            onClick={() => router.push('/settings')}
            className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>환경설정</span>
          </div>
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
