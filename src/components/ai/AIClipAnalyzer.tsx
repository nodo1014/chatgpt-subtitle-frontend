'use client';

import { useState } from 'react';

interface ClipQualityAnalysis {
  audio_clarity: number;
  speech_speed: number;
  vocabulary_level: 'beginner' | 'intermediate' | 'advanced';
  grammar_complexity: number;
  emotion_tone: string;
  energy_level: number;
  engagement_score: number;
  copyright_risk: number;
}

interface AIGeneratedTags {
  expressions: string[];
  grammar_points: string[];
  vocabulary_themes: string[];
  scene_context: string[];
  emotions: string[];
  difficulty_tags: string[];
  youtube_categories: string[];
}

interface YouTubeContentSuggestion {
  title: string;
  description: string;
  tags: string[];
  thumbnail_text: string;
  target_duration: number;
  difficulty_level: string;
  learning_objectives: string[];
}

interface AnalysisResults {
  qualityAnalysis?: ClipQualityAnalysis;
  aiTags?: AIGeneratedTags;
  contentSuggestion?: YouTubeContentSuggestion;
}

interface AIClipAnalyzerProps {
  clipId: string;
  clipTitle: string;
  englishSubtitle: string;
  onAnalysisComplete?: (results: AnalysisResults) => void;
}

export default function AIClipAnalyzer({ 
  clipId, 
  clipTitle, 
  englishSubtitle,
  onAnalysisComplete 
}: AIClipAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeClip = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-clip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clipId,
          analyzeQuality: true,
          generateTags: true,
          suggestContent: true,
        }),
      });

      if (!response.ok) {
        throw new Error('분석 요청 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults(result.data);
        onAnalysisComplete?.(result.data);
      } else {
        throw new Error(result.error || '분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVocabularyLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🤖 AI 클립 분석
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          <strong>{clipTitle}</strong>
        </p>
        <p className="text-gray-500 text-xs italic">
          "{englishSubtitle.substring(0, 100)}..."
        </p>
      </div>

      {/* 분석 시작 버튼 */}
      {!analysisResults && (
        <div className="text-center">
          <button
            onClick={analyzeClip}
            disabled={isAnalyzing}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isAnalyzing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>AI 분석 중...</span>
              </div>
            ) : (
              '🚀 AI 분석 시작'
            )}
          </button>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      )}

      {/* 분석 결과 */}
      {analysisResults && (
        <div className="space-y-6">
          {/* 품질 분석 */}
          {analysisResults.qualityAnalysis && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">📊 품질 분석</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResults.qualityAnalysis.audio_clarity)}`}>
                    {analysisResults.qualityAnalysis.audio_clarity}
                  </div>
                  <div className="text-xs text-gray-500">음성 명료도</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {analysisResults.qualityAnalysis.speech_speed}
                  </div>
                  <div className="text-xs text-gray-500">말하기 속도 (WPM)</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysisResults.qualityAnalysis.engagement_score)}`}>
                    {analysisResults.qualityAnalysis.engagement_score}
                  </div>
                  <div className="text-xs text-gray-500">참여도 점수</div>
                </div>
                <div className="text-center">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getVocabularyLevelColor(analysisResults.qualityAnalysis.vocabulary_level)}`}>
                    {analysisResults.qualityAnalysis.vocabulary_level}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">난이도</div>
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  감정: <span className="font-medium">{analysisResults.qualityAnalysis.emotion_tone}</span>
                </span>
                <span className="text-gray-600">
                  에너지: <span className="font-medium">{analysisResults.qualityAnalysis.energy_level}/100</span>
                </span>
              </div>
            </div>
          )}

          {/* AI 태그 */}
          {analysisResults.aiTags && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">🏷️ AI 생성 태그</h4>
              <div className="space-y-3">
                {Object.entries(analysisResults.aiTags).map(([category, tags]) => (
                  tags.length > 0 && (
                    <div key={category}>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {category.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* 유튜브 컨텐츠 제안 */}
          {analysisResults.contentSuggestion && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-red-50 to-pink-50">
              <h4 className="font-semibold text-gray-900 mb-3">🎬 유튜브 컨텐츠 제안</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">제목</label>
                  <div className="bg-white rounded p-2 border text-sm">
                    {analysisResults.contentSuggestion.title}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">설명</label>
                  <div className="bg-white rounded p-2 border text-sm">
                    {analysisResults.contentSuggestion.description}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">썸네일 텍스트</label>
                  <div className="bg-white rounded p-2 border text-sm font-bold text-center">
                    {analysisResults.contentSuggestion.thumbnail_text}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">권장 길이</label>
                    <div className="text-sm text-gray-600">{analysisResults.contentSuggestion.target_duration}초</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">난이도</label>
                    <div className={`text-sm px-2 py-1 rounded inline-block ${getVocabularyLevelColor(analysisResults.contentSuggestion.difficulty_level)}`}>
                      {analysisResults.contentSuggestion.difficulty_level}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">유튜브 태그</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysisResults.contentSuggestion.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 다시 분석 버튼 */}
          <div className="text-center">
            <button
              onClick={analyzeClip}
              disabled={isAnalyzing}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 다시 분석하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
