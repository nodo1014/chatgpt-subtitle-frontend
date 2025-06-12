'use client';

import { useRouter } from 'next/navigation';

interface PrimarySidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  isCollapsed: boolean;
}

interface MenuIcon {
  id: string;
  icon: string;
  label: string;
  tooltip: string;
}

const menuIcons: MenuIcon[] = [
  { id: 'v3', icon: '🚀', label: 'v3', tooltip: 'v3 DB 관리 툴 - 작업파일 기반 자막 관리' },
  { id: 'production', icon: '🎬', label: '제작', tooltip: '컨텐츠 제작 도구' },
  { id: 'video-studio', icon: '🎭', label: '스튜디오', tooltip: 'Video Studio - 유튜브 컨텐츠 렌더링' },
  { id: 'search', icon: '🔍', label: '검색', tooltip: '클립 검색 및 탐색' },
  { id: 'manage', icon: '🗄️', label: '관리', tooltip: '클립 관리 및 정리' },
  { id: 'learning', icon: '📚', label: '학습', tooltip: '학습 도구' },
  { id: 'analysis', icon: '📊', label: '분석', tooltip: '텍스트 분석 도구' },
];

export default function PrimarySidebar({ activeMenu, onMenuChange, isCollapsed }: PrimarySidebarProps) {
  const router = useRouter();

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleMenuClick = (menuId: string) => {
    // 모든 메뉴는 기존 로직 사용
    onMenuChange(menuId);
  };

  return (
    <div className={`${isCollapsed ? 'w-0 overflow-hidden' : 'w-12'} bg-[#1e1e1e] flex flex-col border-r border-[#2d2d2d] transition-all duration-300 z-50`}>
      {/* 상단 로고/앱 아이콘 - 홈메뉴 */}
      <div className="p-2 border-b border-[#2d2d2d] flex items-center justify-center">
        <div 
          onClick={handleHomeClick}
          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 group relative"
          title="홈으로 이동"
        >
          Y
          
          {/* 툴팁 */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            홈으로 이동
          </div>
        </div>
      </div>

      {/* 메뉴 아이콘들 */}
      <div className="flex-1 py-2">
        {menuIcons.map((menu) => (
          <div
            key={menu.id}
            onClick={() => handleMenuClick(menu.id)}
            className={`
              relative mx-1 mb-1 w-10 h-10 rounded-lg cursor-pointer transition-all duration-200 
              flex items-center justify-center text-lg group
              ${activeMenu === menu.id 
                ? 'bg-[#0e639c] text-white' 
                : 'text-[#cccccc] hover:bg-[#2d2d2d] hover:text-white'
              }
            `}
            title={menu.tooltip}
          >
            <span>{menu.icon}</span>
            
            {/* 활성 메뉴 표시기 */}
            {activeMenu === menu.id && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-white rounded-r"></div>
            )}

            {/* 툴팁 */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {menu.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 시스템 메뉴 */}
      <div className="p-2 border-t border-[#2d2d2d]">
        {/* 프로필 아이콘 */}
        <div
          onClick={() => onMenuChange('profile')}
          className={`
            relative mx-1 mb-1 w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 
            flex items-center justify-center text-sm group
            ${activeMenu === 'profile' 
              ? 'bg-[#0e639c] text-white' 
              : 'text-[#cccccc] hover:bg-[#2d2d2d] hover:text-white'
            }
          `}
          title="프로필"
        >
          <span>👤</span>
          
          {/* 활성 메뉴 표시기 */}
          {activeMenu === 'profile' && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-white rounded-r"></div>
          )}

          {/* 툴팁 */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            프로필
          </div>
        </div>

        {/* 설정 아이콘 (가장 아래) */}
        <div
          onClick={() => onMenuChange('settings')}
          className={`
            relative mx-1 w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 
            flex items-center justify-center text-sm group
            ${activeMenu === 'settings' 
              ? 'bg-[#0e639c] text-white' 
              : 'text-[#cccccc] hover:bg-[#2d2d2d] hover:text-white'
            }
          `}
          title="설정"
        >
          <span>⚙️</span>
          
          {/* 활성 메뉴 표시기 */}
          {activeMenu === 'settings' && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-white rounded-r"></div>
          )}

          {/* 툴팁 */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            설정
          </div>
        </div>
      </div>
    </div>
  );
}
