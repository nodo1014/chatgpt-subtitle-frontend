'use client';

import Link from 'next/link';

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

interface DashboardTabProps {
  categories: ContentCategory[];
  series: YoutubeSeries[];
}

export default function DashboardTab({ categories, series }: DashboardTabProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      planning: { icon: '💡', text: '기획 중', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { icon: '🚧', text: '제작 중', color: 'bg-blue-100 text-blue-800' },
      completed: { icon: '✅', text: '완료', color: 'bg-green-100 text-green-800' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.planning;
  };

  return (
    <div className="space-y-8">
      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                🎥
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행 중인 시리즈</p>
              <p className="text-2xl font-semibold text-gray-900">{series.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                📊
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 에피소드</p>
              <p className="text-2xl font-semibold text-gray-900">
                {series.reduce((sum, s) => sum + s.current_episode_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                🏷️
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">컨텐츠 카테고리</p>
              <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                📈
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">예상 조회수</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(series.reduce((sum, s) => sum + s.estimated_views, 0) / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 중인 시리즈 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🎥 진행 중인 시리즈</h2>
        </div>
        <div className="p-6">
          {series.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <p className="text-gray-500">아직 생성된 시리즈가 없습니다.</p>
              <Link href="/producer/series/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                첫 번째 시리즈 만들기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {series.map((seriesItem) => {
                const statusBadge = getStatusBadge(seriesItem.status);
                return (
                  <div key={seriesItem.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{seriesItem.category_icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{seriesItem.series_name}</h3>
                          <p className="text-sm text-gray-500">{seriesItem.category_name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.icon} {statusBadge.text}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{seriesItem.series_description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>진행률</span>
                          <span>{seriesItem.current_episode_count}/{seriesItem.target_episode_count} 에피소드</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${seriesItem.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>클립 수: {seriesItem.clip_count}</span>
                        <span>예상 조회수: {(seriesItem.estimated_views / 1000).toFixed(0)}K</span>
                      </div>
                      
                      <div className="flex space-x-2 pt-3">
                        <Link href={`/producer/series/${seriesItem.id}`} className="flex-1 bg-blue-600 text-white text-center py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                          편집하기
                        </Link>
                        <Link href={`/producer/series/${seriesItem.id}/clips`} className="flex-1 bg-gray-600 text-white text-center py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          클립 관리
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 컨텐츠 카테고리 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🏷️ 컨텐츠 카테고리</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/results?category=${category.id}`} className="block">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.category_type}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>대상: {category.target_audience}</span>
                    <span>예상 클립: {category.estimated_clips}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 