'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ClipJob {
  id: string;
  sentence_id: number;
  sentence_text: string;
  series_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  input_video: string;
  output_clip: string | null;
  timestamps: {
    start: string;
    end: string;
  };
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface ClipGenerationStats {
  total_jobs: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  estimated_time: string;
}

export default function ClipGenerationPage() {
  const [clipJobs, setClipJobs] = useState<ClipJob[]>([]);
  const [stats, setStats] = useState<ClipGenerationStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const router = useRouter();

  // 목업 데이터
  useEffect(() => {
    const mockJobs: ClipJob[] = [
      {
        id: 'clip_001',
        sentence_id: 1,
        sentence_text: "Could I BE any more excited about this?",
        series_name: 'Friends',
        status: 'completed',
        progress: 100,
        input_video: '/media/friends/s01e01.mp4',
        output_clip: '/clips/friends_s01e01_001.mp4',
        timestamps: { start: '00:12:34', end: '00:12:37' },
        created_at: '2025-06-11 10:30:00',
        completed_at: '2025-06-11 10:32:15',
        error_message: null
      },
      {
        id: 'clip_002',
        sentence_id: 2,
        sentence_text: "We were on a break!",
        series_name: 'Friends',
        status: 'processing',
        progress: 65,
        input_video: '/media/friends/s03e15.mp4',
        output_clip: null,
        timestamps: { start: '00:08:15', end: '00:08:17' },
        created_at: '2025-06-11 10:35:00',
        completed_at: null,
        error_message: null
      },
      {
        id: 'clip_003',
        sentence_id: 3,
        sentence_text: "The cold never bothered me anyway",
        series_name: 'Frozen',
        status: 'pending',
        progress: 0,
        input_video: '/media/disney/frozen.mp4',
        output_clip: null,
        timestamps: { start: '01:15:20', end: '01:15:25' },
        created_at: '2025-06-11 10:40:00',
        completed_at: null,
        error_message: null
      },
      {
        id: 'clip_004',
        sentence_id: 4,
        sentence_text: "I'll make a man out of you",
        series_name: 'Mulan',
        status: 'failed',
        progress: 0,
        input_video: '/media/disney/mulan.mp4',
        output_clip: null,
        timestamps: { start: '00:45:10', end: '00:45:15' },
        created_at: '2025-06-11 10:45:00',
        completed_at: null,
        error_message: 'Source video file not found'
      }
    ];

    setClipJobs(mockJobs);
    setStats({
      total_jobs: 258,
      pending: 120,
      processing: 3,
      completed: 128,
      failed: 7,
      estimated_time: '2시간 30분'
    });
  }, []);

  const filteredJobs = clipJobs.filter(job => {
    if (selectedFilter === 'all') return true;
    return job.status === selectedFilter;
  });

  const handleGenerateClips = async () => {
    // 실제로는 API 호출
    console.log('클립 생성 시작...');
    alert('클립 생성이 시작되었습니다. 진행 상황을 모니터링할 수 있습니다.');
  };

  const handleRetryFailed = async (jobId: string) => {
    // 실제로는 API 호출
    console.log(`재시도: ${jobId}`);
    alert('실패한 작업을 재시도합니다.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'processing': return 'text-blue-700 bg-blue-100';
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'processing': return '처리중';
      case 'pending': return '대기중';
      case 'failed': return '실패';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← 홈으로
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🎬 비디오 클립 생성 시스템</h1>
                <span className="text-sm text-gray-500">AI 선정 문장들의 자동 클리핑 및 관리</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/theme-board')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                📋 게시판 보기
              </button>
              <button
                onClick={() => router.push('/clips')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                🎥 클립 재생
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 왼쪽: 통계 및 제어 패널 */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 통계 카드 */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 생성 통계</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">전체 작업</span>
                    <span className="font-medium">{stats.total_jobs}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">대기중</span>
                    <span className="font-medium text-yellow-600">{stats.pending}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">처리중</span>
                    <span className="font-medium text-blue-600">{stats.processing}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">완료</span>
                    <span className="font-medium text-green-600">{stats.completed}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">실패</span>
                    <span className="font-medium text-red-600">{stats.failed}개</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">예상 완료</span>
                      <span className="font-medium">{stats.estimated_time}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 제어 패널 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 생성 제어</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배치 크기
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1개씩</option>
                    <option value={3}>3개씩</option>
                    <option value={5}>5개씩</option>
                    <option value={10}>10개씩</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoGenerate"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="autoGenerate" className="text-sm text-gray-700">
                    자동 생성 활성화
                  </label>
                </div>

                <button
                  onClick={handleGenerateClips}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium"
                >
                  🚀 클립 생성 시작
                </button>

                <button
                  onClick={() => console.log('전체 중지')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  ⏹️ 전체 중지
                </button>
              </div>
            </div>

            {/* 필터 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 필터</h2>
              <div className="space-y-2">
                {[
                  { key: 'all', label: '전체', count: clipJobs.length },
                  { key: 'pending', label: '대기중', count: clipJobs.filter(j => j.status === 'pending').length },
                  { key: 'processing', label: '처리중', count: clipJobs.filter(j => j.status === 'processing').length },
                  { key: 'completed', label: '완료', count: clipJobs.filter(j => j.status === 'completed').length },
                  { key: 'failed', label: '실패', count: clipJobs.filter(j => j.status === 'failed').length }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`w-full p-2 text-left rounded-lg text-sm transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 작업 목록 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    🎬 클립 생성 작업 ({filteredJobs.length}개)
                  </h2>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors">
                      🔄 새로고침
                    </button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                      🗑️ 실패 작업 정리
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 작업 헤더 */}
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                                {getStatusText(job.status)}
                              </span>
                              <span className="text-xs text-gray-500">ID: {job.id}</span>
                              <span className="text-xs text-gray-500">📺 {job.series_name}</span>
                            </div>

                            {/* 문장 정보 */}
                            <div className="mb-3">
                              <div className="text-lg font-medium text-gray-900 mb-1">
                                "{job.sentence_text}"
                              </div>
                              <div className="text-sm text-gray-600">
                                ⏰ {job.timestamps.start} - {job.timestamps.end}
                              </div>
                            </div>

                            {/* 파일 경로 */}
                            <div className="space-y-1 text-xs text-gray-500">
                              <div>📁 입력: {job.input_video}</div>
                              {job.output_clip && (
                                <div>📁 출력: {job.output_clip}</div>
                              )}
                            </div>

                            {/* 진행률 바 */}
                            {job.status === 'processing' && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>진행률</span>
                                  <span>{job.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${job.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* 에러 메시지 */}
                            {job.error_message && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                ❌ {job.error_message}
                              </div>
                            )}

                            {/* 시간 정보 */}
                            <div className="mt-3 text-xs text-gray-500">
                              생성 시작: {job.created_at}
                              {job.completed_at && (
                                <span> | 완료: {job.completed_at}</span>
                              )}
                            </div>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex flex-col gap-2 ml-4">
                            {job.status === 'completed' && (
                              <>
                                <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors">
                                  ▶️ 재생
                                </button>
                                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors">
                                  📥 다운로드
                                </button>
                              </>
                            )}
                            {job.status === 'failed' && (
                              <button 
                                onClick={() => handleRetryFailed(job.id)}
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 transition-colors"
                              >
                                🔄 재시도
                              </button>
                            )}
                            {job.status === 'processing' && (
                              <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                                ⏹️ 중지
                              </button>
                            )}
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors">
                              📊 상세
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🎬</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">작업이 없습니다</h3>
                    <p className="text-gray-600">선택한 필터에 해당하는 클립 생성 작업이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
