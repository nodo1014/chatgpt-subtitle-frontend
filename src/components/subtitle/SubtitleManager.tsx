'use client';

import { useState, useEffect } from 'react';
import StandardTabs from '@/components/ui/StandardTabs';

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

interface SubtitleTrack {
  language: 'en' | 'ko';
  entries: SubtitleEntry[];
}

interface VideoSubtitles {
  videoId: string;
  tracks: SubtitleTrack[];
  lastUpdated: string;
}

interface SubtitleManagerProps {
  videoId: string;
  onSubtitlesUpdate?: (subtitles: VideoSubtitles) => void;
}

export default function SubtitleManager({ videoId, onSubtitlesUpdate }: SubtitleManagerProps) {
  const [subtitles, setSubtitles] = useState<VideoSubtitles | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'upload' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [uploadFormat, setUploadFormat] = useState<'srt' | 'json'>('srt');
  const [uploadLanguage, setUploadLanguage] = useState<'en' | 'ko'>('en');
  const [uploadContent, setUploadContent] = useState('');

  useEffect(() => {
    if (videoId) {
      loadSubtitles();
    }
  }, [videoId]);

  const loadSubtitles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subtitles?videoId=${videoId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubtitles(data.data);
        onSubtitlesUpdate?.(data.data);
      } else {
        setSubtitles(null);
      }
    } catch (error) {
      console.error('자막 로드 실패:', error);
      setSubtitles(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadContent.trim()) {
      alert('자막 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          language: uploadLanguage,
          format: uploadFormat,
          content: uploadContent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('자막이 성공적으로 업로드되었습니다!');
        setUploadContent('');
        await loadSubtitles();
        setActiveTab('view');
      } else {
        alert(`업로드 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('자막 업로드 실패:', error);
      alert('자막 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async (language: 'en' | 'ko') => {
    if (!confirm(`${language === 'en' ? '영어' : '한국어'} 자막을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/subtitles?videoId=${videoId}&language=${language}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('자막이 삭제되었습니다.');
        await loadSubtitles();
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('자막 삭제 실패:', error);
      alert('자막 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSubtitles = async (language: 'en' | 'ko', format: 'srt' | 'vtt' | 'json') => {
    try {
      const response = await fetch(`/api/subtitles?videoId=${videoId}&language=${language}&format=${format}`);
      const data = await response.json();
      
      if (data.success) {
        const content = format === 'json' ? JSON.stringify(data.data, null, 2) : data.data[language === 'en' ? 'english' : 'korean'];
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoId}_${language}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(`다운로드 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('자막 다운로드 실패:', error);
      alert('자막 다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">자막 관리 - {videoId}</h3>
        
        <StandardTabs
          tabs={[
            {
              id: 'view',
              label: '자막 보기',
              icon: '👁️',
              badge: subtitles?.tracks.length || undefined
            },
            {
              id: 'upload',
              label: '자막 업로드',
              icon: '📤'
            },
            {
              id: 'edit',
              label: '자막 편집',
              icon: '✏️'
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      <div className="p-6">
        {loading && (
          <div className="text-center py-4">
            <div className="text-gray-500">처리 중...</div>
          </div>
        )}

        {/* 자막 보기 탭 */}
        {activeTab === 'view' && !loading && (
          <div className="space-y-6">
            {!subtitles ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">이 비디오에 대한 자막이 없습니다.</div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  자막 업로드하기
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    마지막 업데이트: {new Date(subtitles.lastUpdated).toLocaleString()}
                  </div>
                  <button
                    onClick={loadSubtitles}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    새로고침
                  </button>
                </div>

                {subtitles.tracks.map((track) => (
                  <div key={track.language} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h4 className="font-medium">
                        {track.language === 'en' ? '영어 자막' : '한국어 자막'} ({track.entries.length}개 항목)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadSubtitles(track.language, 'srt')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          SRT
                        </button>
                        <button
                          onClick={() => downloadSubtitles(track.language, 'vtt')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          VTT
                        </button>
                        <button
                          onClick={() => downloadSubtitles(track.language, 'json')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track.language)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {track.entries.slice(0, 10).map((entry, index) => (
                        <div key={index} className="mb-3 p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">
                            {formatTime(entry.start)} → {formatTime(entry.end)}
                            {entry.confidence && ` (신뢰도: ${(entry.confidence * 100).toFixed(1)}%)`}
                          </div>
                          <div className="text-sm">{entry.text}</div>
                        </div>
                      ))}
                      {track.entries.length > 10 && (
                        <div className="text-center text-gray-500 text-sm">
                          ...및 {track.entries.length - 10}개 더
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 자막 업로드 탭 */}
        {activeTab === 'upload' && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
                <select
                  value={uploadLanguage}
                  onChange={(e) => setUploadLanguage(e.target.value as 'en' | 'ko')}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="en">영어</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">형식</label>
                <select
                  value={uploadFormat}
                  onChange={(e) => setUploadFormat(e.target.value as 'srt' | 'json')}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="srt">SRT 파일</option>
                  <option value="json">JSON 형식</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">자막 내용</label>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder={uploadFormat === 'srt' ? 
                  "1\n00:00:01,000 --> 00:00:05,000\n안녕하세요!\n\n2\n00:00:06,000 --> 00:00:10,000\n반갑습니다." :
                  "[\n  {\n    \"start\": 1.0,\n    \"end\": 5.0,\n    \"text\": \"안녕하세요!\"\n  }\n]"
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {uploadFormat === 'srt' ? 'SRT 형식으로 시간과 텍스트를 입력하세요.' : 'JSON 배열 형태로 입력하세요.'}
              </div>
              <button
                onClick={handleUpload}
                disabled={!uploadContent.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                업로드
              </button>
            </div>
          </div>
        )}

        {/* 자막 편집 탭 */}
        {activeTab === 'edit' && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">자막 편집 기능은 개발 중입니다.</div>
            <div className="text-sm text-gray-400">곧 고급 편집 도구를 제공할 예정입니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
