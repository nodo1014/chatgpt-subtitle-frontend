'use client';

import { SearchData, SearchResult, ClippingStatus } from '../types';
import { formatTime, getLanguageEmoji, getConfidenceColor, getMatchType } from '../utils';

interface SearchResultsProps {
  searchData: SearchData;
  clippingStatus: ClippingStatus;
  onCreateClip: (sentence: string, result: SearchResult, sentenceIndex: number, resultIndex: number) => void;
  onCreateAutoClips: (data: SearchData) => void;
}

export default function SearchResults({ 
  searchData, 
  clippingStatus, 
  onCreateClip, 
  onCreateAutoClips 
}: SearchResultsProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Search Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
        <h3 className="text-lg font-bold mb-4 text-center text-gray-800">📊 검색 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{searchData.search_summary.total_sentences}</div>
            <div className="text-sm text-gray-600">검색 문장</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-green-600">{searchData.search_summary.total_results}</div>
            <div className="text-sm text-gray-600">총 결과</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-purple-600">{searchData.search_summary.unique_files}</div>
            <div className="text-sm text-gray-600">영상 파일</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-orange-600">{searchData.search_summary.search_time}</div>
            <div className="text-sm text-gray-600">검색 시간(초)</div>
          </div>
        </div>
        
        {/* Auto Clip 생성 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onCreateAutoClips(searchData)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="text-xl">🚀</span>
            <span className="font-semibold">모든 결과를 자동으로 클립 생성</span>
            <span className="text-sm opacity-90">({searchData.search_summary.total_results}개)</span>
          </button>
          <p className="text-xs text-gray-600 mt-2">
            💡 백그라운드에서 처리되므로 다른 작업을 계속하실 수 있습니다
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-8">
        {searchData.sentence_results.map((sentenceResult) => (
          <div key={sentenceResult.sentence_index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  문장 {sentenceResult.sentence_index + 1}
                </span>
                <h4 className="font-semibold text-gray-800 text-lg">
                  &ldquo;{sentenceResult.search_sentence}&rdquo;
                </h4>
              </div>
              <div className="text-sm text-gray-500">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {sentenceResult.found_count}개 발견
                </span>
              </div>
            </div>

            {sentenceResult.results.length > 0 ? (
              <div className="grid gap-4">
                {sentenceResult.results.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-medium text-gray-800">
                            &ldquo;{result.subtitle_text}&rdquo;
                          </span>
                          <span className="text-xl">{getLanguageEmoji(result.language)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>📁 {result.media_file}</span>
                          <span>⏰ {formatTime(result.start_time)} - {formatTime(result.end_time)}</span>
                          <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                            🎯 {getMatchType(result.confidence)} ({Math.round(result.confidence * 100)}%)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onCreateClip(sentenceResult.search_sentence, result, sentenceResult.sentence_index, index)}
                        disabled={clippingStatus[`${sentenceResult.sentence_index}-${index}`]}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          clippingStatus[`${sentenceResult.sentence_index}-${index}`]
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {clippingStatus[`${sentenceResult.sentence_index}-${index}`] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            생성 중...
                          </>
                        ) : (
                          <>
                            🎬 클립 생성
                          </>
                        )}
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
    </div>
  );
}
