'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import VideoPlayer from '../../../components/VideoPlayer';

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
  clips?: ClipMetadata[];
  onNextClip?: (clip: ClipMetadata) => void;
}

export default function RightPanel({ clip, isVisible, onClose, clips = [], onNextClip }: RightPanelProps) {
  const [clipMetadata, setClipMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(800);
  const [isResizing, setIsResizing] = useState(false);
  const [showEnglishSubtitles, setShowEnglishSubtitles] = useState(true);
  const [showKoreanSubtitles, setShowKoreanSubtitles] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);

  // 현재 클립의 인덱스 찾기
  useEffect(() => {
    console.log('🔍 클립 인덱스 계산:', {
      clipId: clip?.id,
      clipsLength: clips.length,
      clipsIds: clips.map(c => c.id)
    });
    
    if (clip && clips.length > 0) {
      const index = clips.findIndex(c => c.id === clip.id);
      console.log('📍 찾은 인덱스:', index);
      if (index !== -1 && index !== currentClipIndex) {
        setCurrentClipIndex(index);
        console.log('✅ currentClipIndex 업데이트:', index);
      }
    }
  }, [clip?.id, clips]);

  // 다음 클립 결정 함수 (연속재생)
  const getNextClip = useCallback(() => {
    console.log('🎯 getNextClip 호출:', {
      currentClipIndex,
      clipsLength: clips.length,
      currentClipId: clip?.id
    });

    if (clips.length <= 1) {
      console.log('❌ 클립이 1개 이하라서 다음 클립 없음');
      return null;
    }

    // 연속재생: 다음 클립으로 이동, 마지막이면 첫 번째로
    const nextIndex = currentClipIndex + 1;
    const nextClip = nextIndex < clips.length ? clips[nextIndex] : clips[0];
    console.log('🔁 연속재생 모드:', { 
      nextIndex, 
      isLastClip: nextIndex >= clips.length,
      nextClipId: nextClip?.id 
    });
    return nextClip;
  }, [currentClipIndex, clips, clip]);

  // 비디오 종료 시 다음 클립 재생
  const handleVideoEnded = useCallback(() => {
    console.log('🎬 비디오 종료 이벤트 발생!');
    console.log('📊 현재 상태:', {
      currentClipIndex: currentClipIndex,
      totalClips: clips.length,
      clipId: clip?.id
    });

    const nextClip = getNextClip();
    
    if (nextClip && onNextClip) {
      console.log('🎬 다음 클립 재생:', nextClip.id);
      onNextClip(nextClip);
    } else {
      console.log('🏁 재생 완료');
    }
  }, [currentClipIndex, clips, clip?.id, onNextClip, getNextClip]);

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
      if (newWidth >= 320 && newWidth <= 800) { // 최소 320px, 최대 800px
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

  // 비디오 + 자막을 Canvas에 렌더링
  const renderVideoFrame = (videoJsPlayer: any, canvas: HTMLCanvasElement, timestamp: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !clip) return;

    // Video.js 플레이어에서 비디오 엘리먼트 가져오기
    let videoElement;
    
    if (videoJsPlayer && typeof videoJsPlayer.el === 'function') {
      // Video.js 플레이어 객체인 경우
      videoElement = videoJsPlayer.el().querySelector('video');
    } else if (videoJsPlayer && videoJsPlayer.tagName === 'VIDEO') {
      // 이미 비디오 엘리먼트인 경우
      videoElement = videoJsPlayer;
    } else {
      console.error('❌ 유효하지 않은 플레이어 객체:', videoJsPlayer);
      return;
    }
    
    if (!videoElement) {
      console.error('❌ 비디오 엘리먼트를 찾을 수 없습니다');
      return;
    }

    // Canvas 크기를 비디오 크기에 맞춤
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    // 비디오 프레임을 Canvas에 그리기
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 자막 스타일 설정
    const fontSize = Math.max(24, canvas.width * 0.03);
    ctx.font = `700 ${fontSize}px Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // 자막 위치 (하단에서 10% 위)
    const subtitleY = canvas.height * 0.9;
    const englishY = subtitleY - fontSize - 10;
    const koreanY = subtitleY;

    // 텍스트 그림자 효과 함수
    const drawTextWithShadow = (text: string, x: number, y: number, fillColor: string) => {
      // 그림자 (여러 방향으로)
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = 4;
      ctx.strokeText(text, x, y);
      
      // 메인 텍스트
      ctx.fillStyle = fillColor;
      ctx.fillText(text, x, y);
    };

    const centerX = canvas.width / 2;

    // 영어 자막 그리기
    if (showEnglishSubtitles && clip.englishSubtitle) {
      drawTextWithShadow(clip.englishSubtitle, centerX, englishY, 'white');
    }

    // 한글 자막 그리기
    if (showKoreanSubtitles && clip.koreanSubtitle) {
      drawTextWithShadow(clip.koreanSubtitle, centerX, koreanY, '#fde047'); // yellow-300
    }
  };

  // 비디오 내보내기 함수
  const exportVideo = async () => {
    if (!playerRef.current || !canvasRef.current || !clip) return;

    setIsExporting(true);
    const videoJsPlayer = playerRef.current;
    const canvas = canvasRef.current;
    const frames: string[] = [];

    try {
      console.log('🎬 비디오 내보내기 시작...');
      
      // Video.js 플레이어에서 duration 가져오기
      let duration = videoJsPlayer.duration();
      
      // duration이 유효하지 않으면 대기
      if (isNaN(duration) || duration <= 0) {
        console.log('⏳ Duration 로딩 대기 중...');
        
        // 메타데이터 로드 대기
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Duration 로딩 타임아웃'));
          }, 5000);
          
          const checkDuration = () => {
            const currentDuration = videoJsPlayer.duration();
            if (!isNaN(currentDuration) && currentDuration > 0) {
              clearTimeout(timeout);
              duration = currentDuration;
              resolve(duration);
            } else {
              setTimeout(checkDuration, 100);
            }
          };
          
          checkDuration();
        });
      }

      const fps = 30; // 30fps로 설정
      const frameInterval = 1 / fps;
      const totalFrames = Math.ceil(duration * fps);

      console.log(`📊 비디오 정보: ${duration}초, ${totalFrames}프레임`);

      // Video.js 플레이어에서 실제 비디오 엘리먼트 가져오기
      const player = videoJsPlayer.el().querySelector('video');
      if (!player) {
        throw new Error('비디오 엘리먼트를 찾을 수 없습니다');
      }

      // 각 프레임 캡처
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        // 비디오 시간 설정
        player.currentTime = timestamp;
        
        // 비디오 프레임이 로드될 때까지 대기
        await new Promise((resolve) => {
          const onSeeked = () => {
            player.removeEventListener('seeked', onSeeked);
            resolve(null);
          };
          player.addEventListener('seeked', onSeeked);
        });

        // Canvas에 렌더링
        renderVideoFrame(videoJsPlayer, canvas, timestamp);
        
        // Canvas를 이미지로 변환
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(frameData);

        // 진행률 표시
        if (i % 10 === 0) {
          console.log(`📸 프레임 캡처 진행률: ${Math.round((i / totalFrames) * 100)}%`);
        }
      }

      console.log('🎞️ 모든 프레임 캡처 완료, 서버로 전송 중...');

      // 서버로 프레임 데이터 전송
      const response = await fetch('/api/video-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clipId: clip.id,
          frames: frames,
          fps: fps,
          duration: duration,
          width: canvas.width,
          height: canvas.height,
          playMode: 'repeat-all'  // 재생 모드 추가
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 비디오 내보내기 완료:', result);
        alert(`비디오 내보내기 완료!\n파일: ${result.outputPath}`);
      } else {
        throw new Error('서버 처리 실패');
      }

    } catch (error) {
      console.error('❌ 비디오 내보내기 실패:', error);
      alert('비디오 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isVisible) return null;

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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {clip && (
            <div className="h-full flex flex-col">
                              {/* Video Player */}
                <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                  <VideoPlayer
                    src={clip.clipPath}
                    poster={clip.thumbnailPath}
                    englishSubtitle={clip.englishSubtitle}
                    koreanSubtitle={clip.koreanSubtitle}
                    showEnglishSubtitles={showEnglishSubtitles}
                    showKoreanSubtitles={showKoreanSubtitles}
                    autoplay={true}
                    onEnded={handleVideoEnded}
                    onReady={(player) => {
                      playerRef.current = player;
                    }}
                    width={width}
                  />

                  {/* 숨겨진 Canvas (내보내기용) */}
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                
                {/* 자막 토글 버튼들 */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setShowEnglishSubtitles(!showEnglishSubtitles)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      showEnglishSubtitles 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-black bg-opacity-50 text-gray-300 hover:bg-opacity-70'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setShowKoreanSubtitles(!showKoreanSubtitles)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      showKoreanSubtitles 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-black bg-opacity-50 text-gray-300 hover:bg-opacity-70'
                    }`}
                  >
                    KR
                  </button>
                </div>
                
                {/* 연속 재생 정보 */}
                {clips.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {currentClipIndex + 1} / {clips.length}
                  </div>
                )}
              </div>
              
              {/* Player Controls */}
              <div className="p-4 border-b border-[#2d2d2d]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">재생 컨트롤</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button 
                    onClick={() => {
                      const prevIndex = currentClipIndex - 1;
                      if (prevIndex >= 0 && onNextClip) {
                        onNextClip(clips[prevIndex]);
                      }
                    }}
                    disabled={currentClipIndex === 0}
                    className="p-2 bg-[#2d2d2d] hover:bg-[#404040] rounded text-xs transition-colors disabled:bg-[#1a1a1a] disabled:text-[#666] disabled:cursor-not-allowed"
                  >
                    ⏮️ 이전
                  </button>
                  <button 
                    onClick={() => {
                      const nextIndex = currentClipIndex + 1;
                      if (nextIndex < clips.length && onNextClip) {
                        onNextClip(clips[nextIndex]);
                      }
                    }}
                    disabled={currentClipIndex === clips.length - 1}
                    className="p-2 bg-[#2d2d2d] hover:bg-[#404040] rounded text-xs transition-colors disabled:bg-[#1a1a1a] disabled:text-[#666] disabled:cursor-not-allowed"
                  >
                    ⏭️ 다음
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* 연속재생 정보 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[#8e8ea0]">🔁 연속재생 활성화</span>
                      <span className="text-[#666] text-xs mt-1">
                        클립 종료 시 자동으로 다음 클립 재생
                      </span>
                    </div>
                  </div>

                  {/* 비디오 내보내기 */}
                  <div className="pt-2 border-t border-[#2d2d2d]">
                    <button
                      onClick={exportVideo}
                      disabled={isExporting}
                      className={`w-full p-2 rounded text-xs font-medium transition-colors ${
                        isExporting
                          ? 'bg-[#1a1a1a] text-[#666] cursor-not-allowed'
                          : 'bg-[#0e639c] hover:bg-[#1e7bb8] text-white'
                      }`}
                    >
                      {isExporting ? '🎬 내보내는 중...' : '📹 자막 포함 비디오 내보내기'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
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
            </div>
          )}

          {clip && (
            <div className="p-4 overflow-y-auto h-full">
              <h3 className="text-sm font-semibold mb-4 text-[#cccccc]">상세 정보</h3>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
