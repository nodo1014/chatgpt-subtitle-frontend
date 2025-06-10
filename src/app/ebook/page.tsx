'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EbookChapter {
  id: number;
  title: string;
  media_file: string;
  sentences: EbookSentence[];
  category: string;
  duration: string;
}

interface EbookSentence {
  id: number;
  text: string;
  start_time: string;
  end_time: string;
  character?: string;
  isRead: boolean;
  isBookmarked: boolean;
  notes: string;
}

export default function EbookPage() {
  const [chapters, setChapters] = useState<EbookChapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<EbookChapter | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [readingMode, setReadingMode] = useState<'normal' | 'roleplay' | 'study'>('normal');
  const [fontSize, setFontSize] = useState(16);
  const [showTranslation, setShowTranslation] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadChapters();
    // 모바일에서는 사이드바 기본 숨김
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  const loadChapters = async () => {
    try {
      const response = await fetch('/api/ebook/chapters');
      const data = await response.json();
      if (data.success) {
        setChapters(data.chapters);
        if (data.chapters.length > 0) {
          setCurrentChapter(data.chapters[0]);
        }
      }
    } catch (error) {
      console.error('챕터 로드 오류:', error);
    }
  };

  const toggleBookmark = (sentenceId: number) => {
    setBookmarks(prev => 
      prev.includes(sentenceId) 
        ? prev.filter(id => id !== sentenceId)
        : [...prev, sentenceId]
    );
  };

  const markAsRead = (sentenceIndex: number) => {
    if (!currentChapter) return;
    
    const updatedChapter = { ...currentChapter };
    updatedChapter.sentences[sentenceIndex].isRead = true;
    setCurrentChapter(updatedChapter);
  };

  const playAudio = (sentence: EbookSentence) => {
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const addToVocabulary = (word: string) => {
    if (!vocabulary.includes(word.toLowerCase())) {
      setVocabulary(prev => [...prev, word.toLowerCase()]);
    }
  };

  const getCharacterColor = (character?: string) => {
    const colors = {
      'Ross': 'text-blue-600',
      'Rachel': 'text-pink-600', 
      'Monica': 'text-purple-600',
      'Chandler': 'text-orange-600',
      'Joey': 'text-green-600',
      'Phoebe': 'text-yellow-600',
      'default': 'text-gray-800'
    };
    return colors[character as keyof typeof colors] || colors.default;
  };

  const formatTime = (timeStr: string) => {
    try {
      const parts = timeStr.split(':');
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2].split(',')[0]);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return timeStr;
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f23] transition-all duration-300">
      {/* ChatGPT Style Sidebar - 전자책용 (보라색 테마) */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'} bg-[#1a0d2e] text-[#ececf1] flex flex-col border-r border-[#3d2a5c] transition-all duration-300 z-50`}>
        <div className="p-4 border-b border-[#3d2a5c] flex justify-between items-center">
          <button className="flex-1 bg-transparent border border-[#3d2a5c] text-[#ececf1] p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm mr-2 hover:bg-[#3d2a5c]">
            <span>📚</span>
            <span>새 전자책</span>
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* 네비게이션 메뉴 */}
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">메뉴</h3>
            <div 
              onClick={() => router.push('/')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#3d2a5c] flex items-center gap-2"
            >
              <span>🎯</span>
              <span>메인 페이지</span>
            </div>
            <div 
              onClick={() => router.push('/dictation')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#3d2a5c] flex items-center gap-2"
            >
              <span>✍️</span>
              <span>받아쓰기 연습</span>
            </div>
            <div 
              onClick={() => router.push('/results?view=clips')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#3d2a5c] flex items-center gap-2"
            >
              <span>🎬</span>
              <span>클립 보기</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">📖 챕터 목록</h3>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setCurrentChapter(chapter)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentChapter?.id === chapter.id 
                      ? 'bg-[#3d2a5c] border-2 border-purple-400' 
                      : 'bg-transparent hover:bg-[#3d2a5c] border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-[#ececf1] mb-1 text-sm">{chapter.title}</div>
                  <div className="text-xs text-[#8e8ea0]">
                    {chapter.category} • {chapter.duration} • {chapter.sentences.length}문장
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    진도: {chapter.sentences.filter(s => s.isRead).length}/{chapter.sentences.length}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">📊 학습 현황</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2.5 rounded-lg bg-[#3d2a5c]">
                <div className="flex justify-between">
                  <span className="text-[#8e8ea0]">북마크:</span>
                  <span className="font-semibold text-blue-400">{bookmarks.length}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#3d2a5c]">
                <div className="flex justify-between">
                  <span className="text-[#8e8ea0]">단어장:</span>
                  <span className="font-semibold text-purple-400">{vocabulary.length}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#3d2a5c]">
                <div className="flex justify-between">
                  <span className="text-[#8e8ea0]">완료 챕터:</span>
                  <span className="font-semibold text-green-400">
                    {chapters.filter(c => c.sentences.every(s => s.isRead)).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">읽기 모드</h3>
            {['normal', 'roleplay', 'study'].map((mode) => (
              <div 
                key={mode}
                onClick={() => setReadingMode(mode as any)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight ${readingMode === mode ? 'bg-[#3d2a5c] text-purple-400' : 'text-[#e5e5e5] hover:bg-[#3d2a5c]'}`}
              >
                {mode === 'normal' ? '📖 일반 읽기' : 
                 mode === 'roleplay' ? '🎭 역할극 모드' : '📝 학습 모드'}
              </div>
            ))}
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
              📚 인터랙티브 전자책
              <span className="text-sm text-gray-500">스토리 기반 학습</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={readingMode}
              onChange={(e) => setReadingMode(e.target.value as any)}
              className="p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="normal">일반 읽기</option>
              <option value="roleplay">역할극 모드</option>
              <option value="study">학습 모드</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">글자 크기:</span>
              <button 
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                A-
              </button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
              <button 
                onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="bg-white p-8 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              {currentChapter ? (
                <>
                  {/* 챕터 헤더 */}
                  <div className="mb-8 pb-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentChapter.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📁 {currentChapter.category}</span>
                      <span>⏱️ {currentChapter.duration}</span>
                      <span>📄 {currentChapter.sentences.length}문장</span>
                    </div>
                  </div>

                  {/* 읽기 컨트롤 */}
                  <div className="mb-6 flex items-center gap-4">
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        showTranslation 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showTranslation ? '🇰🇷 번역 숨기기' : '🇺🇸 번역 보기'}
                    </button>
                    <button
                      onClick={() => {
                        currentChapter.sentences.forEach((sentence, index) => {
                          setTimeout(() => playAudio(sentence), index * 3000);
                        });
                      }}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg transition-colors"
                    >
                      🎧 전체 재생
                    </button>
                  </div>

                  {/* 문장 목록 */}
                  <div className="space-y-4">
                    {currentChapter.sentences.map((sentence, index) => (
                      <div 
                        key={sentence.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          sentence.isRead 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } ${
                          currentSentenceIndex === index ? 'ring-2 ring-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                            {sentence.character && readingMode === 'roleplay' && (
                              <span className={`text-sm font-semibold ${getCharacterColor(sentence.character)}`}>
                                {sentence.character}:
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{formatTime(sentence.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playAudio(sentence)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => toggleBookmark(sentence.id)}
                              className={`text-sm ${
                                bookmarks.includes(sentence.id) 
                                  ? 'text-yellow-600' 
                                  : 'text-gray-400 hover:text-yellow-600'
                              }`}
                            >
                              {bookmarks.includes(sentence.id) ? '⭐' : '☆'}
                            </button>
                            <button
                              onClick={() => markAsRead(index)}
                              className={`text-sm ${
                                sentence.isRead 
                                  ? 'text-green-600' 
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                            >
                              {sentence.isRead ? '✅' : '☐'}
                            </button>
                          </div>
                        </div>

                        <p 
                          className={`leading-relaxed text-gray-800 mb-2 ${getCharacterColor(sentence.character)}`}
                          style={{ fontSize: `${fontSize}px` }}
                          onDoubleClick={(e) => {
                            const selection = window.getSelection()?.toString();
                            if (selection) {
                              addToVocabulary(selection);
                              alert(`"${selection}"을(를) 단어장에 추가했습니다!`);
                            }
                          }}
                        >
                          "{sentence.text}"
                        </p>

                        {showTranslation && (
                          <p className="text-sm text-gray-600 italic">
                            번역: [번역 기능은 추후 구현 예정]
                          </p>
                        )}

                        {readingMode === 'study' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <textarea
                              placeholder="이 문장에 대한 메모를 작성하세요..."
                              className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
                              rows={2}
                              value={sentence.notes}
                              onChange={(e) => {
                                const updatedChapter = { ...currentChapter };
                                updatedChapter.sentences[index].notes = e.target.value;
                                setCurrentChapter(updatedChapter);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 챕터 완료 */}
                  {currentChapter.sentences.every(s => s.isRead) && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <h3 className="text-lg font-bold text-green-800 mb-2">챕터 완료!</h3>
                      <p className="text-green-700">모든 문장을 읽었습니다. 다음 챕터로 이동하세요.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">전자책을 선택하세요</h3>
                  <p className="text-gray-600">왼쪽에서 읽고 싶은 챕터를 선택해주세요.</p>
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