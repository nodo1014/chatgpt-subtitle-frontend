'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SidebarMenu {
  id: number;
  name: string;
  icon: string;
  menu_type: string;
  target_id?: number;
  url?: string;
  workflow_stage?: string;
  children?: SidebarMenu[];
}

interface SecondarySidebarProps {
  activeMenu: string;
  isCollapsed: boolean;
}

export default function SecondarySidebar({ activeMenu, isCollapsed }: SecondarySidebarProps) {
  const router = useRouter();
  const [menus, setMenus] = useState<SidebarMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(280); // 기본 너비를 280px로 축소
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const minWidth = 200;
  const maxWidth = 400;

  useEffect(() => {
    if (activeMenu === 'production') {
      loadMenus();
    } else {
      setLoading(false);
    }
  }, [activeMenu]);

  // 리사이즈 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX - (sidebarRef.current?.getBoundingClientRect().left || 0) - 48; // PrimarySidebar 너비(48px) 제외
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const loadMenus = async () => {
    try {
      const response = await fetch('/api/sidebar/menus');
      const data = await response.json();
      if (data.success) {
        setMenus(data.menus);
      }
    } catch (error) {
      console.error('메뉴 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (menu: SidebarMenu) => {
    if (menu.url) {
      router.push(menu.url);
    } else if (menu.menu_type === 'category' && menu.target_id) {
      router.push(`/results?category=${menu.target_id}`);
    } else if (menu.menu_type === 'series' && menu.target_id) {
      router.push(`/producer/series/${menu.target_id}`);
    } else if (menu.workflow_stage) {
      switch (menu.workflow_stage) {
        case 'planning':
          router.push('/producer');
          break;
        case 'collection':
          router.push('/results');
          break;
        case 'editing':
          router.push('/producer');
          break;
        case 'publishing':
          router.push('/producer');
          break;
      }
    }
  };

  const renderMenuItem = (menu: SidebarMenu, isChild = false) => (
    <div key={menu.id} className={`${isChild ? 'ml-4' : ''}`}>
      <div
        onClick={() => handleMenuClick(menu)}
        className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
      >
        <span>{menu.icon}</span>
        <span>{menu.name}</span>
        {menu.children && menu.children.length > 0 && (
          <span className="text-xs text-[#8e8ea0] ml-auto">({menu.children.length})</span>
        )}
      </div>
      {menu.children && menu.children.map(child => renderMenuItem(child, true))}
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'production':
        return (
          <div>
            <div className="p-4 border-b border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-white mb-2">컨텐츠 제작</h2>
              <p className="text-xs text-[#8e8ea0]">유튜브 컨텐츠 제작 워크플로우</p>
            </div>
            <div className="p-4 overflow-y-auto">
              {/* 빠른 액션 */}
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">빠른 시작</h3>
                <button 
                  onClick={() => router.push('/producer')}
                  className="w-full bg-[#0e639c] text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:bg-[#1177bb] mb-2"
                >
                  <span>🎬</span>
                  <span>제작 대시보드</span>
                </button>
              </div>

              {/* 동적 컨텐츠 제작 메뉴 */}
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">프로젝트</h3>
                {loading ? (
                  <div className="p-2.5 text-sm text-[#8e8ea0]">메뉴 로딩 중...</div>
                ) : (
                  <div>
                    {menus.map(menu => renderMenuItem(menu))}
                  </div>
                )}
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
                  onClick={() => router.push('/clips-manage')}
                  className="w-full bg-[#0e639c] text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:bg-[#1177bb] mb-2"
                >
                  <span>🗄️</span>
                  <span>클립 데이터베이스</span>
                </button>
                <div className="space-y-2">
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>📁</span>
                    <span>폴더 관리</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🏷️</span>
                    <span>태그 관리</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🔍</span>
                    <span>중복 클립 찾기</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🧹</span>
                    <span>데이터 정리</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'learning':
        return (
          <div>
            <div className="p-4 border-b border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-white mb-2">학습 도구</h2>
              <p className="text-xs text-[#8e8ea0]">영어 학습 및 읽기 도구</p>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">도구</h3>
                <button 
                  onClick={() => router.push('/ebook')}
                  className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-2 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
                >
                  <span>📚</span>
                  <span>전자책 읽기</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div>
            <div className="p-4 border-b border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-white mb-2">텍스트 분석</h2>
              <p className="text-xs text-[#8e8ea0]">텍스트 분석 및 처리 도구</p>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">분석 도구</h3>
                <button 
                  onClick={() => router.push('/text-analyzer')}
                  className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-2 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
                >
                  <span>📝</span>
                  <span>텍스트 분석기</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <div className="p-4 border-b border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-white mb-2">설정</h2>
              <p className="text-xs text-[#8e8ea0]">애플리케이션 환경설정</p>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">일반 설정</h3>
                <button 
                  onClick={() => router.push('/settings')}
                  className="w-full bg-[#0e639c] text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:bg-[#1177bb] mb-2"
                >
                  <span>⚙️</span>
                  <span>환경설정</span>
                </button>
                <div className="space-y-2">
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🎨</span>
                    <span>테마 설정</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🔔</span>
                    <span>알림 설정</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🌐</span>
                    <span>언어 설정</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>💾</span>
                    <span>백업 설정</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div>
            <div className="p-4 border-b border-[#2d2d2d]">
              <h2 className="text-lg font-semibold text-white mb-2">프로필</h2>
              <p className="text-xs text-[#8e8ea0]">사용자 계정 및 프로필 설정</p>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">계정 정보</h3>
                <div className="flex items-center gap-3 p-3 bg-[#2d2d2d] rounded-lg mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    Y
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">YouTube Creator</div>
                    <div className="text-xs text-[#8e8ea0]">content@youtube.com</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>👤</span>
                    <span>프로필 편집</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🔑</span>
                    <span>계정 설정</span>
                  </button>
                  <button className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2">
                    <span>🚪</span>
                    <span>로그아웃</span>
                  </button>
                </div>
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
  };

  return (
    <div 
      ref={sidebarRef}
      className={`${isCollapsed ? 'w-0 overflow-hidden' : ''} bg-[#171717] text-[#ececf1] flex border-r border-[#2d2d2d] transition-all duration-300 z-40 relative`}
      style={{ width: isCollapsed ? 0 : width }}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
      
      {/* 리사이즈 핸들 */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors duration-200 group"
          style={{ backgroundColor: isResizing ? '#3b82f6' : 'transparent' }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-[#2d2d2d] rounded-l-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="w-0.5 h-4 bg-[#666] rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
}
