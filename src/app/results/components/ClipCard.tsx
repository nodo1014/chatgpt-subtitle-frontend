'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClipMetadata, StageInfo } from '../types';

interface ClipCardProps {
  clip: ClipMetadata;
  onDelete: (clipId: string) => void;
  onToast: (message: string) => void;
}

export default function ClipCard({ clip, onDelete, onToast }: ClipCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // 3단계 상태 확인
  const getStageInfo = (): StageInfo => {
    if (clip.tags.includes('completed')) {
      return { stage: 3, status: '재생 가능', icon: '✅', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (clip.tags.includes('stage-3-failed')) {
      return { stage: 3, status: '생성 실패', icon: '❌', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (clip.tags.includes('stage-2-thumbnail')) {
      return { stage: 2, status: '영상 생성 중', icon: '🎬', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    } else if (clip.tags.includes('stage-1-json')) {
      return { stage: 1, status: '썸네일 생성 중', icon: '📸', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { stage: 0, status: '생성 대기', icon: '🔄', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };
  
  const stageInfo = getStageInfo();
  const isPlayable = stageInfo.stage === 3 && !clip.tags.includes('stage-3-failed');
  
  const handleBookmark = async () => {
    try {
      await navigator.clipboard.writeText(`${clip.englishSubtitle}\n${clip.koreanSubtitle}`);
      onToast('자막이 클립보드에 복사되었습니다! 📋');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      onToast('클립보드 복사에 실패했습니다.');
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      {/* 썸네일 */}
      <div className="relative aspect-video bg-gray-900">
        {clip.thumbnailPath && !thumbnailError ? (
          <Image
            src={clip.thumbnailPath}
            alt={clip.title}
            fill
            className="object-cover brightness-125 contrast-125 saturate-110 hover:brightness-150 transition-all duration-200"
            unoptimized
            onError={() => setThumbnailError(true)}
            onLoad={() => setThumbnailError(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-white text-4xl">🎬</div>
          </div>
        )}
        
        {/* 좌측 상단 - DB 제목 */}
        <div className="absolute top-2 left-2">
          <div className="bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium max-w-[120px] truncate">
            {clip.sourceFile.split('/').pop()?.replace(/\.(mp4|avi|mkv|mov)$/i, '')}
          </div>
        </div>
        
        {/* 우측 상단 - 3단계 상태 표시 */}
        <div className="absolute top-2 right-2">
          <div className={`${stageInfo.bgColor} ${stageInfo.color} px-2 py-1 rounded text-xs font-medium flex items-center gap-1`}>
            <span>{stageInfo.icon}</span>
            <span>{stageInfo.status}</span>
          </div>
        </div>
        
        {/* 중앙 - 영어 자막 (유튜브 썸네일 스타일) */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-white text-center">
            <div className="bg-black bg-opacity-60 p-3 rounded-lg max-w-[90%]">
              <p className="text-sm md:text-base font-medium leading-tight">
                {clip.englishSubtitle}
              </p>
            </div>
          </div>
        </div>
        
        {/* 진행 중일 때 로딩 오버레이 */}
        {!isPlayable && stageInfo.stage > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      {/* 제목과 버튼 */}
      <div className="p-3">
        <h3 className="font-medium text-gray-800 mb-3 text-sm leading-tight truncate">
          {clip.title}
        </h3>
        
        {/* 액션 버튼들 */}
        <div className="flex gap-2">
          <button 
            onClick={() => isPlayable ? window.open(clip.clipPath, '_blank') : null}
            disabled={!isPlayable}
            className={`flex-1 px-3 py-2 rounded text-xs transition-colors flex items-center justify-center gap-1 ${
              isPlayable 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>▶</span>
            <span>{isPlayable ? '재생' : stageInfo.status}</span>
          </button>
          <button 
            onClick={handleBookmark}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs transition-colors"
            title="자막 북마크"
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
