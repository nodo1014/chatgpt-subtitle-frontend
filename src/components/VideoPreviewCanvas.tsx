// 실시간 비디오 미리보기 컴포넌트
'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoPreviewCanvasProps {
  clip: any;
  settings: any;
  template: any;
}

export default function VideoPreviewCanvas({ clip, settings, template }: VideoPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number>();

  // 비디오 로드 및 캔버스 설정
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !clip?.video_path) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const aspectRatio = template?.format === '9:16' ? 9/16 : 16/9;
    const width = 400;
    const height = width / aspectRatio;
    
    canvas.width = width;
    canvas.height = height;

    // 비디오 소스 설정 (로컬 파일 경로를 웹 접근 가능한 URL로 변환)
    const videoUrl = clip.video_path.startsWith('/') 
      ? `http://localhost:3003${clip.video_path}` 
      : clip.video_path;
    video.src = videoUrl;
    video.load();

    const drawFrame = () => {
      if (!video || !canvas || !ctx) return;

      // 비디오 프레임 그리기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 배경색
      const bgColor = template?.settings?.background || '#000000';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 비디오 그리기 (aspect ratio 유지)
      if (video.readyState >= 2) {
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > canvasAspect) {
          drawHeight = canvas.width / videoAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * videoAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      }

      // 자막 그리기
      drawSubtitles(ctx, canvas, settings);

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawFrame);
      }
    };

    // 비디오 이벤트 리스너
    video.addEventListener('loadeddata', () => {
      drawFrame();
    });

    video.addEventListener('timeupdate', () => {
      if (isPlaying) {
        drawFrame();
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clip, settings, template, isPlaying]);

  // 자막 그리기 함수
  const drawSubtitles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: any) => {
    const currentRepeatSettings = settings?.repeatSettings?.[0] || {
      showEnglish: true,
      showKorean: true,
      showExplanation: false,
      showPronunciation: false
    };

    const fontSettings = settings?.fontSettings || {
      size: 32,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      fontFamily: 'Noto Sans KR'
    };

    // 폰트 설정 (웹 안전 폰트로 fallback 포함)
    const fontFamily = fontSettings.fontFamily === 'Noto Sans KR' 
      ? '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      : fontSettings.fontFamily;
    
    ctx.font = `bold ${fontSettings.size}px ${fontFamily}`;
    ctx.fillStyle = fontSettings.color;
    ctx.strokeStyle = fontSettings.strokeColor;
    ctx.lineWidth = fontSettings.strokeWidth;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 텍스트 그림자 효과 (더 나은 가독성을 위해)
    if (fontSettings.strokeWidth > 0) {
      ctx.shadowColor = fontSettings.strokeColor;
      ctx.shadowBlur = fontSettings.strokeWidth;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 자막 위치 계산
    const position = settings?.subtitlePosition || 'bottom';
    let y = canvas.height / 2;
    
    switch (position) {
      case 'top':
        y = fontSettings.size + 20;
        break;
      case 'middle':
        y = canvas.height / 2;
        break;
      case 'bottom':
        y = canvas.height - fontSettings.size - 20;
        break;
    }

    // 영어 자막
    if (currentRepeatSettings.showEnglish && clip?.english_text) {
      const text = clip.english_text;
      if (fontSettings.strokeWidth > 0) {
        // 테두리 효과를 위한 여러 레이어 그리기
        ctx.lineWidth = fontSettings.strokeWidth + 2;
        ctx.strokeText(text, canvas.width / 2, y);
        ctx.lineWidth = fontSettings.strokeWidth;
        ctx.strokeText(text, canvas.width / 2, y);
      }
      ctx.fillText(text, canvas.width / 2, y);
    }

    // 한글 자막
    if (currentRepeatSettings.showKorean && clip?.korean_text) {
      const text = clip.korean_text;
      const koreanY = currentRepeatSettings.showEnglish ? y + fontSettings.size + 10 : y;
      if (fontSettings.strokeWidth > 0) {
        // 테두리 효과를 위한 여러 레이어 그리기
        ctx.lineWidth = fontSettings.strokeWidth + 2;
        ctx.strokeText(text, canvas.width / 2, koreanY);
        ctx.lineWidth = fontSettings.strokeWidth;
        ctx.strokeText(text, canvas.width / 2, koreanY);
      }
      ctx.fillText(text, canvas.width / 2, koreanY);
    }
    
    // 그림자 리셋
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  };

  // 재생/정지 토글
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* 숨겨진 비디오 엘리먼트 */}
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          loop
          muted
          crossOrigin="anonymous"
          onLoadedData={() => console.log('Video loaded')}
          onError={(e) => console.error('Video error:', e)}
        />
        
        {/* 캔버스 미리보기 */}
        <canvas
          ref={canvasRef}
          className="w-full border rounded-lg bg-black"
          style={{ maxWidth: '400px' }}
        />
        
        {/* 재생 컨트롤 */}
        <div className="absolute bottom-2 left-2">
          <button
            onClick={togglePlay}
            className="bg-black/60 text-white px-3 py-1 rounded text-sm hover:bg-black/80"
          >
            {isPlaying ? '⏸️ 정지' : '▶️ 재생'}
          </button>
        </div>
        
        {/* 디버그 정보 */}
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          <div>폰트: {settings?.fontSettings?.fontFamily || 'Default'}</div>
          <div>크기: {settings?.fontSettings?.size || 'Default'}px</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        실시간 미리보기 - 설정 변경이 즉시 반영됩니다
      </div>
    </div>
  );
}
