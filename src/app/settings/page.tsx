'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MediaConfig {
  MEDIA_BASE_PATH: string;
  CLIPS_OUTPUT_PATH: string;
  THUMBNAILS_OUTPUT_PATH: string;
  FFMPEG_SETTINGS: {
    VIDEO_CODEC: string;
    AUDIO_CODEC: string;
    THUMBNAIL_FORMAT: string;
    THUMBNAIL_SIZE: string;
    THUMBNAIL_QUALITY: number;
    THUMBNAIL_BRIGHTNESS: number;
    THUMBNAIL_CONTRAST: number;
    THUMBNAIL_SATURATION: number;
  };
  CLIP_SETTINGS: {
    MAX_CLIPS_PER_BATCH: number;
    PADDING_SECONDS: number;
    MAX_DURATION: number;
  };
}

interface SearchConfig {
  DEFAULT_RESULTS_PER_SENTENCE: number;
  CONFIDENCE_THRESHOLD: number;
  MAX_SEARCH_RESULTS: number;
  SEARCH_TIMEOUT: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('media');
  const [mediaConfig, setMediaConfig] = useState<MediaConfig | null>(null);
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [adminKey, setAdminKey] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/settings');
      const result = await response.json();
      
      if (result.success) {
        setMediaConfig(result.data.mediaConfig);
        setSearchConfig(result.data.searchConfig);
        setIsLocked(result.locked || false);
        setLockInfo(result.lockInfo || null);
      } else {
        if (result.locked) {
          setIsLocked(true);
          setLockInfo(result.lockInfo);
          console.warn('⚠️ 설정이 잠금 상태:', result.error);
        }
        
        // 기본값 또는 제공된 데이터 사용
        setMediaConfig(result.data?.mediaConfig || {
          MEDIA_BASE_PATH: '/mnt/qnap/media_eng',
          CLIPS_OUTPUT_PATH: 'public/clips',
          THUMBNAILS_OUTPUT_PATH: 'public/thumbnails',
          FFMPEG_SETTINGS: {
            VIDEO_CODEC: 'libx264',
            AUDIO_CODEC: 'aac',
            THUMBNAIL_FORMAT: 'jpg',
            THUMBNAIL_SIZE: '320x180',
            THUMBNAIL_QUALITY: 2,
            THUMBNAIL_BRIGHTNESS: 0.1,
            THUMBNAIL_CONTRAST: 1.2,
            THUMBNAIL_SATURATION: 1.1,
          },
          CLIP_SETTINGS: {
            MAX_CLIPS_PER_BATCH: 20,
            PADDING_SECONDS: 0.5,
            MAX_DURATION: 30,
          }
        });

        setSearchConfig(result.data?.searchConfig || {
          DEFAULT_RESULTS_PER_SENTENCE: 5,
          CONFIDENCE_THRESHOLD: 0.7,
          MAX_SEARCH_RESULTS: 1000,
          SEARCH_TIMEOUT: 30,
        });
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
      alert('설정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveConfigs = async () => {
    if (isLocked && !adminKey) {
      setShowAdminDialog(true);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaConfig,
          searchConfig,
          adminKey: adminKey || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 설정이 저장되었습니다!');
        setIsLocked(false);
        setAdminKey('');
        setShowAdminDialog(false);
      } else {
        if (result.error.includes('잠금')) {
          setShowAdminDialog(true);
        }
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('❌ 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const resetConfigs = async () => {
    if (!confirm('⚠️ 모든 설정을 기본값으로 초기화하시겠습니까?')) return;

    if (isLocked && !adminKey) {
      setShowAdminDialog(true);
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: adminKey || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        setMediaConfig(result.data.mediaConfig);
        setSearchConfig(result.data.searchConfig);
        setIsLocked(false);
        setAdminKey('');
        setShowAdminDialog(false);
        alert('✅ 설정이 기본값으로 초기화되었습니다.');
      } else {
        if (result.error.includes('잠금')) {
          setShowAdminDialog(true);
        }
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      alert('❌ 설정 초기화에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              ← 홈으로
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">⚙️ 환경설정</h1>
                {isLocked && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    🔒 잠금됨
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {isLocked 
                  ? `설정이 잠금 상태입니다. 이유: ${lockInfo?.reason || '알 수 없음'}`
                  : '시스템 설정을 관리합니다'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={resetConfigs}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              🔄 초기화
            </button>
            <button 
              onClick={saveConfigs}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '💾 저장'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'media', name: '📁 미디어 설정', icon: '📁' },
                { id: 'ffmpeg', name: '🎬 FFmpeg 설정', icon: '🎬' },
                { id: 'clips', name: '✂️ 클립 설정', icon: '✂️' },
                { id: 'search', name: '🔍 검색 설정', icon: '🔍' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Media Settings Tab */}
            {activeTab === 'media' && mediaConfig && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📁 미디어 경로 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        기본 미디어 디렉토리
                      </label>
                      <input
                        type="text"
                        value={mediaConfig.MEDIA_BASE_PATH}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          MEDIA_BASE_PATH: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="/mnt/qnap/media_eng"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        클립 저장 경로
                      </label>
                      <input
                        type="text"
                        value={mediaConfig.CLIPS_OUTPUT_PATH}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          CLIPS_OUTPUT_PATH: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="public/clips"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        썸네일 저장 경로
                      </label>
                      <input
                        type="text"
                        value={mediaConfig.THUMBNAILS_OUTPUT_PATH}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          THUMBNAILS_OUTPUT_PATH: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="public/thumbnails"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FFmpeg Settings Tab */}
            {activeTab === 'ffmpeg' && mediaConfig && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🎬 FFmpeg 코덱 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        비디오 코덱
                      </label>
                      <select
                        value={mediaConfig.FFMPEG_SETTINGS.VIDEO_CODEC}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            VIDEO_CODEC: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="libx264">H.264 (libx264)</option>
                        <option value="libx265">H.265 (libx265)</option>
                        <option value="vp9">VP9</option>
                        <option value="av1">AV1</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        오디오 코덱
                      </label>
                      <select
                        value={mediaConfig.FFMPEG_SETTINGS.AUDIO_CODEC}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            AUDIO_CODEC: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="aac">AAC</option>
                        <option value="mp3">MP3</option>
                        <option value="opus">Opus</option>
                        <option value="vorbis">Vorbis</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🖼️ 썸네일 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        썸네일 크기
                      </label>
                      <select
                        value={mediaConfig.FFMPEG_SETTINGS.THUMBNAIL_SIZE}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            THUMBNAIL_SIZE: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="320x180">320x180 (16:9)</option>
                        <option value="640x360">640x360 (16:9)</option>
                        <option value="854x480">854x480 (16:9)</option>
                        <option value="1280x720">1280x720 (16:9)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        JPEG 품질 (1-31, 낮을수록 고품질)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={mediaConfig.FFMPEG_SETTINGS.THUMBNAIL_QUALITY}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            THUMBNAIL_QUALITY: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        밝기 (-1.0 ~ 1.0)
                      </label>
                      <input
                        type="number"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={mediaConfig.FFMPEG_SETTINGS.THUMBNAIL_BRIGHTNESS}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            THUMBNAIL_BRIGHTNESS: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대비 (0.0 ~ 4.0)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.1"
                        value={mediaConfig.FFMPEG_SETTINGS.THUMBNAIL_CONTRAST}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            THUMBNAIL_CONTRAST: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        채도 (0.0 ~ 3.0)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={mediaConfig.FFMPEG_SETTINGS.THUMBNAIL_SATURATION}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          FFMPEG_SETTINGS: {
                            ...mediaConfig.FFMPEG_SETTINGS,
                            THUMBNAIL_SATURATION: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clip Settings Tab */}
            {activeTab === 'clips' && mediaConfig && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">✂️ 클립 생성 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배치당 최대 클립 수
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={mediaConfig.CLIP_SETTINGS.MAX_CLIPS_PER_BATCH}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          CLIP_SETTINGS: {
                            ...mediaConfig.CLIP_SETTINGS,
                            MAX_CLIPS_PER_BATCH: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        패딩 시간 (초)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={mediaConfig.CLIP_SETTINGS.PADDING_SECONDS}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          CLIP_SETTINGS: {
                            ...mediaConfig.CLIP_SETTINGS,
                            PADDING_SECONDS: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        최대 클립 길이 (초)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={mediaConfig.CLIP_SETTINGS.MAX_DURATION}
                        onChange={(e) => setMediaConfig({
                          ...mediaConfig,
                          CLIP_SETTINGS: {
                            ...mediaConfig.CLIP_SETTINGS,
                            MAX_DURATION: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Settings Tab */}
            {activeTab === 'search' && searchConfig && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 검색 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        문장당 기본 결과 수
                      </label>
                      <select
                        value={searchConfig.DEFAULT_RESULTS_PER_SENTENCE}
                        onChange={(e) => setSearchConfig({
                          ...searchConfig,
                          DEFAULT_RESULTS_PER_SENTENCE: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={3}>3개</option>
                        <option value={5}>5개</option>
                        <option value={10}>10개</option>
                        <option value={20}>20개</option>
                        <option value={50}>50개</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        신뢰도 임계값 (0.0 ~ 1.0)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={searchConfig.CONFIDENCE_THRESHOLD}
                        onChange={(e) => setSearchConfig({
                          ...searchConfig,
                          CONFIDENCE_THRESHOLD: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        최대 검색 결과 수
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="100"
                        value={searchConfig.MAX_SEARCH_RESULTS}
                        onChange={(e) => setSearchConfig({
                          ...searchConfig,
                          MAX_SEARCH_RESULTS: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        검색 타임아웃 (초)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={searchConfig.SEARCH_TIMEOUT}
                        onChange={(e) => setSearchConfig({
                          ...searchConfig,
                          SEARCH_TIMEOUT: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📊 신뢰도 점수 가이드</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• 0.95 이상: 완전일치 (녹색)</div>
                    <div>• 0.8 이상: 정확매치 (파란색)</div>
                    <div>• 0.7 이상: 부분매치 (노란색)</div>
                    <div>• 0.7 미만: 유사매치 (빨간색)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔐 관리자 다이얼로그 */}
      {showAdminDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔐</span>
              <h3 className="text-lg font-semibold text-gray-800">관리자 인증 필요</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              설정이 잠금 상태입니다. 계속하려면 관리자 키를 입력하세요.
            </p>
            
            {isLocked && lockInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>잠금 이유:</strong> {lockInfo.reason}
                </p>
                {lockInfo.timestamp && (
                  <p className="text-xs text-yellow-700 mt-1">
                    잠금 시각: {new Date(lockInfo.timestamp).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            )}
            
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="관리자 키를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setShowAdminDialog(false);
                  saveConfigs();
                }
              }}
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAdminDialog(false);
                  setAdminKey('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowAdminDialog(false);
                  saveConfigs();
                }}
                disabled={!adminKey}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                인증 후 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
