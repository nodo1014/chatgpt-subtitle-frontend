'use client';

import { useResultsData, useClipOperations } from './hooks';
import { showToastMessage } from './utils';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
    setClippingStatus,
    setClips,
    setViewMode,
    setAutoClipProgress,
    setToastMessage,
    setShowToast,
    loadClips
  );

  // Event handlers
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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

  const handleCreateAutoClips = (data: any) => {
    createAutoClipsInBackground(data);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">검색 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f23] transition-all duration-300 relative">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        searchHistory={searchHistory}
        onNewSearch={handleNewSearch}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden transition-all duration-300">
        {/* Header */}
        <Header
          viewMode={viewMode}
          searchData={searchData}
          onToggleSidebar={handleToggleSidebar}
          onClipsView={handleClipsView}
        />

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
        <div className="flex-1 overflow-y-auto p-6">
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
            />
          ) : (
            <div className="max-w-6xl mx-auto text-center py-16">
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
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
