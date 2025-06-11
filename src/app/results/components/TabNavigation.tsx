'use client';

import { SearchData, ViewMode } from '../types';
import StandardTabs from '@/components/ui/StandardTabs';

interface TabNavigationProps {
  viewMode: ViewMode;
  searchData: SearchData | null;
  clipsCount: number;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function TabNavigation({ 
  viewMode, 
  searchData, 
  clipsCount, 
  onViewModeChange 
}: TabNavigationProps) {
  return (
    <>
      <StandardTabs
        tabs={[
          {
            id: 'search',
            label: '검색 결과',
            icon: '🔍',
            badge: searchData ? searchData.search_summary.total_results : undefined
          },
          {
            id: 'clips',
            label: '클립',
            icon: '🎬',
            badge: clipsCount || undefined
          }
        ]}
        activeTab={viewMode}
        onTabChange={(tabId) => onViewModeChange(tabId as ViewMode)}
      />
      {/* 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50">
          DEBUG: viewMode={viewMode}, hasSearchData={!!searchData}, clipsCount={clipsCount}
        </div>
      )}
    </>
  );
}
