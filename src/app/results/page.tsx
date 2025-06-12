'use client';

import { useResultsData, useClipOperations } from './hooks';
import { showToastMessage } from './utils';
import { SearchData } from './types';
import AppLayout from '@/components/layout/AppLayout';

// Components
import TabNavigation from './components/TabNavigation';
import AutoClipProgress from './components/AutoClipProgress';
import SearchResults from './components/SearchResults';
import ClipsView from './components/ClipsView';
import Toast from './components/Toast';

export default function ResultsPage() {
  const {
    // State
    searchData,
    loading,
    clipsLoading,
    clippingStatus,
    setClippingStatus,
    clips,
    setClips,
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    searchHistory,
    autoClipProgress,
    setAutoClipProgress,
    showToast,
    setShowToast,
    toastMessage,
    setToastMessage,
    // Functions
    loadClips,
    router
  } = useResultsData();

  const {
    createAutoClipsInBackground,
    createClip,
    deleteClip
  } = useClipOperations(
    clippingStatus,
    setClippingStatus,
    setClips,
    setViewMode,
    setAutoClipProgress,
    setToastMessage,
    setShowToast,
    loadClips
  );

  // Event handlers
  const handleNewSearch = () => {
    router.push('/');
  };

  const handleClipsView = () => {
    router.push('/results?view=clips');
  };

  const handleViewModeChange = (mode: 'search' | 'clips') => {
    setViewMode(mode);
  };

  const handleToast = (message: string) => {
    showToastMessage(message, setToastMessage, setShowToast);
  };

  const handleCreateAutoClips = (data: SearchData) => {
    createAutoClipsInBackground(data);
  };

  // Loading state - 검색 모드에서만 loading 체크, 클립 모드에서는 clipsLoading 체크
  if (loading && viewMode === 'search') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">검색 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Header content for AppLayout
  const headerContent = (
    <div className="flex items-center gap-4">
      <button
        onClick={handleClipsView}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <span>🎬</span>
        <span>클립 보기</span>
      </button>
    </div>
  );

  return (
    <AppLayout 
      title={viewMode === 'search' ? '검색 결과' : '클립 관리'} 
      subtitle={searchData ? `"${searchData.sentence_results[0]?.search_sentence || ''}"에 대한 결과` : '클립 컬렉션'}
      icon="🔍"
      headerChildren={headerContent}
    >
      {/* Tab Navigation */}
      <TabNavigation
        viewMode={viewMode}
        searchData={searchData}
        clipsCount={clips.length}
        onViewModeChange={handleViewModeChange}
      />

      {/* Auto Clip Progress */}
      <AutoClipProgress progress={autoClipProgress} />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full px-6 py-6">
          {viewMode === 'search' && searchData ? (
            <SearchResults
              searchData={searchData}
              clippingStatus={clippingStatus}
              onCreateClip={createClip}
              onCreateAutoClips={handleCreateAutoClips}
            />
          ) : viewMode === 'clips' ? (
            <ClipsView
              clips={clips}
              searchData={searchData}
              onDeleteClip={deleteClip}
              onToast={handleToast}
              onViewModeChange={handleViewModeChange}
              onNewSearch={handleNewSearch}
              isLoading={clipsLoading}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">검색 결과를 찾을 수 없습니다</h3>
                <p className="text-gray-600 mb-6">새로운 검색을 시작해보세요.</p>
                <button 
                  onClick={handleNewSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  새 검색 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </AppLayout>
  );
}
