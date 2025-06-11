'use client';

import { useState, useEffect } from 'react';
import { ClipMetadata } from '../types';

interface VideoPlayerPanelProps {
  clip: ClipMetadata | null;
  onClose: () => void;
}

export default function VideoPlayerPanel({ clip, onClose }: VideoPlayerPanelProps) {
  const [clipMetadata, setClipMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 클립 메타데이터 로드
  useEffect(() => {
    if (clip) {
      loadClipMetadata(clip.id);
    }
  }, [clip]);

  const loadClipMetadata = async (clipId: string) => {
    setLoading(true);
    try {
      // DB에서 추가 메타정보 조회
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

  if (!clip) return null;

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">비디오 플레이어</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
        >
          ✕
        </button>
      </div>

      {/* Video Player */}
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

      {/* Metadata Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 기본 정보 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2">📄 기본 정보</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">제목:</span> {clip.title}</div>
            <div><span className="font-medium">ID:</span> {clip.id}</div>
            <div><span className="font-medium">시간:</span> {clip.startTime} - {clip.endTime}</div>
            <div><span className="font-medium">길이:</span> {((new Date(`1970-01-01T${clip.endTime}Z`).getTime() - new Date(`1970-01-01T${clip.startTime}Z`).getTime()) / 1000).toFixed(1)}초</div>
          </div>
        </div>

        {/* 자막 정보 */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2">💬 자막 정보</h4>
          <div className="space-y-2">
            <div className="bg-white rounded p-2 border-l-4 border-blue-400">
              <div className="text-xs text-gray-500 mb-1">영어</div>
              <div className="text-sm">{clip.englishSubtitle}</div>
            </div>
            <div className="bg-white rounded p-2 border-l-4 border-green-400">
              <div className="text-xs text-gray-500 mb-1">한국어</div>
              <div className="text-sm">{clip.koreanSubtitle}</div>
            </div>
          </div>
        </div>

        {/* 검색 컨텍스트 */}
        {clip.sentence && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2">🔍 검색 컨텍스트</h4>
            <div className="bg-white rounded p-2 border-l-4 border-yellow-400">
              <div className="text-xs text-gray-500 mb-1">검색어</div>
              <div className="text-sm">{clip.sentence}</div>
            </div>
          </div>
        )}

        {/* 미디어 정보 */}
        <div className="bg-purple-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2">🎬 미디어 정보</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">소스:</span> {clip.sourceFile.split('/').pop()}</div>
            <div><span className="font-medium">경로:</span> 
              <div className="text-xs text-gray-500 mt-1 break-all">{clip.sourceFile}</div>
            </div>
          </div>
        </div>

        {/* 태그 및 상태 */}
        <div className="bg-green-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2">🏷️ 태그 & 상태</h4>
          <div className="flex flex-wrap gap-1 mb-2">
            {clip.tags.map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  tag.includes('completed') ? 'bg-green-200 text-green-800' :
                  tag.includes('failed') ? 'bg-red-200 text-red-800' :
                  tag.includes('stage-2') ? 'bg-blue-200 text-blue-800' :
                  tag.includes('stage-1') ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 추가 DB 메타데이터 */}
        {loading ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2">📊 DB 메타데이터</h4>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : clipMetadata ? (
          <>
            {/* 자막 컨텍스트 정보 */}
            {clipMetadata.subtitle_context && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 mb-2">📝 자막 컨텍스트</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">전체 자막 수:</span> {clipMetadata.subtitle_context.total_subtitles_in_file}</div>
                  <div><span className="font-medium">원본 텍스트:</span> 
                    <div className="text-xs bg-white p-2 rounded mt-1">{clipMetadata.subtitle_context.subtitle_text}</div>
                  </div>
                  <div><span className="font-medium">한국어:</span> 
                    <div className="text-xs bg-white p-2 rounded mt-1">{clipMetadata.subtitle_context.korean_text}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 미디어 파일 통계 */}
            {clipMetadata.media_statistics && (
              <div className="bg-orange-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 mb-2">📈 미디어 통계</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">총 자막:</span> {clipMetadata.media_statistics.total_subtitles}개</div>
                  <div><span className="font-medium">고유 한국어:</span> {clipMetadata.media_statistics.unique_korean_texts}개</div>
                  <div><span className="font-medium">시간 범위:</span> {clipMetadata.media_statistics.earliest_time} ~ {clipMetadata.media_statistics.latest_time}</div>
                </div>
              </div>
            )}

            {/* 유사 표현 */}
            {clipMetadata.similar_expressions && clipMetadata.similar_expressions.length > 0 && (
              <div className="bg-pink-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-800 mb-2">🔄 유사 표현</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {clipMetadata.similar_expressions.map((expr: any, index: number) => (
                    <div key={index} className="bg-white rounded p-2 border-l-4 border-pink-400">
                      <div className="text-xs text-gray-500">{expr.start_time} - {expr.end_time}</div>
                      <div className="text-sm font-medium">{expr.subtitle_text}</div>
                      <div className="text-xs text-gray-600">{expr.korean_text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 생성 정보 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-800 mb-2">🕐 생성 정보</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>조회 시간: {new Date(clipMetadata.generation_time).toLocaleString()}</div>
                <div>쿼리 ID: {clipMetadata.query_timestamp}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2">⚠️ 알림</h4>
            <p className="text-sm text-gray-600">추가 메타데이터를 불러올 수 없습니다.</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2">
          <button
            onClick={() => navigator.clipboard.writeText(`${clip.englishSubtitle}\n${clip.koreanSubtitle}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            📋 자막 복사
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(clip.clipPath || '')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            🔗 경로 복사
          </button>
        </div>
      </div>
    </div>
  );
}
