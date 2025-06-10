'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Sentence {
  id: number;
  text: string;
  media_file: string;
  start_time: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface DictationStats {
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  easyCompleted: number;
  mediumCompleted: number;
  hardCompleted: number;
}

export default function DictationPage() {
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<DictationStats>({
    totalAttempts: 0,
    correctAnswers: 0,
    accuracy: 0,
    easyCompleted: 0,
    mediumCompleted: 0,
    hardCompleted: 0
  });
  const [showHint, setShowHint] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // 모바일에서는 사이드바 기본 숨김
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
    
    // 초기 문장 로드
    loadNewSentence();
    
    // 통계 로드
    loadStats();
  }, [difficulty, category]);

  const loadStats = () => {
    // 샘플 통계 데이터
    setStats({
      totalAttempts: 47,
      correctAnswers: 32,
      accuracy: 68,
      easyCompleted: 15,
      mediumCompleted: 12,
      hardCompleted: 5
    });
  };

  const loadNewSentence = async () => {
    setIsLoading(true);
    setShowAnswer(false);
    setUserInput('');
    setShowHint(false);
    setAccuracy(0);

    try {
      const response = await fetch(`/api/dictation/random?difficulty=${difficulty}&category=${category}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentSentence(data.sentence);
      } else {
        alert(data.error || '문장을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('문장 로드 오류:', error);
      alert('문장을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (!currentSentence) return;
    
    setIsPlaying(true);
    
    // TTS 음성 재생
    const utterance = new SpeechSynthesisUtterance(currentSentence.text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (!currentSentence) return;
    
    const userText = userInput.trim().toLowerCase();
    const correctText = currentSentence.text.toLowerCase();
    
    // 간단한 정확도 계산
    const words = correctText.split(' ');
    const userWords = userText.split(' ');
    let correctWords = 0;
    
    words.forEach((word, index) => {
      if (userWords[index] && userWords[index] === word) {
        correctWords++;
      }
    });
    
    const calculatedAccuracy = Math.round((correctWords / words.length) * 100);
    setAccuracy(calculatedAccuracy);
    setShowAnswer(true);
    
    // 통계 업데이트
    setStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      correctAnswers: calculatedAccuracy >= 80 ? prev.correctAnswers + 1 : prev.correctAnswers,
      accuracy: Math.round(((calculatedAccuracy >= 80 ? prev.correctAnswers + 1 : prev.correctAnswers) / (prev.totalAttempts + 1)) * 100)
    }));
  };

  const getHint = () => {
    if (!currentSentence) return;
    setShowHint(true);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f23] transition-all duration-300">
      {/* ChatGPT Style Sidebar - 갈색 테마 */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'} bg-[#2d1b0e] text-[#ececf1] flex flex-col border-r border-[#4a3426] transition-all duration-300 z-50`}>
        <div className="p-4 border-b border-[#4a3426] flex justify-between items-center">
          <button 
            onClick={loadNewSentence}
            className="flex-1 bg-transparent border border-[#4a3426] text-[#ececf1] p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm mr-2 hover:bg-[#4a3426]"
          >
            <span>✍️</span>
            <span>새 받아쓰기</span>
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* 네비게이션 메뉴 */}
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">메뉴</h3>
            <div 
              onClick={() => router.push('/')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#4a3426] flex items-center gap-2"
            >
              <span>🎯</span>
              <span>메인 페이지</span>
            </div>
            <div 
              onClick={() => router.push('/ebook')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#4a3426] flex items-center gap-2"
            >
              <span>📚</span>
              <span>전자책 읽기</span>
            </div>
            <div 
              onClick={() => router.push('/results?view=clips')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#4a3426] flex items-center gap-2"
            >
              <span>🎬</span>
              <span>클립 보기</span>
            </div>
          </div>

          {/* 학습 통계 */}
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">학습 통계</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#4a3426] text-sm">
                <div className="flex justify-between items-center">
                  <span>총 시도</span>
                  <span className="font-semibold">{stats.totalAttempts}회</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4a3426] text-sm">
                <div className="flex justify-between items-center">
                  <span>정확도</span>
                  <span className="font-semibold text-green-400">{stats.accuracy}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 난이도별 기록 */}
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">난이도별 기록</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#4a3426] text-sm flex justify-between items-center">
                <span className="text-green-400">초급 (5-8단어)</span>
                <span>{stats.easyCompleted}개</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4a3426] text-sm flex justify-between items-center">
                <span className="text-yellow-400">중급 (8-15단어)</span>
                <span>{stats.mediumCompleted}개</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#4a3426] text-sm flex justify-between items-center">
                <span className="text-red-400">고급 (15단어+)</span>
                <span>{stats.hardCompleted}개</span>
              </div>
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">카테고리</h3>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#4a3426] border border-[#6b4d3a] text-[#ececf1] p-2.5 rounded-lg text-sm cursor-pointer"
            >
              <option value="all">전체</option>
              <option value="daily">일상 대화</option>
              <option value="business">비즈니스</option>
              <option value="movie">영화 대사</option>
              <option value="documentary">다큐멘터리</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden transition-all duration-300">
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between min-h-[60px]">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="bg-transparent border border-gray-200 text-gray-700 p-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center w-9 h-9 hover:bg-gray-50"
            >
              <span>☰</span>
            </button>
            <div className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              ✍️ 받아쓰기 연습
              <span className="text-sm text-gray-500">영어 듣기 & 쓰기 훈련</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    difficulty === diff 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {diff === 'easy' ? '초급' : diff === 'medium' ? '중급' : '고급'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">새로운 문장을 불러오는 중...</p>
                </div>
              ) : currentSentence ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  {/* 문장 정보 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentSentence.difficulty)}`}>
                        {currentSentence.difficulty === 'easy' ? '초급' : 
                         currentSentence.difficulty === 'medium' ? '중급' : '고급'}
                      </span>
                      <span className="text-sm text-gray-500">{currentSentence.category}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentSentence.media_file.split('/').pop()?.substring(0, 30)}...
                    </div>
                  </div>

                  {/* 오디오 재생 */}
                  <div className="text-center mb-8">
                    <button
                      onClick={playAudio}
                      disabled={isPlaying}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors duration-200 flex items-center gap-3 mx-auto"
                    >
                      {isPlaying ? (
                        <>
                          <span className="animate-pulse">🔊</span>
                          <span>재생 중...</span>
                        </>
                      ) : (
                        <>
                          <span>🔊</span>
                          <span>음성 듣기</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 입력 영역 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      들은 내용을 입력하세요:
                    </label>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg text-lg leading-relaxed resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      rows={3}
                      placeholder="여기에 들은 영어 문장을 입력하세요..."
                      disabled={showAnswer}
                    />
                  </div>

                  {/* 힌트 */}
                  {showHint && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">💡 힌트</h4>
                      <p className="text-blue-700">
                        첫 글자: {currentSentence.text.charAt(0)}...
                        <br />
                        단어 수: {currentSentence.text.split(' ').length}개
                      </p>
                    </div>
                  )}

                  {/* 정답 표시 */}
                  {showAnswer && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">📝 정답</h4>
                      <p className="text-lg text-gray-700 mb-3">{currentSentence.text}</p>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          accuracy >= 80 ? 'bg-green-100 text-green-800' : 
                          accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          정확도: {accuracy}%
                        </span>
                        <span className="text-sm text-gray-500">
                          {accuracy >= 80 ? '훌륭해요! 🎉' : 
                           accuracy >= 60 ? '좋아요! 👍' : 
                           '다시 도전해보세요! 💪'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 버튼들 */}
                  <div className="flex gap-3 justify-center">
                    {!showAnswer ? (
                      <>
                        <button
                          onClick={getHint}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                          💡 힌트
                        </button>
                        <button
                          onClick={checkAnswer}
                          disabled={!userInput.trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                        >
                          ✅ 정답 확인
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={loadNewSentence}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        ➡️ 다음 문장
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600">문장을 불러올 수 없습니다.</p>
                  <button
                    onClick={loadNewSentence}
                    className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
} 