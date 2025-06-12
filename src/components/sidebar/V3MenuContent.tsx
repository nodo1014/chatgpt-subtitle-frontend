'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Workspace {
  id: number;
  name: string;
  description?: string;
  sentence_count?: number;
  bookmarked_count?: number;
  created_at: string;
  updated_at: string;
}

export default function V3MenuContent() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // 새 작업파일 생성 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // v3 작업파일 로드
  const loadWorkspaces = async () => {
    setWorkspaceLoading(true);
    try {
      const response = await fetch('/api/v3/workspace?includeStats=true');
      const data = await response.json();
      
      if (data.workspaces) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error('작업파일 로드 실패:', error);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // 새 작업파일 생성
  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/v3/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          description: newWorkspaceDesc.trim(),
          workspace_type: 'learning'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setShowCreateModal(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
        
        if (data.workspace) {
          setWorkspaces(prev => [data.workspace, ...prev]);
          setSelectedWorkspace(data.workspace);
          router.push(`/v3?workspace=${data.workspace.id}`);
        } else {
          loadWorkspaces();
        }
      } else {
        const errorData = await response.json();
        alert(`작업파일 생성 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('작업파일 생성 실패:', error);
      alert(`작업파일 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setCreating(false);
    }
  };

  // 작업파일 선택
  const handleWorkspaceClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    router.push(`/v3?workspace=${workspace.id}`);
  };

  // 작업파일 이름 변경 시작
  const startEditWorkspace = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorkspace(workspace);
    setEditName(workspace.name);
  };

  // 작업파일 이름 변경 저장
  const saveWorkspaceName = async () => {
    if (!editingWorkspace || !editName.trim()) return;
    
    try {
      const response = await fetch(`/api/v3/workspace/${editingWorkspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      });
      
      if (response.ok) {
        setWorkspaces(prev => prev.map(w => 
          w.id === editingWorkspace.id 
            ? { ...w, name: editName.trim() }
            : w
        ));
        setEditingWorkspace(null);
        setEditName('');
      }
    } catch (error) {
      console.error('작업파일 이름 변경 실패:', error);
    }
  };

  // 작업파일 삭제
  const deleteWorkspace = async (workspaceId: number) => {
    try {
      const response = await fetch(`/api/v3/workspace/${workspaceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
        setShowDeleteConfirm(null);
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(null);
        }
      }
    } catch (error) {
      console.error('작업파일 삭제 실패:', error);
    }
  };

  // 검색 필터링
  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    (workspace.description && workspace.description.toLowerCase().includes(workspaceSearch.toLowerCase()))
  );

  return (
    <div>
      <div className="p-4 border-b border-[#2d2d2d]">
        <h2 className="text-lg font-semibold text-white mb-2">v3 DB 관리</h2>
        <p className="text-xs text-[#8e8ea0]">작업파일명 기반 자막 관리 시스템</p>
      </div>
      
      <div className="p-4 overflow-y-auto">
        {/* 빠른 액션 */}
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">빠른 시작</h3>
          <button 
            onClick={() => router.push('/v3')}
            className="w-full bg-[#0e639c] text-white p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm hover:bg-[#1177bb] mb-2"
          >
            <span>🚀</span>
            <span>v3 DB 관리 툴</span>
          </button>
        </div>

        {/* 작업파일 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide font-semibold">작업파일 목록</h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-[#0e639c] hover:text-[#1177bb] transition-colors"
              title="새 작업파일 만들기"
            >
              ➕
            </button>
          </div>
          
          {/* 검색창 */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="작업파일 검색..."
              value={workspaceSearch}
              onChange={(e) => setWorkspaceSearch(e.target.value)}
              className="w-full bg-[#2d2d2d] text-white px-3 py-2 rounded text-xs border border-[#404040] focus:border-[#0e639c] focus:outline-none"
            />
            {workspaceSearch && (
              <button
                onClick={() => setWorkspaceSearch('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#8e8ea0] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 작업파일 목록 */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {workspaceLoading ? (
              <div className="p-2.5 text-sm text-[#8e8ea0] text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0e639c] mx-auto mb-2"></div>
                로딩 중...
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="p-2.5 text-sm text-[#8e8ea0] text-center">
                {workspaceSearch ? '검색 결과가 없습니다' : '작업파일이 없습니다'}
              </div>
            ) : (
              filteredWorkspaces.map(workspace => (
                <div
                  key={workspace.id}
                  className={`group relative p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight hover:bg-[#2d2d2d] ${
                    selectedWorkspace?.id === workspace.id ? 'bg-[#0e639c] text-white' : 'text-[#e5e5e5]'
                  }`}
                  onClick={() => handleWorkspaceClick(workspace)}
                >
                  <div className="flex items-center gap-2">
                    <span>📁</span>
                    {editingWorkspace?.id === workspace.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveWorkspaceName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveWorkspaceName();
                          if (e.key === 'Escape') {
                            setEditingWorkspace(null);
                            setEditName('');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs border border-[#404040] focus:border-[#0e639c] focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 truncate">{workspace.name}</span>
                    )}
                    
                    {/* 액션 버튼들 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => startEditWorkspace(workspace, e)}
                        className="text-xs text-[#8e8ea0] hover:text-white p-1"
                        title="이름 변경"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(workspace.id);
                        }}
                        className="text-xs text-[#8e8ea0] hover:text-red-400 p-1"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {/* 통계 정보 */}
                  <div className="flex items-center gap-3 mt-1 text-xs opacity-75">
                    <span>📝 {workspace.sentence_count || 0}</span>
                    <span>⭐ {workspace.bookmarked_count || 0}</span>
                  </div>
                  
                  {workspace.description && (
                    <div className="text-xs opacity-60 mt-1 line-clamp-2">
                      {workspace.description}
                    </div>
                  )}

                  {/* 삭제 확인 모달 */}
                  {showDeleteConfirm === workspace.id && (
                    <div 
                      className="absolute inset-0 bg-red-900/90 rounded-lg flex flex-col items-center justify-center z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs text-white text-center mb-2">
                        정말 삭제하시겠습니까?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWorkspace(workspace.id);
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          삭제
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(null);
                          }}
                          className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* v3 주요 기능 */}
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">주요 기능</h3>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/v3')}
              className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>🔖</span>
              <span>북마크 관리</span>
            </button>
            <button 
              onClick={() => router.push('/v3')}
              className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>🏷️</span>
              <span>태그 & 카테고리</span>
            </button>
            <button 
              onClick={() => router.push('/v3')}
              className="w-full text-left p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm leading-tight text-[#e5e5e5] hover:bg-[#2d2d2d] flex items-center gap-2"
            >
              <span>🌐</span>
              <span>번역 관리</span>
            </button>
          </div>
        </div>

        {/* v3.md 기능 */}
        <div className="mb-6">
          <h3 className="text-xs text-[#8e8ea0] uppercase tracking-wide mb-3 font-semibold">v3.md 기획</h3>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-[#2d2d2d] text-sm leading-tight text-[#e5e5e5] flex items-center gap-2">
              <span>✅</span>
              <span>3-1 자막 관리 툴</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#1a1a1a] text-sm leading-tight text-[#8e8ea0] flex items-center gap-2">
              <span>🔄</span>
              <span>3-2 영상 편집 (예정)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 새 작업파일 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <span>➕</span>
              새 작업파일 만들기
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  작업파일명 *
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="예: Friends 시즌1, 비즈니스 영어"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={creating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  설명
                </label>
                <textarea
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="작업파일에 대한 설명을 입력하세요"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 text-gray-900"
                  disabled={creating}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                  setNewWorkspaceDesc('');
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-800 font-medium"
                disabled={creating}
              >
                취소
              </button>
              <button
                onClick={createWorkspace}
                disabled={!newWorkspaceName.trim() || creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="font-medium">생성 중...</span>
                  </>
                ) : (
                  <span className="font-medium">생성</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 