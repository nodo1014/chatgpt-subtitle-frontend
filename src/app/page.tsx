'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function Home() {
  const [batchText, setBatchText] = useState('');
  const [resultsPerSentence, setResultsPerSentence] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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

  return (
    <AppLayout title="Batch Search" subtitle="다중 문장 검색" icon="🔍">
      {/* ChatGPT Style Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
        
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">문장 검색 & 클리핑!</h1>
          <p className="text-xl text-gray-600">자막 검색으로 영상 제작 소스와 메타데이터를 추출</p>
        </div>

        {/* Simple Search Input */}
        <div className="w-full max-w-2xl">
          <div className="relative">
            <textarea 
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              className="w-full min-h-[120px] p-4 pr-12 border border-gray-300 rounded-xl resize-none text-base leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              placeholder="영어 문장을 입력하세요...

예시:
I love you
How are you doing?
Thank you so much"
              rows={5}
            />
            <button 
              onClick={performBatchSearch}
              disabled={isSearching || !batchText.trim()}
              className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-10 h-10"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>↗</span>
              )}
            </button>
          </div>
          
          {/* Options */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <span>문장당 결과:</span>
                <select 
                  value={resultsPerSentence}
                  onChange={(e) => setResultsPerSentence(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={3}>3개</option>
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                </select>
              </label>
            </div>
            <button 
              onClick={clearInput}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">AI 테마 분류</h3>
            <p className="text-sm text-gray-600">DeepSeek AI가 문장을 자동으로 테마별 분류</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold text-gray-800 mb-2">자동 클립 생성</h3>
            <p className="text-sm text-gray-600">검색된 문장의 비디오 클립 자동 생성</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800 mb-2">270K+ 문장</h3>
            <p className="text-sm text-gray-600">프렌즈, 디즈니 등 다양한 미디어 데이터</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
