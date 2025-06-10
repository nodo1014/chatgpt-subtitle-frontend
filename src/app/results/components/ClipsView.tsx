'use client';

import { ClipMetadata, SearchData } from '../types';

interface ClipsViewProps {
  clips: ClipMetadata[];
  searchData: SearchData | null;
  onDeleteClip: (clipId: string) => void;
  onToast: (message: string) => void;
  onViewModeChange: (mode: 'search' | 'clips') => void;
  onNewSearch: () => void;
}

export default function ClipsView({ 
  clips, 
  searchData, 
  onDeleteClip, 
  onToast, 
  onViewModeChange, 
  onNewSearch 
}: ClipsViewProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎬 생성된 클립</h2>
        <p className="text-gray-600">총 {clips.length}개의 클립이 있습니다.</p>
        {/* 디버그 정보 추가 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>디버그:</strong> clips 배열 길이: {clips.length}
            {clips.length > 0 && (
              <div>첫 번째 클립: {JSON.stringify(clips[0], null, 2)}</div>
            )}
          </div>
        )}
      </div>
      
      {clips.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    썸네일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목 / 문장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    태그
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clips.map((clip) => (
                  <tr key={clip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {clip.thumbnailPath ? (
                        <img
                          src={clip.thumbnailPath}
                          alt="썸네일"
                          className="w-24 h-14 object-cover rounded border shadow-sm brightness-125 contrast-125 saturate-110 hover:brightness-150 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-24 h-14 bg-gray-200 rounded border flex items-center justify-center">
                          <span className="text-xs text-gray-500">썸네일 없음</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {clip.title}
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {clip.sentence}
                        </div>
                        {clip.koreanSubtitle && (
                          <div className="text-xs text-blue-600 truncate max-w-xs">
                            {clip.koreanSubtitle}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{clip.startTime} ~ {clip.endTime}</div>
                      <div className="text-xs text-gray-500">{clip.duration}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {clip.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(clip.clipPath, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="클립 재생"
                        >
                          ▶️
                        </button>
                        <button
                          onClick={() => onDeleteClip(clip.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="클립 삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">아직 생성된 클립이 없습니다</h3>
          <p className="text-gray-600 mb-6">검색 결과에서 클립을 생성해보세요.</p>
          {searchData ? (
            <button
              onClick={() => onViewModeChange('search')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              검색 결과로 이동
            </button>
          ) : (
            <button
              onClick={onNewSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              새 검색 시작
            </button>
          )}
        </div>
      )}
    </div>
  );
}
