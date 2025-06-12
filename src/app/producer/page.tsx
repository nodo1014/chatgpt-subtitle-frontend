'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import DashboardTab from '@/components/producer/DashboardTab';
import EditorTab from '@/components/producer/EditorTab';

interface ContentCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  category_type: string;
  target_audience: string;
  estimated_clips: number;
}

interface YoutubeSeries {
  id: number;
  series_name: string;
  series_description: string;
  target_episode_count: number;
  current_episode_count: number;
  status: string;
  upload_schedule: string;
  estimated_views: number;
  category_name: string;
  category_icon: string;
  clip_count: number;
  progress: number;
}

export default function ProducerDashboard() {
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [series, setSeries] = useState<YoutubeSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [categoriesRes, seriesRes] = await Promise.all([
        fetch('/api/content/categories'),
        fetch('/api/content/series')
      ]);

      const categoriesData = await categoriesRes.json();
      const seriesData = await seriesRes.json();

      if (categoriesData.success) setCategories(categoriesData.categories);
      if (seriesData.success) setSeries(seriesData.series);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      title="컨텐츠 제작 스튜디오"
      subtitle="유튜브 영어 학습 컨텐츠 제작 워크플로우"
      icon="🎬"
      headerChildren={
        <div className="flex space-x-3">
          <Link href="/producer/series/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            + 새 시리즈
          </Link>
          <Link href="/results" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            클립 검색
          </Link>
        </div>
      }
    >
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 대시보드
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📝 문장 편집기
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'dashboard' && (
        <DashboardTab categories={categories} series={series} />
      )}

      {activeTab === 'editor' && (
        <EditorTab />
      )}
    </AppLayout>
  );
}
