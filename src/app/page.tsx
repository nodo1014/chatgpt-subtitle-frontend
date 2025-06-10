'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

interface HistoryItem {
  title: string;
  count: number;
  timestamp: string;
}

export default function Home() {
  const [batchText, setBatchText] = useState('');
  const [resultsPerSentence, setResultsPerSentence] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // 모바일에서는 사이드바 기본 숨김
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }

    // 검색 히스토리 로드
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    // 샘플 히스토리 데이터
    const sampleHistory: HistoryItem[] = [
      { title: '💕 사랑과 관계 표현', count: 15, timestamp: '2024-01-15' },
      { title: '💼 비즈니스 미팅 영어', count: 12, timestamp: '2024-01-14' },
      { title: '☕ 일상 대화 표현', count: 18, timestamp: '2024-01-13' },
      { title: '😊 감정 표현하기', count: 20, timestamp: '2024-01-12' },
      { title: '🍕 음식 관련 표현', count: 16, timestamp: '2024-01-11' },
      { title: '✈️ 여행 영어 표현', count: 22, timestamp: '2024-01-10' },
      { title: '🎓 학교생활 표현', count: 14, timestamp: '2024-01-09' },
      { title: '💪 운동과 건강', count: 19, timestamp: '2024-01-08' },
      { title: '🎬 영화 리뷰 표현', count: 17, timestamp: '2024-01-07' },
      { title: '🛍️ 쇼핑 영어', count: 13, timestamp: '2024-01-06' },
    ];
    setSearchHistory(sampleHistory);
  };

  const extractEnglishSentences = (text: string): string[] => {
    const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g;
    
    // 줄바꿈으로 문장 분리
    const lines = text.split('\n').map(line => line.trim()).filter(line => {
      // 빈 줄 제거
      if (line.length === 0) return false;
      
      // 한글/중국어/일본어 문자가 포함된 줄 제거
      if (koreanRegex.test(line)) return false;
      
      // 최소 길이 체크 (3글자 이상)
      if (line.length < 3) return false;
      
      // 최소 단어 수 체크 (2개 이상의 단어)
      if (line.split(/\s+/).length < 2) return false;
      
      return true;
    });
    
    return lines;
  };

  const performBatchSearch = async () => {
    if (!batchText.trim()) {
      alert('다중 문장을 입력해주세요.');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 배치 검색 시작:', batchText);
    }
    setIsSearching(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 API 요청 전송 중...');
      }
      const response = await fetch('/api/batch-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: batchText,
          results_per_sentence: resultsPerSentence
        })
      });

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 API 응답 받음:', data);
      }

      if (data.success) {
        // 자동 클립 생성 플래그 추가
        data.auto_create_clips = true;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ auto_create_clips 플래그 설정:', data.auto_create_clips);
        }
        
        // 검색 결과 페이지로 이동
        const searchDataParam = encodeURIComponent(JSON.stringify(data));
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 결과 페이지로 이동 중...');
        }
        router.push(`/results?data=${searchDataParam}`);
      } else {
        alert(data.error || '검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearInput = () => {
    setBatchText('');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f23] transition-all duration-300">
      {/* ChatGPT Style Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'} bg-[#171717] text-[#ececf1] flex flex-col border-r border-[#2d2d2d] transition-all duration-300 z-50`}>
        <div className="p-4 border-b border-[#2d2d2d] flex justify-between items-center">
          <button className="flex-1 bg-transparent border border-[#2d2d2d] text-[#ececf1] p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm mr-2 hover:bg-[#2d2d2d]">
            <span>➕</span>
            <span>새 테마 검색</span>
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">최근 검색</h3>
            {searchHistory.map((item, index) => (
              <div key={index} className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
                {item.title} ({item.count}개 문장)
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">학습 메뉴</h3>
            <div 
              onClick={() => router.push('/dictation')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>✍️</span>
              <span>받아쓰기 연습</span>
            </div>
            <div 
              onClick={() => router.push('/ebook')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>📚</span>
              <span>전자책 읽기</span>
            </div>
            <div 
              onClick={() => router.push('/results?view=clips')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>🎬</span>
              <span>클립 보기</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">시스템</h3>
            <div 
              onClick={() => router.push('/clips-manage')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>🗄️</span>
              <span>클립 관리</span>
            </div>
            <div 
              onClick={() => router.push('/settings')}
              className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>⚙️</span>
              <span>환경설정</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">즐겨찾기</h3>
            <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
              ⭐ TOEIC 필수 표현
            </div>
            <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
              ⭐ 면접 영어 표현
            </div>
            <div className="p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d]">
              ⭐ 친구와의 대화
            </div>
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
              🎯 Theme Search
              <span className="text-sm text-gray-500">테마별 다중 문장 검색</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dictation')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              ✍️ 받아쓰기
            </button>
            <button
              onClick={() => router.push('/ebook')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              📚 전자책
            </button>
            <button
              onClick={() => router.push('/results?view=clips')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              🎬 클립 보기
            </button>
            <div className="hidden lg:flex gap-5 text-sm text-gray-500">
              <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
                <span>📊</span>
                <span>270K+ 문장</span>
              </div>
              <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
                <span>🎬</span>
                <span>7개 미디어</span>
              </div>
              <div className="bg-gray-100 px-2 py-1 rounded-xl flex items-center gap-1 text-gray-700">
                <span>⚡</span>
                <span>AI 추천</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Search Input Section */}
          <div className="bg-white p-8 border-b border-gray-200 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-3 text-gray-800">🎯 쉐도윙 문장 검색</h2>
                <p className="text-lg mb-8 opacity-80 leading-relaxed text-gray-600">
                  쉐도윙 연습을 위한 정확한 영어 문장 매칭으로 미디어 콘텐츠를 찾아보세요.
                </p>
                
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <label htmlFor="batchTextInput" className="block text-base font-semibold mb-2.5 text-gray-700">
                    📝 영어 문장들 입력 (줄바꿈으로 구분)
                  </label>
                  <textarea 
                    id="batchTextInput"
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    className="w-full min-h-[160px] p-4 border border-gray-200 rounded-lg bg-white text-gray-700 text-base leading-relaxed resize-vertical transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={`i love you
how are you
thank you
good morning
see you later

(쉐도윙 연습할 영어 문장을 한 줄에 하나씩 입력하세요. 정확한 매칭으로 검색됩니다.)`}
                    rows={6}
                  />
                  
                  <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-4">
                    <div className="flex items-center gap-2.5">
                      <label htmlFor="resultsPerSentence" className="text-sm text-gray-700 font-medium">문장당 결과 수:</label>
                      <select 
                        id="resultsPerSentence" 
                        value={resultsPerSentence}
                        onChange={(e) => setResultsPerSentence(Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-700 text-sm cursor-pointer transition-all duration-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value={3}>3개</option>
                        <option value={5}>5개</option>
                        <option value={10}>10개</option>
                        <option value={20}>20개</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={clearInput}
                        className="bg-transparent text-gray-500 border border-gray-200 rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:bg-gray-50 hover:text-gray-700"
                      >
                        🗑️ 초기화
                      </button>
                      <button 
                        onClick={performBatchSearch}
                        disabled={isSearching}
                        className="bg-blue-600 text-white border border-blue-600 rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:bg-blue-700 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSearching ? '🎬 검색 & 클립 생성 중...' : '🎬 검색하면서 클립 만들기'}
                      </button>
                    </div>
                  </div>
                  
                  {isSearching && (
                    <div className="w-full h-1 bg-gray-200 rounded-sm overflow-hidden mt-5">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-sm animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
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
