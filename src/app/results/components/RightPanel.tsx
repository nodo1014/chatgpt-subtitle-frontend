'use client';

import { useState, useEffect, useRef } from 'react';

interface ClipMetadata {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle: string;
  koreanSubtitle: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration: string;
  tags: string[];
}

interface RightPanelProps {
  clip: ClipMetadata | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function RightPanel({ clip, isVisible, onClose }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState('player');
  const [clipMetadata, setClipMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(384); // 기본 384px
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 리사이징 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // 마우스 이동 시 크기 조절
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) { // 최소 300px, 최대 800px
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // 클립 메타데이터 로드
  useEffect(() => {
    if (clip) {
      loadClipMetadata(clip.id);
    }
  }, [clip]);

  const loadClipMetadata = async (clipId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clips/${clipId}/metadata`);
      if (response.ok) {
        const metadata = await response.json();
        setClipMetadata(metadata);
      }
    } catch (error) {
      console.error('메타데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const tabs = [
    { id: 'player', label: '플레이어', icon: '🎬' },
    { id: 'metadata', label: '정보', icon: '📄' },
    { id: 'subtitles', label: '자막', icon: '💬' },
    { id: 'timeline', label: '타임라인', icon: '⏰' }
  ];

  return (
    <div 
      className="relative bg-[#171717] border-l border-[#2d2d2d] flex text-[#ececf1] transition-all duration-200"
      style={{ width: `${width}px` }}
      ref={panelRef}
    >
      {/* Resizer Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-10 ${
          isResizing 
            ? 'bg-[#0e639c]' 
            : 'bg-transparent hover:bg-[#0e639c]/50'
        }`}
        onMouseDown={handleMouseDown}
        style={{
          background: isResizing 
            ? '#0e639c' 
            : 'transparent'
        }}
      />
      
      {/* Content Container */}
      <div className="flex-1 flex flex-col ml-1">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2d2d2d] bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Secondary Panel</span>
            <span className="text-xs text-[#8e8ea0]">{width}px</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#cccccc] hover:text-white transition-colors p-1 hover:bg-[#2d2d2d] rounded"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2d2d2d] bg-[#1e1e1e]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1
                ${activeTab === tab.id 
                  ? 'text-white border-b-2 border-[#0e639c] bg-[#171717]' 
                  : 'text-[#cccccc] hover:text-white hover:bg-[#2d2d2d]'
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'player' && (
            <div className="h-full flex flex-col">
              {/* Video Player */}
              {clip && (
                <div className="bg-black">
                  <video
                    src={clip.clipPath}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-64"
                    poster={clip.thumbnailPath}
                  >
                    비디오를 재생할 수 없습니다.
                  </video>
                </div>
              )}
              
              {/* Player Controls */}
              <div className="p-4 border-b border-[#2d2d2d]">
                <h3 className="text-sm font-semibold mb-2">재생 컨트롤</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2 bg-[#2d2d2d] hover:bg-[#404040] rounded text-xs transition-colors">
                    ⏮️ 이전
                  </button>
                  <button className="p-2 bg-[#2d2d2d] hover:bg-[#404040] rounded text-xs transition-colors">
                    ⏸️ 일시정지
                  </button>
                  <button className="p-2 bg-[#2d2d2d] hover:bg-[#404040] rounded text-xs transition-colors">
                    ⏭️ 다음
                  </button>
                </div>
              </div>

              {/* Quick Info */}
              {clip && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold mb-2 text-[#cccccc]">클립 정보</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8e8ea0]">ID:</span>
                      <span className="text-[#cccccc]">{clip.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8e8ea0]">시간:</span>
                      <span className="text-[#cccccc]">{clip.startTime} - {clip.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8e8ea0]">길이:</span>
                      <span className="text-[#cccccc]">{clip.duration}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-semibold mb-4 text-[#cccccc]">상세 정보</h3>
              {clip ? (
                <div className="space-y-4">
                  <div className="bg-[#2d2d2d] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">기본 정보</h4>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-[#8e8ea0]">제목:</span> <span className="text-[#cccccc]">{clip.title}</span></div>
                      <div><span className="text-[#8e8ea0]">파일:</span> <span className="text-[#cccccc]">{clip.sourceFile}</span></div>
                      <div><span className="text-[#8e8ea0]">생성일:</span> <span className="text-[#cccccc]">{new Date(clip.createdAt).toLocaleString()}</span></div>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0e639c] mx-auto"></div>
                      <p className="text-xs text-[#8e8ea0] mt-2">메타데이터 로딩 중...</p>
                    </div>
                  ) : clipMetadata && (
                    <div className="bg-[#2d2d2d] rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">추가 정보</h4>
                      <pre className="text-xs text-[#cccccc] overflow-auto max-h-60">
                        {JSON.stringify(clipMetadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8e8ea0]">선택된 클립이 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === 'subtitles' && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-semibold mb-4 text-[#cccccc]">자막 정보</h3>
              {clip ? (
                <div className="space-y-4">
                  <div className="bg-[#2d2d2d] rounded-lg p-3 border-l-4 border-blue-400">
                    <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">영어</h4>
                    <p className="text-sm text-[#cccccc]">{clip.englishSubtitle}</p>
                  </div>
                  <div className="bg-[#2d2d2d] rounded-lg p-3 border-l-4 border-green-400">
                    <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">한국어</h4>
                    <p className="text-sm text-[#cccccc]">{clip.koreanSubtitle}</p>
                  </div>
                  {clip.sentence && (
                    <div className="bg-[#2d2d2d] rounded-lg p-3 border-l-4 border-yellow-400">
                      <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">검색 컨텍스트</h4>
                      <p className="text-sm text-[#cccccc]">{clip.sentence}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8e8ea0]">선택된 클립이 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-semibold mb-4 text-[#cccccc]">타임라인</h3>
              {clip ? (
                <div className="space-y-4">
                  <div className="bg-[#2d2d2d] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">시간 정보</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8e8ea0]">시작:</span>
                        <span className="text-[#cccccc]">{clip.startTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e8ea0]">종료:</span>
                        <span className="text-[#cccccc]">{clip.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8e8ea0]">지속시간:</span>
                        <span className="text-[#cccccc]">{clip.duration}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 시간대별 마커 */}
                  <div className="bg-[#2d2d2d] rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-[#8e8ea0] mb-2">재생 위치</h4>
                    <div className="relative h-2 bg-[#404040] rounded-full">
                      <div className="absolute left-0 top-0 h-full w-1/3 bg-[#0e639c] rounded-full"></div>
                      <div className="absolute left-1/3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                    </div>
                    <div className="flex justify-between text-xs text-[#8e8ea0] mt-1">
                      <span>00:00</span>
                      <span>현재 위치</span>
                      <span>{clip.duration}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8e8ea0]">선택된 클립이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
