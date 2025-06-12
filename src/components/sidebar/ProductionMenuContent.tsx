'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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

export default function ProductionMenuContent() {
  const router = useRouter();
  const [menus, setMenus] = useState<SidebarMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenus();
  }, []);

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
} 