'use client';

import { useState, useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface HistoryItem {
  title: string;
  count: number;
  timestamp: string;
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  headerChildren?: ReactNode;
}

export default function AppLayout({ 
  children, 
  title, 
  subtitle, 
  icon,
  headerChildren 
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // 모바일에서는 사이드바 기본 숨김
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }

    // 검색 히스토리 로드
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    // 동적 사이드바 시스템으로 전환되어 더 이상 하드코딩된 검색 히스토리는 사용하지 않습니다.
    // 실제 검색 히스토리가 필요한 경우 API에서 로드할 수 있습니다.
    setSearchHistory([]);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f23] transition-all duration-300">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        searchHistory={searchHistory}
        onToggle={toggleSidebar}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden transition-all duration-300">
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          icon={icon}
          onToggleSidebar={toggleSidebar}
        >
          {headerChildren}
        </Header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
