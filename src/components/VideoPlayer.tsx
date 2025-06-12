'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  englishSubtitle?: string;
  koreanSubtitle?: string;
  showEnglishSubtitles?: boolean;
  showKoreanSubtitles?: boolean;
  autoplay?: boolean;
  onEnded?: () => void;
  onReady?: (player: any) => void;
  width?: number;
}

export default function VideoPlayer({
  src,
  poster,
  englishSubtitle,
  koreanSubtitle,
  showEnglishSubtitles = true,
  showKoreanSubtitles = true,
  autoplay = true,
  onEnded,
  onReady,
  width = 800
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Video.js 플레이어 초기화
    if (videoRef.current && !playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-default-skin');
      videoRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: false,
        width: width,
        height: (width * 9) / 16, // 16:9 비율
        poster: poster,
        autoplay: autoplay,
        sources: [{
          src: src,
          type: 'video/mp4'
        }],
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        preload: 'metadata' // 메타데이터 미리 로드
      });

      // 플레이어 이벤트 리스너
      player.ready(() => {
        console.log('🎬 Video.js player ready');
        setIsReady(true);
        onReady?.(player);
      });

      // 메타데이터 로드 완료 시
      player.on('loadedmetadata', () => {
        console.log('📊 Video metadata loaded, duration:', player.duration());
      });

      // 데이터 로드 완료 시
      player.on('loadeddata', () => {
        console.log('📊 Video data loaded, duration:', player.duration());
      });

      // 재생 가능 상태
      player.on('canplay', () => {
        console.log('▶️ Video can play, duration:', player.duration());
      });

      // 비디오 종료 시 이벤트
      player.on('ended', () => {
        console.log('🎬 Video ended');
        onEnded?.();
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  // src 변경 시 소스 업데이트 및 자동재생
  useEffect(() => {
    if (playerRef.current && isReady) {
      console.log('🔄 Updating video source:', src);
      playerRef.current.src({ src: src, type: 'video/mp4' });
      if (poster) {
        playerRef.current.poster(poster);
      }
      
      // 새 비디오 로드 후 자동재생
      if (autoplay) {
        playerRef.current.one('loadedmetadata', () => {
          console.log('📊 New video metadata loaded, starting autoplay');
          playerRef.current.play().catch((error: any) => {
            console.log('⚠️ Autoplay failed:', error);
          });
        });
      }
    }
  }, [src, poster, isReady, autoplay]);

  return (
    <div className="relative">
      {/* Video.js 플레이어 */}
      <div ref={videoRef} className="video-player-container" />
      
      {/* 자막 오버레이 */}
      {isReady && (englishSubtitle || koreanSubtitle) && (
        <div className="absolute bottom-16 left-0 right-0 p-4 pointer-events-none">
          <div className="space-y-3">
            {/* 영어 자막 */}
            {showEnglishSubtitles && englishSubtitle && (
              <div className="text-center">
                <div 
                  className="text-white"
                  style={{
                    fontSize: `${Math.max(18, width * 0.035)}px`,
                    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                    fontWeight: '700',
                    textShadow: '3px 3px 8px rgba(0,0,0,1), -3px -3px 8px rgba(0,0,0,1), 3px -3px 8px rgba(0,0,0,1), -3px 3px 8px rgba(0,0,0,1), 0px 0px 8px rgba(0,0,0,1)'
                  }}
                >
                  {englishSubtitle}
                </div>
              </div>
            )}
            
            {/* 한글 자막 */}
            {showKoreanSubtitles && koreanSubtitle && (
              <div className="text-center">
                <div 
                  className="text-yellow-300"
                  style={{
                    fontSize: `${Math.max(18, width * 0.035)}px`,
                    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                    fontWeight: '700',
                    textShadow: '3px 3px 8px rgba(0,0,0,1), -3px -3px 8px rgba(0,0,0,1), 3px -3px 8px rgba(0,0,0,1), -3px 3px 8px rgba(0,0,0,1), 0px 0px 8px rgba(0,0,0,1)'
                  }}
                >
                  {koreanSubtitle}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 