'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchResult {
  media_file: string;
  subtitle_text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
  confidence: number;
}

interface SentenceResult {
  sentence_index: number;
  search_sentence: string;
  found_count: number;
  results: SearchResult[];
}

interface SearchData {
  success: boolean;
  extracted_sentences: string[];
  search_summary: {
    total_sentences: number;
    total_results: number;
    average_per_sentence: string;
    search_time: number;
  };
  sentence_results: SentenceResult[];
}

export default function ResultsPage() {
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clippingStatus, setClippingStatus] = useState<{[key: string]: boolean}>({});
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setSearchData(decodedData);
      } catch (error) {
        console.error('데이터 파싱 오류:', error);
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [searchParams, router]);

  const requestClip = async (sentence: string, result: SearchResult, sentenceIndex: number, resultIndex: number) => {
    const clipKey = `${sentenceIndex}-${resultIndex}`;
    
    if (clippingStatus[clipKey]) return; // 이미 처리 중
    
    setClippingStatus(prev => ({ ...prev, [clipKey]: true }));
    
    try {
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentence,
          media_file: result.media_file,
          start_time: result.start_time,
          end_time: result.end_time
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('클립 요청이 등록되었습니다! 관리자가 수동으로 처리합니다.');
      } else {
        alert(`클립 요청 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('클립 요청 오류:', error);
      alert('클립 요청 중 오류가 발생했습니다.');
    } finally {
      setClippingStatus(prev => ({ ...prev, [clipKey]: false }));
    }
  };

  const formatTime = (timeStr: string) => {
    // "00:01:23,456" 형식을 "1:23" 형식으로 변환
    try {
      const parts = timeStr.split(':');
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2].split(',')[0]);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return timeStr;
    }
  };

  const getLanguageEmoji = (language: string) => {
    return language === 'ko' ? '🇰🇷' : '🇺🇸';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600';
    if (confidence >= 0.8) return 'text-blue-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchType = (confidence: number) => {
    if (confidence >= 0.95) return '완전일치';
    if (confidence >= 0.8) return '정확매치';
    if (confidence >= 0.7) return '부분매치';
    return '유사매치';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">검색 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">검색 결과를 찾을 수 없습니다</h2>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              ← 새 검색
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">🎯 배치 검색 결과</h1>
              <p className="text-sm text-gray-600">
                {searchData.search_summary.total_sentences}개 문장, 총 {searchData.search_summary.total_results}개 결과
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            검색 시간: {searchData.search_summary.search_time}초
          </div>
        </div>
      </div>

      {/* Search Summary */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <h3 className="text-lg font-bold mb-4 text-center text-gray-800">📊 검색 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{searchData.search_summary.total_sentences}</div>
              <div className="text-sm text-gray-600">검색된 문장</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-green-600">{searchData.search_summary.total_results}</div>
              <div className="text-sm text-gray-600">총 결과</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-purple-600">{searchData.search_summary.average_per_sentence}</div>
              <div className="text-sm text-gray-600">평균/문장</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-orange-600">{searchData.search_summary.search_time}s</div>
              <div className="text-sm text-gray-600">검색 시간</div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {searchData.sentence_results.map((sentenceResult) => (
            <div key={sentenceResult.sentence_index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <h4 className="text-lg font-semibold text-gray-800 flex-1 mr-4">
                  {sentenceResult.sentence_index}. "{sentenceResult.search_sentence}"
                </h4>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {sentenceResult.found_count}개 결과
                </div>
              </div>

              {sentenceResult.results.length > 0 ? (
                <div className="grid gap-4">
                  {sentenceResult.results.map((result, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">{result.media_file}</span>
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs text-gray-600">
                            {result.directory}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                          <span className="font-mono">{formatTime(result.start_time)}</span>
                          <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                            {getMatchType(result.confidence)}
                          </span>
                          <span className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                            {(result.confidence * 100).toFixed(0)}%
                          </span>
                          <span>{getLanguageEmoji(result.language)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-800 italic leading-relaxed">
                          "{result.subtitle_text}"
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm transition-colors">
                          🎬 재생
                        </button>
                        <button 
                          onClick={() => requestClip(sentenceResult.search_sentence, result, sentenceResult.sentence_index, index)}
                          disabled={clippingStatus[`${sentenceResult.sentence_index}-${index}`]}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {clippingStatus[`${sentenceResult.sentence_index}-${index}`] ? '🔄 요청 중...' : '📎 클립 요청'}
                        </button>
                        <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm transition-colors">
                          💾 저장
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>이 문장에 대한 결과를 찾을 수 없습니다.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
          >
            새로운 검색 시작하기
          </button>
        </div>
      </div>
    </div>
  );
} 