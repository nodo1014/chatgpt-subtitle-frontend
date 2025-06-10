'use client';

import { AutoClipProgress as AutoClipProgressType } from '../types';

interface AutoClipProgressProps {
  progress: AutoClipProgressType;
}

export default function AutoClipProgress({ progress }: AutoClipProgressProps) {
  if (!progress.isCreating && !progress.current) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200 px-6 py-5 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-2xl">
                  {progress.isCreating ? '🎬' : '✅'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {progress.isCreating ? '자동 클립 생성 중' : '클립 생성 완료'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {progress.current}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {progress.total > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-bold text-blue-900">
                  {progress.progress}/{progress.total}
                </div>
                <div className="text-sm text-blue-700">
                  {Math.round((progress.progress / progress.total) * 100)}% 완료
                </div>
              </div>
            </div>
          )}
        </div>
        
        {progress.total > 0 && (
          <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min((progress.progress / progress.total) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        )}
        
        {progress.isCreating && (
          <div className="mt-3 text-center">
            <p className="text-sm text-blue-700">
              🎬 미디어 파일에서 클립을 추출하고 있습니다... 잠시만 기다려주세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
