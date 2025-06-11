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
    // 기본 샘플 데이터 사용
    const sampleHistory: HistoryItem[] = [
      { title: '💕 사랑과 관계 표현', count: 15, timestamp: '2024-01-15' },
      { title: '💼 비즈니스 미팅 영어', count: 12, timestamp: '2024-01-14' },
      { title: '☕ 일상 대화 표현', count: 18, timestamp: '2024-01-13' },
      { title: '🛍️ 쇼핑 영어', count: 13, timestamp: '2024-01-06' },
    ];
    setSearchHistory(sampleHistory);
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
