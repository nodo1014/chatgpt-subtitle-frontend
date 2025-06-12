'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import AspectRatioSelector from './components/AspectRatioSelector';
import TextOverlaySettings from './components/TextOverlaySettings';
import RenderProgress from './components/RenderProgress';
import RenderHistory from './components/RenderHistory';
import RenderControl from './components/RenderControl';
import type { MediaFile, RenderJob, RenderSettings, ClipMetadata } from './types';

// 인라인 훅 정의
function useRenderSettings() {
  const DEFAULT_SETTINGS: RenderSettings = {
    aspectRatio: '16:9',
    quality: 'high',
    textOverlay: {
      enabled: false,
      englishText: '',
      koreanText: '',
      position: 'bottom',
      fontSize: 24,
      fontColor: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      opacity: 0.8,
    },
  };

  const [settings, setSettings] = useState<RenderSettings>(DEFAULT_SETTINGS);

  const updateSettings = useCallback((updates: Partial<RenderSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      textOverlay: {
        ...prev.textOverlay,
        ...(updates.textOverlay || {}),
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

function useRenderHistory() {
  const [history, setHistory] = useState<RenderJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addJob = useCallback((job: RenderJob) => {
    setHistory(prev => [job, ...prev]);
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<RenderJob>) => {
    setHistory(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setHistory(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getJob = useCallback((jobId: string) => {
    return history.find(job => job.id === jobId);
  }, [history]);

  return {
    history,
    isLoading,
    addJob,
    updateJob,
    removeJob,
    clearHistory,
    getJob,
  };
}

export default function VideoEditorPage() {
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clipId');
  
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [availableClips, setAvailableClips] = useState<ClipMetadata[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<any>(null);
  const { settings, updateSettings } = useRenderSettings();
  const { history, addJob, updateJob, removeJob, clearHistory } = useRenderHistory();

  // 클립 목록 로드
  const loadClips = async () => {
    setIsLoadingClips(true);
    try {
      const response = await fetch('/api/clips');
      const data = await response.json();
      if (data.success) {
        setAvailableClips(data.clips);
      }
    } catch (error) {
      console.error('클립 로드 실패:', error);
    } finally {
      setIsLoadingClips(false);
    }
  };

  // URL에 clipId가 있으면 해당 클립을 자동으로 로드
  const loadClipById = async (id: string) => {
    try {
      const response = await fetch(`/api/clips?id=${id}`);
      const data = await response.json();
      if (data.success && data.clip) {
        const clipFile: MediaFile = {
          id: data.clip.id,
          name: data.clip.title,
          path: data.clip.videoUrl,
          type: 'clip',
          size: 0,
          duration: parseFloat(data.clip.duration.replace('초', '')),
          clipMetadata: data.clip
        };
        setSelectedFiles([clipFile]);
        
        // 자막 데이터를 렌더링 설정에 자동 적용
        updateSettings({
          textOverlay: {
            ...settings.textOverlay,
            enabled: true,
            englishText: data.clip.englishSubtitle || '',
            koreanText: data.clip.hasKoreanSubtitle ? data.clip.koreanSubtitle : ''
          }
        });
      }
    } catch (error) {
      console.error('클립 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadClips();
    if (clipId) {
      loadClipById(clipId);
    }
  }, [clipId]);

  // 클립 선택 함수
  const handleClipSelect = (clip: ClipMetadata) => {
    const clipFile: MediaFile = {
      id: clip.id,
      name: clip.title,
      path: clip.videoUrl || clip.clipPath,
      type: 'clip',
      size: 0,
      duration: parseFloat(clip.duration.replace('초', '')),
      clipMetadata: clip
    };
    setSelectedFiles([clipFile]);
    
    // 자막 데이터를 렌더링 설정에 자동 적용
    updateSettings({
      textOverlay: {
        ...settings.textOverlay,
        enabled: true,
        englishText: clip.englishSubtitle || '',
        koreanText: clip.hasKoreanSubtitle ? clip.koreanSubtitle : ''
      }
    });
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🎬 영상 편집기</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">테스트 페이지</h2>
          <p className="text-gray-600 mb-4">영상 편집 기능을 테스트해보세요.</p>
          
          <div className="mb-6">
            <AspectRatioSelector
              settings={settings}
              onUpdate={(updates) => updateSettings(updates)}
            />
          </div>
          
          <div className="mb-6">
            <TextOverlaySettings
              settings={settings}
              onUpdate={(updates) => updateSettings({ 
                textOverlay: { 
                  ...settings.textOverlay, 
                  ...updates 
                } 
              })}
            />
          </div>
          
          <button 
            onClick={() => console.log('테스트 버튼 클릭!')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            테스트 버튼
          </button>
        </div>
      </div>
    </div>
  );
}
