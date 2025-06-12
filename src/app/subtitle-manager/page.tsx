'use client';

import React, { useState, useEffect } from 'react';

interface MediaFile {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  hasSubtitle: boolean;
  extension?: string;
}

interface DownloadTask {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'downloading' | 'syncing' | 'completed' | 'failed';
  progress: number;
  attempts: number;
  error?: string;
}

export default function SubtitleManager() {
  const [currentPath, setCurrentPath] = useState('/mnt/qnap/media_eng');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>(['/mnt/qnap/media_eng']);

  // 디렉토리 내용 로드
  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/subtitle-manager/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      
      const data = await response.json();
      if (data.success) {
        setMediaFiles(data.files);
        setCurrentPath(path);
      } else {
        alert('디렉토리 로드 실패: ' + data.error);
      }
    } catch (error) {
      console.error('디렉토리 로드 오류:', error);
      alert('디렉토리 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  // 디렉토리 이동
  const navigateToDirectory = (path: string) => {
    setPathHistory(prev => [...prev, currentPath]);
    loadDirectory(path);
  };

  // 뒤로 가기
  const goBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      const previousPath = newHistory.pop()!;
      setPathHistory(newHistory);
      loadDirectory(newHistory[newHistory.length - 1] || '/mnt/qnap/media_eng');
    }
  };

  // 파일 선택/해제
  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  // 자막 다운로드 시작
  const startDownload = async () => {
    if (selectedFiles.size === 0) {
      alert('다운로드할 파일을 선택해주세요.');
      return;
    }

    const newTasks: DownloadTask[] = Array.from(selectedFiles).map(filePath => ({
      id: Date.now() + Math.random().toString(),
      filePath,
      fileName: filePath.split('/').pop() || '',
      status: 'pending',
      progress: 0,
      attempts: 0
    }));

    setDownloadTasks(prev => [...prev, ...newTasks]);
    setSelectedFiles(new Set());

    // 각 파일에 대해 다운로드 시작
    for (const task of newTasks) {
      processDownloadTask(task.id);
    }
  };

  // 다운로드 작업 처리
  const processDownloadTask = async (taskId: string) => {
    const updateTask = (updates: Partial<DownloadTask>) => {
      setDownloadTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    };

    const task = downloadTasks.find(t => t.id === taskId);
    if (!task) return;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      updateTask({ status: 'downloading', attempts, progress: 0 });

      try {
        // 자막 다운로드 API 호출
        const response = await fetch('/api/subtitle-manager/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: task.filePath })
        });

        const data = await response.json();
        
        if (data.success) {
          updateTask({ status: 'syncing', progress: 50 });
          
          // Whisper 싱크 검증 API 호출
          const syncResponse = await fetch('/api/subtitle-manager/verify-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              videoPath: task.filePath,
              subtitlePath: data.subtitlePath 
            })
          });

          const syncData = await syncResponse.json();
          
          if (syncData.success && syncData.isSync) {
            updateTask({ status: 'completed', progress: 100 });
            break; // 성공하면 루프 종료
          } else {
            throw new Error(syncData.error || '싱크 검증 실패');
          }
        } else {
          throw new Error(data.error || '다운로드 실패');
        }
      } catch (error) {
        console.error(`다운로드 시도 ${attempts} 실패:`, error);
        
        if (attempts >= maxAttempts) {
          updateTask({ 
            status: 'failed', 
            progress: 0,
            error: `${maxAttempts}번 시도 후 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
          });
        } else {
          // 재시도 전 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 상태별 색상
  const getStatusColor = (status: DownloadTask['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'downloading': return 'text-blue-500';
      case 'syncing': return 'text-yellow-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📝 자막 관리</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 파일 브라우저 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">📁 파일 브라우저</h2>
                <button
                  onClick={goBack}
                  disabled={pathHistory.length <= 1}
                  className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
                >
                  ← 뒤로
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                현재 경로: {currentPath}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => loadDirectory(currentPath)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  🔄 새로고침
                </button>
                
                <button
                  onClick={startDownload}
                  disabled={selectedFiles.size === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  📥 선택된 파일 다운로드 ({selectedFiles.size})
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        file.isDirectory 
                          ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100' 
                          : file.hasSubtitle
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100'
                      }`}
                      onClick={() => {
                        if (file.isDirectory) {
                          navigateToDirectory(file.path);
                        } else if (!file.hasSubtitle) {
                          toggleFileSelection(file.path);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.path)}
                          onChange={() => toggleFileSelection(file.path)}
                          disabled={file.isDirectory || file.hasSubtitle}
                          className="w-4 h-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <span className="text-lg">
                          {file.isDirectory ? '📁' : file.hasSubtitle ? '🎬✅' : '🎬❌'}
                        </span>
                        
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-500">
                            {file.isDirectory ? '디렉토리' : 
                             file.hasSubtitle ? `${formatFileSize(file.size)} (자막 있음)` :
                             `${formatFileSize(file.size)} (자막 없음)`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {mediaFiles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      파일이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 다운로드 작업 목록 */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">📥 다운로드 작업</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {downloadTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="font-medium text-sm truncate" title={task.fileName}>
                      {task.fileName}
                    </div>
                    
                    <div className={`text-sm ${getStatusColor(task.status)} mt-1`}>
                      {task.status === 'pending' && '대기 중'}
                      {task.status === 'downloading' && '다운로드 중'}
                      {task.status === 'syncing' && 'Whisper 싱크 검증 중'}
                      {task.status === 'completed' && '완료'}
                      {task.status === 'failed' && '실패'}
                      {task.attempts > 0 && ` (${task.attempts}/3)`}
                    </div>
                    
                    {task.progress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    )}
                    
                    {task.error && (
                      <div className="text-xs text-red-500 mt-1 break-words">
                        {task.error}
                      </div>
                    )}
                  </div>
                ))}
                
                {downloadTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    다운로드 작업이 없습니다.
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