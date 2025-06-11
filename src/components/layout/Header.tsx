'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  onToggleSidebar: () => void;
  children?: ReactNode;
}

export default function Header({ 
  title = "Batch Search", 
  subtitle = "다중 문장 검색", 
  icon = "🔍",
  onToggleSidebar,
  children 
}: HeaderProps) {
  const router = useRouter();

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
          {icon} {title}
          <span className="text-sm text-gray-500">{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <button
          onClick={() => router.push('/ebook')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
        >
          📚 전자책
        </button>
        <button
          onClick={() => router.push('/results?view=clips')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
        >
          🎬 클립 보기
        </button>
        <div className="hidden lg:flex gap-5 text-sm text-gray-500">
          <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
            <span>📊</span>
            <span>270K+ 문장</span>
          </div>
          <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
            <span>🎬</span>
            <span>7개 미디어</span>
          </div>
          <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
            <span>⚡</span>
            <span>AI 추천</span>
          </div>
        </div>
      </div>
    </div>
  );
}
