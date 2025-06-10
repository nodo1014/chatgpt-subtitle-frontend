'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClipData {
  id: string;
  title: string;
  sentence: string;
  englishSubtitle?: string;
  koreanSubtitle?: string;
  startTime: string;
  endTime: string;
  sourceFile: string;
  clipPath: string;
  thumbnailPath?: string;
  createdAt: string;
  duration?: string;
  tags: string[];
  isBookmarked?: boolean;
  categoryId?: number;
  viewCount?: number;
  rating?: number;
  notes?: string;
}

interface MigrationStatus {
  jsonFiles: number;
  dbRecords: number;
  needMigration: boolean;
}

export default function ClipsManagePage() {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookmarked, setFilterBookmarked] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadMigrationStatus();
    loadClips();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      const response = await fetch('/api/clips-manage?action=migration-status');
      const data = await response.json();
      if (data.success) {
        setMigrationStatus(data.data);
      }
    } catch (error) {
      console.error('마이그레이션 상태 로드 실패:', error);
    }
  };

  const loadClips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterBookmarked !== undefined) params.append('isBookmarked', filterBookmarked.toString());
      
      const response = await fetch(`/api/clips-manage?${params}`);
      const data = await response.json();
      if (data.success) {
        setClips(data.data);
      }
    } catch (error) {
      console.error('클립 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clips-manage?action=migrate');
      const data = await response.json();
      if (data.success) {
        alert(`마이그레이션 완료: 성공 ${data.data.success}개, 실패 ${data.data.failed}개`);
        loadMigrationStatus();
        loadClips();
      }
    } catch (error) {
      console.error('마이그레이션 실패:', error);
      alert('마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleClipSelection = (clipId: string) => {
    const newSelection = new Set(selectedClips);
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId);
    } else {
      newSelection.add(clipId);
    }
    setSelectedClips(newSelection);
  };

  const toggleBookmark = async (clipId: string, currentBookmark: boolean) => {
    try {
      const response = await fetch('/api/clips-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clipId,
          isBookmarked: !currentBookmark
        })
      });
      
      if (response.ok) {
        loadClips(); // 목록 새로고침
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
  };

  const deleteSelectedClips = async () => {
    if (selectedClips.size === 0) {
      alert('삭제할 클립을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedClips.size}개 클립을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const ids = Array.from(selectedClips).join(',');
      const response = await fetch(`/api/clips-manage?ids=${ids}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSelectedClips(new Set());
        loadClips();
        const data = await response.json();
        alert(`삭제 완료: 성공 ${data.data?.success || selectedClips.size}개`);
      }
    } catch (error) {
      console.error('클립 삭제 실패:', error);
      alert('클립 삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredClips = clips.filter(clip => {
    if (searchQuery && !clip.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !clip.sentence.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterBookmarked !== undefined && clip.isBookmarked !== filterBookmarked) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🗄️ 클립 관리</h1>
              <p className="mt-2 text-gray-600">클립 데이터베이스 관리 및 검색</p>
            </div>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← 메인으로
            </Link>
          </div>
        </div>

        {/* 마이그레이션 상태 */}
        {migrationStatus && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 데이터베이스 상태</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{migrationStatus.jsonFiles}</div>
                <div className="text-sm text-gray-600">JSON 파일</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{migrationStatus.dbRecords}</div>
                <div className="text-sm text-gray-600">DB 레코드</div>
              </div>
              <div className="text-center">
                {migrationStatus.needMigration ? (
                  <button
                    onClick={handleMigration}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    마이그레이션 필요
                  </button>
                ) : (
                  <div className="text-2xl text-green-600">✅</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 검색</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목 또는 내용 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">⭐ 북마크 필터</label>
              <select
                value={filterBookmarked === undefined ? 'all' : filterBookmarked.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterBookmarked(value === 'all' ? undefined : value === 'true');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="true">북마크만</option>
                <option value="false">일반만</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadClips}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-2"
              >
                🔄 새로고침
              </button>
              <button
                onClick={deleteSelectedClips}
                disabled={selectedClips.size === 0}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                🗑️ 삭제 ({selectedClips.size})
              </button>
            </div>
          </div>
        </div>

        {/* 클립 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              📹 클립 목록 ({filteredClips.length}개)
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : filteredClips.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">클립이 없습니다.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedClips.size === filteredClips.length && filteredClips.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClips(new Set(filteredClips.map(clip => clip.id)));
                          } else {
                            setSelectedClips(new Set());
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      썸네일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목 & 내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      태그
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClips.map((clip) => (
                    <tr key={clip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedClips.has(clip.id)}
                          onChange={() => toggleClipSelection(clip.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {clip.thumbnailPath ? (
                          <img
                            src={clip.thumbnailPath}
                            alt="썸네일"
                            className="w-16 h-9 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-16 h-9 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">썸네일 없음</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {clip.title}
                          </div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {clip.sentence}
                          </div>
                          {clip.koreanSubtitle && (
                            <div className="text-xs text-blue-600 truncate max-w-xs">
                              {clip.koreanSubtitle}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{clip.startTime} ~ {clip.endTime}</div>
                        <div className="text-xs text-gray-500">{clip.duration}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {clip.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleBookmark(clip.id, clip.isBookmarked || false)}
                            className={`p-2 rounded-lg ${
                              clip.isBookmarked 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={clip.isBookmarked ? '북마크 해제' : '북마크 추가'}
                          >
                            ⭐
                          </button>
                          <button
                            onClick={() => window.open(clip.clipPath, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="클립 재생"
                          >
                            ▶️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
