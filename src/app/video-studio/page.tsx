'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';

// 컴포넌트 임포트
import WorkspaceSelector from './components/WorkspaceSelector';
import TemplateSelector from './components/TemplateSelector';
import CommonSettings from './components/CommonSettings';
import ClipList from './components/ClipSelector';
import PreviewSection from './components/PreviewSection';
import RenderControl from './components/RenderControl';

// 타입과 데이터 임포트
import { 
  CommonRenderSettings, 
  RepeatSettings, 
  WorkspaceClip, 
  Workspace,
  RenderTemplate
} from './types';
import { templates } from './data/templates';

export default function VideoStudioPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [clips, setClips] = useState<WorkspaceClip[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [commonSettings, setCommonSettings] = useState<CommonRenderSettings>({
    repeatCount: 3,
    subtitlePosition: 'bottom',
    repeatSettings: [
      { showEnglish: true, showKorean: false, showExplanation: false, showPronunciation: false, pauseAfter: 0.5 },
      { showEnglish: true, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 },
      { showEnglish: false, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 }
    ],
    globalOptions: {
      fadeInOut: true,
      backgroundBlur: false,
      showProgress: true
    },
    fontSettings: {
      size: 84,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 1,
      fontFamily: 'Noto Sans KR'
    }
  });
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [selectedClipForPreview, setSelectedClipForPreview] = useState<string>('');
  const [useRealTimePreview, setUseRealTimePreview] = useState(true);

  // 워크스페이스 목록 로드
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 선택된 워크스페이스의 클립 로드
  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceClips(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  // 클립이 변경될 때 첫번째 클립을 미리보기로 선택
  useEffect(() => {
    if (clips.length > 0) {
      setSelectedClipForPreview(clips[0].id);
    }
  }, [clips]);

  // 반복횟수가 변경될 때 반복설정 배열 업데이트
  useEffect(() => {
    const currentCount = commonSettings.repeatCount;
    const currentRepeatSettings = commonSettings.repeatSettings;
    
    if (currentRepeatSettings.length !== currentCount) {
      const newRepeatSettings: RepeatSettings[] = [];
      
      for (let i = 0; i < currentCount; i++) {
        if (i < currentRepeatSettings.length) {
          // 기존 설정 유지
          newRepeatSettings.push(currentRepeatSettings[i]);
        } else {
          // 새로운 회차에 대한 기본 설정
          if (i === 0) {
            newRepeatSettings.push({ showEnglish: true, showKorean: false, showExplanation: false, showPronunciation: false, pauseAfter: 0.5 });
          } else if (i === currentCount - 1) {
            newRepeatSettings.push({ showEnglish: false, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 });
          } else {
            newRepeatSettings.push({ showEnglish: true, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 });
          }
        }
      }
      
      setCommonSettings(prev => ({
        ...prev,
        repeatSettings: newRepeatSettings
      }));
    }
  }, [commonSettings.repeatCount]);

  // 공통 설정 업데이트 함수
  const updateCommonSettings = (updates: Partial<CommonRenderSettings>) => {
    setCommonSettings(prev => ({ ...prev, ...updates }));
  };

  // 특정 반복회차 설정 업데이트 함수
  const updateRepeatSettings = (repeatIndex: number, updates: Partial<RepeatSettings>) => {
    setCommonSettings(prev => ({
      ...prev,
      repeatSettings: prev.repeatSettings.map((setting, index) => 
        index === repeatIndex ? { ...setting, ...updates } : setting
      )
    }));
  };

  const loadWorkspaces = async () => {
    try {
      // v3 워크스페이스 API 호출
      const response = await fetch('/api/v3/workspace?includeStats=true');
      const data = await response.json();
      
      if (data.success && data.workspaces) {
        // 워크스페이스 데이터를 Video Studio 형태로 변환
        const studioWorkspaces = data.workspaces.map((workspace: any) => ({
          id: workspace.id.toString(),
          name: workspace.name,
          clip_count: workspace.sentence_count || 0,
          description: workspace.description
        }));
        setWorkspaces(studioWorkspaces);
      } else {
        console.error('워크스페이스 로드 실패:', data);
      }
    } catch (error) {
      console.error('워크스페이스 로드 실패:', error);
    }
  };

  const loadWorkspaceClips = async (workspaceId: string) => {
    try {
      // 실제 워크스페이스 클립 API 호출
      const response = await fetch(`/api/workspaces/${workspaceId}/clips`);
      const data = await response.json();
      
      if (data.success && data.clips) {
        setClips(data.clips);
        console.log(`워크스페이스 ${workspaceId}에서 ${data.clips.length}개 클립 로드됨`);
      } else {
        console.error('클립 로드 실패:', data);
        setClips([]);
      }
    } catch (error) {
      console.error('클립 로드 중 오류:', error);
      setClips([]);
    }
  };

  const handleRender = async () => {
    if (!selectedWorkspace || !selectedTemplate || clips.length === 0) {
      alert('워크스페이스, 템플릿, 클립을 모두 선택해주세요.');
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);

    try {
      const renderJob = {
        workspace_id: selectedWorkspace,
        template_id: selectedTemplate,
        clips: clips.map(clip => ({
          ...clip,
          render_settings: commonSettings // 모든 클립에 공통 설정 적용
        })),
        common_settings: commonSettings,
        options: {
          include_english: commonSettings.repeatSettings.some(r => r.showEnglish),
          include_korean: commonSettings.repeatSettings.some(r => r.showKorean),
          include_explanation: commonSettings.repeatSettings.some(r => r.showExplanation),
          include_pronunciation: commonSettings.repeatSettings.some(r => r.showPronunciation),
          repeat_count: commonSettings.repeatCount,
          subtitle_position: commonSettings.subtitlePosition,
          global_options: commonSettings.globalOptions
        }
      };

      const response = await fetch('/api/video-studio/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renderJob)
      });

      const data = await response.json();
      
      if (data.success) {
        // 진행률 폴링 시작
        pollRenderProgress(data.job_id);
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('렌더링 시작 실패:', error);
      alert('렌더링을 시작할 수 없습니다.');
      setIsRendering(false);
    }
  };

  const pollRenderProgress = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video-studio/progress/${jobId}`);
        const data = await response.json();
        
        setRenderProgress(data.progress);
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setIsRendering(false);
          alert(`렌더링 완료! 결과: ${data.output_path}`);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsRendering(false);
          alert(`렌더링 실패: ${data.error}`);
        }
      } catch (error) {
        console.error('진행률 확인 실패:', error);
      }
    }, 2000);
  };

  // 렌더링 가능 여부 체크
  const canRender = selectedWorkspace && selectedTemplate && clips.length > 0;

  return (
    <AppLayout 
      title="Video Studio" 
      subtitle="워크스페이스 클립으로 유튜브 콘텐츠 제작"
      icon="🎬"
    >
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="grid grid-cols-12 gap-6 h-full">
          
          {/* 왼쪽: 전역 설정 패널 */}
          <div className="col-span-3 space-y-4">
            <WorkspaceSelector
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onWorkspaceChange={setSelectedWorkspace}
            />

            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />

            <CommonSettings
              settings={commonSettings}
              onSettingsChange={updateCommonSettings}
              onRepeatSettingsChange={updateRepeatSettings}
            />
          </div>

          {/* 오른쪽: 클립 목록 + 미리보기 */}
          <div className="col-span-4 space-y-4">
            <ClipList
              clips={clips}
              selectedClipForPreview={selectedClipForPreview}
              onClipSelect={setSelectedClipForPreview}
            />

            <PreviewSection
              clips={clips}
              selectedClipForPreview={selectedClipForPreview}
              settings={commonSettings}
              template={templates.find(t => t.id === selectedTemplate)}
              useRealTimePreview={useRealTimePreview}
              onToggleRealTimePreview={setUseRealTimePreview}
            />
          </div>

          {/* 맨 오른쪽: 렌더링 패널 */}
          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-sm h-full">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  🎥 렌더링
                </h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* 렌더링 설정 요약 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-medium mb-2">설정 요약</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>워크스페이스: {workspaces.find(w => w.id === selectedWorkspace)?.name || '선택안됨'}</div>
                    <div>템플릿: {templates.find(t => t.id === selectedTemplate)?.name || '선택안됨'}</div>
                    <div>클립 수: {clips.length}개</div>
                    <div>반복: {commonSettings.repeatCount}회</div>
                  </div>
                </div>

                <RenderControl
                  isRendering={isRendering}
                  renderProgress={renderProgress}
                  canRender={canRender}
                  onRender={handleRender}
                />

                {/* 렌더링 사전 체크 */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">체크리스트</h3>
                  <div className="space-y-1 text-sm">
                    <div className={`flex items-center gap-2 ${selectedWorkspace ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedWorkspace ? '✅' : '❌'} 워크스페이스 선택
                    </div>
                    <div className={`flex items-center gap-2 ${selectedTemplate ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedTemplate ? '✅' : '❌'} 템플릿 선택
                    </div>
                    <div className={`flex items-center gap-2 ${clips.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {clips.length > 0 ? '✅' : '❌'} 클립 데이터 ({clips.length}개)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
