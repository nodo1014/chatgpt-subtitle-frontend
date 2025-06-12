'use client';

import { useRouter } from 'next/navigation';

interface SimpleMenuContentsProps {
  activeMenu: string;
}

export default function SimpleMenuContents({ activeMenu }: SimpleMenuContentsProps) {
  const router = useRouter();

  switch (activeMenu) {
    case 'video-studio':
      return (
        <div>
          <div className="p-4 border-b border-[#2d2d2d]">
            <h2 className="text-lg font-semibold text-white mb-2">Video Studio</h2>
            <p className="text-xs text-[#8e8ea0]">유튜브 컨텐츠 렌더링 시스템</p>
          </div>
          <div className="p-4 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">빠른 시작</h3>
              <button 
                onClick={() => router.push('/video-studio')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:from-purple-700 hover:to-blue-700 mb-2"
              >
                <span>🎭</span>
                <span>Video Studio 열기</span>
              </button>
            </div>
          </div>
        </div>
      );

    case 'search':
      return (
        <div>
          <div className="p-4 border-b border-[#2d2d2d]">
            <h2 className="text-lg font-semibold text-white mb-2">클립 검색</h2>
            <p className="text-xs text-[#8e8ea0]">영상 클립 검색 및 탐색</p>
          </div>
          <div className="p-4 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">검색 도구</h3>
              <button 
                onClick={() => router.push('/results')}
                className="w-full bg-[#0e639c] text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:bg-[#1177bb] mb-2"
              >
                <span>🔍</span>
                <span>고급 검색</span>
              </button>
            </div>
          </div>
        </div>
      );

    case 'manage':
      return (
        <div>
          <div className="p-4 border-b border-[#2d2d2d]">
            <h2 className="text-lg font-semibold text-white mb-2">클립 관리</h2>
            <p className="text-xs text-[#8e8ea0]">영상 클립 관리 및 정리</p>
          </div>
          <div className="p-4 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">클립 관리</h3>
              <button 
                onClick={() => router.push('/subtitle-manager')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:from-green-700 hover:to-teal-700 mb-2"
              >
                <span>📝</span>
                <span>자막 관리</span>
              </button>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 text-center text-[#8e8ea0]">
          <p className="text-sm">메뉴를 선택해주세요</p>
        </div>
      );
  }
} 