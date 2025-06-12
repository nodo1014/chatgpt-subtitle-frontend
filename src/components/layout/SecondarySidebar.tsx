'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import V3MenuContent from '@/components/sidebar/V3MenuContent';
import ProductionMenuContent from '@/components/sidebar/ProductionMenuContent';
import SimpleMenuContents from '@/components/sidebar/SimpleMenuContents';

interface SecondarySidebarProps {
  activeMenu: string;
  isCollapsed: boolean;
}

export default function SecondarySidebar({ activeMenu, isCollapsed }: SecondarySidebarProps) {
  const [width, setWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const minWidth = 200;
  const maxWidth = 400;

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

  const renderContent = () => {
    switch (activeMenu) {
      case 'v3':
        return <V3MenuContent />;
      case 'production':
        return <ProductionMenuContent />;
      default:
        return <SimpleMenuContents activeMenu={activeMenu} />;
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
