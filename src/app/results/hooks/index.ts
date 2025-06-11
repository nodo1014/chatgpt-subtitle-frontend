// Results 페이지 커스텀 훅들
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  SearchData, 
  ClipMetadata, 
  ViewMode, 
  ClippingStatus, 
  AutoClipProgress, 
  HistoryItem,
  SearchResult
} from '../types';
import { loadSearchHistory } from '../utils';

export const useResultsData = () => {
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clippingStatus, setClippingStatus] = useState<ClippingStatus>({});
  const [clips, setClips] = useState<ClipMetadata[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // 기본적으로 숨김
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [autoClipProgress, setAutoClipProgress] = useState<AutoClipProgress>({ 
    isCreating: false, 
    progress: 0, 
    total: 0, 
    current: '' 
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // 초기화 effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Results 페이지 초기화');
    }
    
    // 모바일에서는 사이드바 기본 숨김
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }

    // 검색 히스토리 로드
    setSearchHistory(loadSearchHistory());
    
    // URL에서 view 파라미터 확인
    const viewParam = searchParams.get('view');
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 URL view 파라미터:', viewParam);
    }
    
    if (viewParam === 'clips') {
      setViewMode('clips');
    }

    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        setSearchData(data);
      } catch (error) {
        console.error('URL 데이터 파싱 오류:', error);
      }
    } else {
      console.warn('URL에 검색 데이터가 없습니다.');
    }
    setLoading(false);
  }, [searchParams, router]);

  // 클립 목록 자동 새로고침
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (viewMode === 'clips' || autoClipProgress.isCreating) {
      // 2초마다 클립 목록 새로고침
      intervalId = setInterval(() => {
        loadClips();
      }, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [viewMode, autoClipProgress.isCreating]);

  const loadClips = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 클립 목록 로드 중...');
      }
      const response = await fetch('/api/clips');
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 클립 목록 응답:', data);
      }
      
      if (data.success) {
        setClips(data.clips || []);
      } else {
        console.error('클립 목록 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('클립 목록 로드 오류:', error);
    }
  };

  return {
    // State
    searchData,
    setSearchData,
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
  };
};

export const useClipOperations = (
  clippingStatus: ClippingStatus,
  setClippingStatus: React.Dispatch<React.SetStateAction<ClippingStatus>>,
  setClips: React.Dispatch<React.SetStateAction<ClipMetadata[]>>,
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>,
  setAutoClipProgress: React.Dispatch<React.SetStateAction<AutoClipProgress>>,
  setToastMessage: React.Dispatch<React.SetStateAction<string>>,
  setShowToast: React.Dispatch<React.SetStateAction<boolean>>,
  loadClips: () => Promise<void>
) => {
  // 백그라운드 클립 생성
  const createAutoClipsInBackground = async (data: SearchData) => {
    console.log('🚀 백그라운드 클립 생성 시작');
    console.log('📥 받은 데이터:', data);
    
    const totalExpected = data.sentence_results.reduce((acc, sr) => acc + Math.min(sr.results.length, 5), 0);
    
    // 즉시 진행 상황 UI 표시
    setAutoClipProgress({ 
      isCreating: true, 
      progress: 0, 
      total: totalExpected,
      current: `🎬 클립 생성 준비 중... (총 ${totalExpected}개 예상)` 
    });
    
    // 실시간 클립 목록 업데이트를 위한 인터벌 설정
    const clipRefreshInterval = setInterval(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 클립 목록 새로고침 (백그라운드)');
      }
      await loadClips();
    }, 2000); // 2초마다 클립 목록 새로고침
    
    // 백그라운드에서 클립 생성 (UI 블로킹 없음)
    setTimeout(async () => {
      try {
        const response = await fetch('/api/auto-clips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sentence_results: data.sentence_results })
        });

        const result = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('🎬 백그라운드 클립 생성 결과:', result);
        }
        
        if (result.success) {
          clearInterval(clipRefreshInterval);
          setAutoClipProgress({ 
            isCreating: false, 
            progress: result.total_created, 
            total: result.total_processed, 
            current: `✅ ${result.total_created}개 클립 생성 완료!` 
          });
          
          // 최종 클립 목록 로드
          await loadClips();
          
          // 성공 토스트
          setToastMessage(`🎉 ${result.total_created}개 클립이 생성되었습니다!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
          
        } else {
          console.error('백그라운드 클립 생성 실패:', result.error);
          clearInterval(clipRefreshInterval);
          setAutoClipProgress({ 
            isCreating: false, 
            progress: 0, 
            total: 0, 
            current: '❌ 클립 생성 실패' 
          });
        }
      } catch (error) {
        console.error('백그라운드 클립 생성 오류:', error);
        clearInterval(clipRefreshInterval);
        setAutoClipProgress({ 
          isCreating: false, 
          progress: 0, 
          total: 0, 
          current: '❌ 클립 생성 중 오류 발생' 
        });
      }
    }, 100); // 100ms 후 시작 (UI 렌더링 완료 후)
  };

  // 개별 클립 생성
  const createClip = async (sentence: string, result: SearchResult, sentenceIndex: number, resultIndex: number) => {
    const clipKey = `${sentenceIndex}-${resultIndex}`;
    
    if (clippingStatus[clipKey]) return;
    
    setClippingStatus(prev => ({ ...prev, [clipKey]: true }));
    
    try {
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentence,
          subtitle_text: result.subtitle_text,
          media_file: result.media_file,
          start_time: result.start_time,
          end_time: result.end_time,
          korean_subtitle: `한글 번역: ${sentence}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setClips(prev => [data.clip, ...prev]);
        setViewMode('clips');
      } else {
        console.error('클립 생성 실패:', data.error);
      }
    } catch (error) {
      console.error('클립 생성 오류:', error);
    } finally {
      setClippingStatus(prev => ({ ...prev, [clipKey]: false }));
    }
  };

  // 클립 삭제
  const deleteClip = async (clipId: string) => {
    if (!confirm('정말로 이 클립을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setClips(prev => prev.filter(clip => clip.id !== clipId));
      } else {
        console.error('클립 삭제 실패');
      }
    } catch (error) {
      console.error('클립 삭제 오류:', error);
    }
  };

  return {
    createAutoClipsInBackground,
    createClip,
    deleteClip
  };
};
