'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DatabaseSchemaViewer from './DatabaseSchemaViewer';

// 간단한 아이콘 컴포넌트들
const FolderIcon = ({ className }) => <span className={className}>📁</span>;
const PlusIcon = ({ className }) => <span className={className}>➕</span>;
const BookmarkIcon = ({ className }) => <span className={className}>🔖</span>;
const BookmarkSolidIcon = ({ className }) => <span className={className}>⭐</span>;
const PencilIcon = ({ className }) => <span className={className}>✏️</span>;
const PlayIcon = ({ className }) => <span className={className}>▶️</span>;
const SearchIcon = ({ className }) => <span className={className}>🔍</span>;
const TagIcon = ({ className }) => <span className={className}>🏷️</span>;
const VideoIcon = ({ className }) => <span className={className}>🎬</span>;

export default function V3WorkspaceManager() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  
  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  
  // 편집 모달
  const [editingSentence, setEditingSentence] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('workspace');

  // 워크스페이스 목록 로드
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // URL 파라미터로 워크스페이스 선택
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === parseInt(workspaceId));
      if (workspace) {
        setSelectedWorkspace(workspace);
      }
    } else if (workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]);
    }
  }, [workspaceId, workspaces]);

  // 선택된 워크스페이스의 문장들 로드
  useEffect(() => {
    if (selectedWorkspace) {
      loadSentences();
    }
  }, [selectedWorkspace, searchTerm, filterCategory, showBookmarkedOnly]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/v3/workspace?includeStats=true');
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('워크스페이스 로드 오류:', error);
    }
  };

  const loadSentences = async () => {
    if (!selectedWorkspace) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (showBookmarkedOnly) params.append('bookmarked', 'true');
      
      const response = await fetch(`/api/v3/workspace/${selectedWorkspace.id}/sentences?${params}`);
      const data = await response.json();
      setSentences(data.sentences || []);
    } catch (error) {
      console.error('문장 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      const response = await fetch('/api/v3/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDesc,
          workspace_type: 'learning'
        })
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
        loadWorkspaces();
      }
    } catch (error) {
      console.error('워크스페이스 생성 오류:', error);
    }
  };

  const updateSentence = async (sentenceId, updates) => {
    try {
      const response = await fetch(`/api/v3/workspace/${selectedWorkspace.id}/sentences/${sentenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        loadSentences();
      }
    } catch (error) {
      console.error('문장 업데이트 오류:', error);
    }
  };

  const toggleBookmark = (sentence) => {
    updateSentence(sentence.id, { is_bookmarked: sentence.is_bookmarked ? 0 : 1 });
  };

  const startEditing = (sentence) => {
    setEditingSentence(sentence);
    setEditForm({
      korean_translation: sentence.korean_translation || '',
      notes: sentence.notes || '',
      category_name: sentence.category_name || '',
      tags: sentence.tags || [],
      difficulty_level: sentence.difficulty_level || 'intermediate'
    });
  };

  const saveEdit = async () => {
    if (!editingSentence) return;
    
    await updateSentence(editingSentence.id, editForm);
    setEditingSentence(null);
    setEditForm({});
  };

  const deleteSentence = async (sentenceId) => {
    if (!confirm('이 문장을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/v3/workspace/${selectedWorkspace.id}/sentences/${sentenceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadSentences();
      }
    } catch (error) {
      console.error('문장 삭제 오류:', error);
    }
  };

  // 카테고리 목록 추출
  const categories = [...new Set(sentences.map(s => s.category_name).filter(Boolean))];

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 - 항상 표시 */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>🎬</span>
              {selectedWorkspace ? selectedWorkspace.name : 'V3 데이터베이스 관리'}
            </h1>
            {selectedWorkspace && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {sentences.length}개 문장
              </span>
            )}
          </div>
          {selectedWorkspace && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                  showBookmarkedOnly 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🔖</span>
                북마크만
              </button>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 - 항상 표시 */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'workspace'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 워크스페이스
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🗄️ DB 스키마
          </button>
        </div>
        
        {/* 필터 및 검색 - 워크스페이스 탭이고 워크스페이스가 선택된 경우에만 표시 */}
        {activeTab === 'workspace' && selectedWorkspace && (
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="문장, 번역, 메모에서 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 카테고리</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'workspace' ? (
          <div className="p-6">
            {!selectedWorkspace ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-8xl mb-6 block">📁</span>
                <h2 className="text-2xl font-bold text-gray-500 mb-4">작업파일을 선택하세요</h2>
                <p className="text-gray-400 mb-6">왼쪽 사이드바에서 작업파일을 선택해주세요</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>로딩 중...</p>
              </div>
            ) : sentences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-6xl">🔍</span>
                <h3 className="text-xl font-medium mt-4 mb-2">문장이 없습니다</h3>
                <p className="text-gray-400">검색 결과에서 문장을 추가하거나 다른 작업파일을 선택해보세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentences.map(sentence => (
                  <div key={sentence.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 원문 */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl">💬</span>
                          <div className="flex-1">
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              "{sentence.sentence_text}"
                            </p>
                            
                            {/* 한글 번역 */}
                            {sentence.korean_translation && (
                              <p className="text-gray-600 mb-2 bg-gray-50 p-3 rounded">
                                {sentence.korean_translation}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* 메타 정보 */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <span>📁</span>
                            {sentence.source_file}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⏱️</span>
                            {sentence.start_time} - {sentence.end_time}
                          </span>
                          {sentence.category_name && (
                            <span className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                              <span>🏷️</span>
                              {sentence.category_name}
                            </span>
                          )}
                        </div>
                        
                        {/* 태그 */}
                        {sentence.tags && sentence.tags.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {sentence.tags.map((tag, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* 메모 */}
                        {sentence.notes && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <p className="text-gray-700 text-sm">
                              <span className="font-medium">메모:</span> {sentence.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleBookmark(sentence)}
                          className={`p-2 rounded transition-colors ${
                            sentence.is_bookmarked 
                              ? 'text-yellow-600 hover:bg-yellow-50 bg-yellow-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={sentence.is_bookmarked ? '북마크 제거' : '북마크 추가'}
                        >
                          <span className="text-lg">{sentence.is_bookmarked ? '⭐' : '🔖'}</span>
                        </button>
                        
                        <button
                          onClick={() => startEditing(sentence)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="편집"
                        >
                          <span className="text-lg">✏️</span>
                        </button>
                        
                        <button 
                          onClick={() => deleteSentence(sentence.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                        
                        <button 
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="재생"
                        >
                          <span className="text-lg">▶️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'schema' ? (
          <div className="p-6">
            <DatabaseSchemaViewer />
          </div>
        ) : null}
      </div>

      {/* 문장 편집 모달 */}
      {editingSentence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>✏️</span>
              문장 편집
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">원문</label>
                <div className="bg-gray-50 p-3 rounded border text-gray-900">
                  {editingSentence.sentence_text}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">한글 번역</label>
                <textarea
                  value={editForm.korean_translation}
                  onChange={(e) => setEditForm({...editForm, korean_translation: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                  placeholder="한글 번역을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모/해설</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="문법 설명, 사용법 등을 입력하세요"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <input
                    type="text"
                    value={editForm.category_name}
                    onChange={(e) => setEditForm({...editForm, category_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="카테고리 입력"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                  <select
                    value={editForm.difficulty_level}
                    onChange={(e) => setEditForm({...editForm, difficulty_level: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">초급</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSentence(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
