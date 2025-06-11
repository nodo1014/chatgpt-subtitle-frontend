'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface VideoClip {
  id: string;
  sentence_id: number;
  sentence_text: string;
  ai_translation: string;
  korean_pronunciation: string;
  series_name: string;
  theme: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  timestamps: {
    start: string;
    end: string;
  };
  metadata: {
    learning_priority: number;
    confidence_score: number;
    explanation: {
      line1: string;
      line2: string;
      line3: string;
    };
  };
}

interface PlaylistItem {
  id: string;
  title: string;
  theme: string;
  clip_count: number;
  total_duration: number;
  clips: VideoClip[];
}

export default function ClipPlayerPage() {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [currentClip, setCurrentClip] = useState<VideoClip | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [autoNext, setAutoNext] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // 목업 데이터
  useEffect(() => {
    const mockClips: VideoClip[] = [
      {
        id: 'clip_001',
        sentence_id: 1,
        sentence_text: "Could I BE any more excited about this?",
        ai_translation: "이것보다 더 신날 수가 있겠어?",
        korean_pronunciation: "쿠드 아이 비- 애니 모어 익사이티드 어바웃 디스?",
        series_name: 'Friends',
        theme: 'Daily Life',
        video_url: '/clips/friends_s01e01_001.mp4',
        thumbnail_url: '/thumbnails/friends_001.jpg',
        duration: 3,
        timestamps: { start: '00:12:34', end: '00:12:37' },
        metadata: {
          learning_priority: 9,
          confidence_score: 0.95,
          explanation: {
            line1: "챈들러의 대표적인 말투로 강조를 위해 'BE'를 강하게 발음",
            line2: "반어적 표현으로 '매우 흥미진진하다'는 의미",
            line3: "일상에서 과장된 감정 표현 시 유용한 패턴"
          }
        }
      },
      {
        id: 'clip_002',
        sentence_id: 2,
        sentence_text: "We were on a break!",
        ai_translation: "우리는 잠시 헤어진 상태였어!",
        korean_pronunciation: "위 워 온 어 브레이크!",
        series_name: 'Friends',
        theme: 'Love & Romance',
        video_url: '/clips/friends_s03e15_002.mp4',
        thumbnail_url: '/thumbnails/friends_002.jpg',
        duration: 2,
        timestamps: { start: '00:08:15', end: '00:08:17' },
        metadata: {
          learning_priority: 8,
          confidence_score: 0.92,
          explanation: {
            line1: "로스의 명대사로 관계의 애매한 상황을 표현",
            line2: "과거 완료 진행형으로 상황의 지속성 강조",
            line3: "연인 관계의 복잡한 상황에서 변명할 때 사용"
          }
        }
      }
    ];

    const mockPlaylists: PlaylistItem[] = [
      {
        id: 'playlist_friends_daily',
        title: '프렌즈 일상 표현',
        theme: 'Daily Life',
        clip_count: 25,
        total_duration: 180,
        clips: mockClips.filter(c => c.series_name === 'Friends')
      },
      {
        id: 'playlist_romance',
        title: '로맨스 표현 모음',
        theme: 'Love & Romance',
        clip_count: 18,
        total_duration: 120,
        clips: mockClips.filter(c => c.theme === 'Love & Romance')
      }
    ];

    setClips(mockClips);
    setPlaylists(mockPlaylists);
    setCurrentClip(mockClips[0]);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handlePrevious = () => {
    if (currentPlaylist && currentClip) {
      const currentIndex = currentPlaylist.clips.findIndex(c => c.id === currentClip.id);
      if (currentIndex > 0) {
        setCurrentClip(currentPlaylist.clips[currentIndex - 1]);
      }
    }
  };

  const handleNext = () => {
    if (currentPlaylist && currentClip) {
      const currentIndex = currentPlaylist.clips.findIndex(c => c.id === currentClip.id);
      if (currentIndex < currentPlaylist.clips.length - 1) {
        setCurrentClip(currentPlaylist.clips[currentIndex + 1]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ← 홈으로
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">🎥 학습 클립 플레이어</h1>
                <span className="text-sm text-gray-400">AI 선정 문장 비디오 클립으로 학습하기</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/theme-board')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                📋 게시판
              </button>
              <button
                onClick={() => router.push('/clip-generation')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                🎬 클립 생성
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 왼쪽: 플레이리스트 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">📚 플레이리스트</h2>
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      setCurrentPlaylist(playlist);
                      setCurrentClip(playlist.clips[0]);
                    }}
                    className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                      currentPlaylist?.id === playlist.id
                        ? 'bg-blue-900 border-blue-600'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium text-white">{playlist.title}</div>
                    <div className="text-sm text-gray-400">{playlist.theme}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {playlist.clip_count}개 클립 • {Math.floor(playlist.total_duration / 60)}분
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 재생 목록 */}
            {currentPlaylist && (
              <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">🎵 재생 목록</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentPlaylist.clips.map((clip, index) => (
                    <button
                      key={clip.id}
                      onClick={() => setCurrentClip(clip)}
                      className={`w-full p-3 text-left rounded border transition-colors ${
                        currentClip?.id === clip.id
                          ? 'bg-blue-900 border-blue-600'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            "{clip.sentence_text}"
                          </div>
                          <div className="text-xs text-gray-400">
                            {clip.series_name} • {clip.duration}초
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 비디오 플레이어 */}
          <div className="lg:col-span-3">
            {currentClip ? (
              <div className="space-y-6">
                
                {/* 비디오 플레이어 */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
                  <div className="relative aspect-video bg-black">
                    <video
                      ref={videoRef}
                      src={currentClip.video_url}
                      poster={currentClip.thumbnail_url}
                      className="w-full h-full object-contain"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                      onEnded={() => {
                        if (autoNext && repeatMode !== 'one') {
                          handleNext();
                        } else if (repeatMode === 'one') {
                          e.currentTarget.currentTime = 0;
                          e.currentTarget.play();
                        }
                      }}
                    />
                    
                    {/* 자막 오버레이 */}
                    {showSubtitles && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black bg-opacity-75 rounded-lg p-4 text-center">
                          <div className="text-xl font-medium text-white mb-1">
                            "{currentClip.sentence_text}"
                          </div>
                          <div className="text-lg text-yellow-300">
                            "{currentClip.ai_translation}"
                          </div>
                          <div className="text-sm text-gray-300 mt-1 font-mono">
                            🔊 {currentClip.korean_pronunciation}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 컨트롤 바 */}
                  <div className="p-4 space-y-4">
                    {/* 진행률 바 */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
                    </div>

                    {/* 재생 컨트롤 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handlePrevious}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          ⏮️
                        </button>
                        <button 
                          onClick={handlePlayPause}
                          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                        >
                          {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          onClick={handleNext}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          ⏭️
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* 볼륨 */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🔊</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* 재생 속도 */}
                        <select
                          value={playbackSpeed}
                          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                        >
                          <option value={0.5}>0.5x</option>
                          <option value={0.75}>0.75x</option>
                          <option value={1}>1x</option>
                          <option value={1.25}>1.25x</option>
                          <option value={1.5}>1.5x</option>
                          <option value={2}>2x</option>
                        </select>

                        {/* 자막 토글 */}
                        <button
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          className={`p-2 rounded ${showSubtitles ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors`}
                        >
                          📝
                        </button>

                        {/* 반복 모드 */}
                        <button
                          onClick={() => {
                            const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
                            const currentIndex = modes.indexOf(repeatMode);
                            setRepeatMode(modes[(currentIndex + 1) % modes.length]);
                          }}
                          className={`p-2 rounded transition-colors ${
                            repeatMode === 'none' ? 'text-gray-400' : 'text-blue-400'
                          } hover:text-white`}
                        >
                          {repeatMode === 'one' ? '🔂' : repeatMode === 'all' ? '🔁' : '🔁'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 학습 정보 */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📚 학습 정보</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 문장 정보 */}
                    <div>
                      <h4 className="font-medium text-white mb-3">📝 문장 분석</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">영어:</span>
                          <span className="text-white ml-2">"{currentClip.sentence_text}"</span>
                        </div>
                        <div>
                          <span className="text-gray-400">번역:</span>
                          <span className="text-blue-300 ml-2">"{currentClip.ai_translation}"</span>
                        </div>
                        <div>
                          <span className="text-gray-400">발음:</span>
                          <span className="text-yellow-300 ml-2 font-mono">{currentClip.korean_pronunciation}</span>
                        </div>
                      </div>
                    </div>

                    {/* 메타데이터 */}
                    <div>
                      <h4 className="font-medium text-white mb-3">📊 메타데이터</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">시리즈:</span>
                          <span className="text-white">{currentClip.series_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">테마:</span>
                          <span className="text-white">{currentClip.theme}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">우선순위:</span>
                          <span className="text-white">{currentClip.metadata.learning_priority}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">신뢰도:</span>
                          <span className="text-white">{Math.round(currentClip.metadata.confidence_score * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">원본 시간:</span>
                          <span className="text-white">{currentClip.timestamps.start} - {currentClip.timestamps.end}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3줄 해설 */}
                  <div className="mt-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
                    <h4 className="font-medium text-yellow-300 mb-3">💡 학습 포인트</h4>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-200">📍 {currentClip.metadata.explanation.line1}</div>
                      <div className="text-gray-200">📝 {currentClip.metadata.explanation.line2}</div>
                      <div className="text-gray-200">🎯 {currentClip.metadata.explanation.line3}</div>
                    </div>
                  </div>

                  {/* 학습 액션 */}
                  <div className="mt-6 flex gap-3">
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                      ⭐ 즐겨찾기
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                      📝 노트 작성
                    </button>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                      🎤 따라말하기
                    </button>
                    <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm">
                      📤 공유하기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 text-center">
                <div className="text-6xl mb-4">🎥</div>
                <h2 className="text-xl font-semibold text-white mb-2">클립을 선택해주세요</h2>
                <p className="text-gray-400">왼쪽에서 플레이리스트를 선택하고 재생할 클립을 클릭하세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
