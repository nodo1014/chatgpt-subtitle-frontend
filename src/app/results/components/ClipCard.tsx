'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClipMetadata } from '../types';

interface ClipCardProps {
  clip: ClipMetadata;
  onDelete: (clipId: string) => void;
  onToast: (message: string) => void;
  onPlayVideo?: (clip: ClipMetadata) => void;
}

export default function ClipCard({ clip, onDelete, onToast, onPlayVideo }: ClipCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  // 썸네일 경로가 없으면 기본 경로 생성
  const thumbnailPath = clip.thumbnailPath || `/thumbnails/${clip.id}.jpg`;
  const videoPath = clip.clipPath;
  
  const handleBookmark = async () => {
    try {
      await navigator.clipboard.writeText(`${clip.englishSubtitle}\n${clip.koreanSubtitle}`);
      onToast('자막이 클립보드에 복사되었습니다! 📋');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      onToast('클립보드 복사에 실패했습니다.');
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 비디오 재생 기능
    if (onPlayVideo) {
      onPlayVideo(clip);
    }
  };
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 비디오 미리보기 */}
      <div 
        className="relative aspect-video bg-gray-100 overflow-hidden"
        onClick={handleVideoClick}
      >
        {videoPath && !videoError ? (
          <>
            <video
              className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => {
                setVideoError(true);
                setVideoLoading(false);
              }}
              onLoadStart={() => {
                setVideoError(false);
                setVideoLoading(true);
              }}
              onLoadedData={() => setVideoLoading(false)}
              onCanPlay={() => setVideoLoading(false)}
            >
              <source src={videoPath} type="video/mp4" />
            </video>
            
            {/* 비디오 로딩 중 오버레이 */}
            {videoLoading && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </>
        ) : thumbnailPath && !thumbnailError ? (
          <Image
            src={thumbnailPath}
            alt={clip.title}
            fill
            className="object-cover transition-all duration-500 ease-out group-hover:scale-105"
            unoptimized
            onError={() => setThumbnailError(true)}
            onLoad={() => setThumbnailError(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-400 to-purple-500">
            <div className="text-white text-4xl drop-shadow-lg">🎬</div>
          </div>
        )}
        
        {/* 좌측 상단 - DB 제목 */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium max-w-[120px] truncate backdrop-blur-sm">
            {clip.sourceFile.split('/').pop()?.replace(/\.(mp4|avi|mkv|mov)$/i, '')}
          </div>
        </div>
        
        {/* 중앙 - 영어 자막 (유튜브 썸네일 스타일) */}
        <div className="absolute inset-0 flex items-center justify-center p-4 z-10 pointer-events-none">
          <div className="text-white text-center">
            <p className="text-sm md:text-base font-bold leading-tight drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8), 2px -2px 4px rgba(0,0,0,0.8), -2px 2px 4px rgba(0,0,0,0.8)'}}>
              {clip.englishSubtitle}
            </p>
          </div>
        </div>
      </div>
      
      {/* 제목과 버튼 */}
      <div className="p-3">
        <h3 className="font-medium text-gray-800 mb-1 text-sm leading-tight truncate">
          {clip.title}
        </h3>
        
        {/* 검색어 표시 */}
        {clip.sentence && (
          <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
            <span className="font-medium">검색어:</span> {clip.sentence}
          </div>
        )}
        
        {/* 한글 자막 표시 */}
        <div className="mb-3 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border-l-2 border-gray-400">
          <span className="font-medium">한글:</span> {clip.koreanSubtitle}
        </div>
        
        {/* 액션 버튼들 */}
        <div className="flex gap-2">
          <button 
            onClick={handleBookmark}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs transition-colors"
            title="쓸모없는 기능..."
          >
            🔖
          </button>
          <button 
            onClick={() => onDelete(clip.id)}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-xs transition-colors"
            title="클립 삭제"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
