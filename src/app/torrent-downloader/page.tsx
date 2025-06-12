'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface DownloadInfo {
  id: string;
  torrentName: string;
  downloadPath: string;
  startTime: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  completedTime?: string;
  videoFiles?: string[];
  subtitleResults?: Array<{
    videoFile: string;
    success: boolean;
    subtitlePath?: string;
    error?: string;
  }>;
  organizedFiles?: string[];
}

export default function TorrentDownloader() {
  const [isDragging, setIsDragging] = useState(false);
  const [downloads, setDownloads] = useState<DownloadInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 다운로드 상태 주기적 업데이트
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/torrent/upload');
        if (response.ok) {
          const data = await response.json();
          setDownloads(data.downloads || []);
        }
      } catch (error) {
        console.error('다운로드 상태 업데이트 오류:', error);
      }
    }, 2000); // 2초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const torrentFiles = files.filter(file => file.name.endsWith('.torrent'));
    
    if (torrentFiles.length === 0) {
      alert('토렌트 파일(.torrent)만 업로드할 수 있습니다.');
      return;
    }

    for (const file of torrentFiles) {
      await uploadTorrent(file);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const torrentFiles = files.filter(file => file.name.endsWith('.torrent'));
    
    if (torrentFiles.length === 0) {
      alert('토렌트 파일(.torrent)만 업로드할 수 있습니다.');
      return;
    }

    for (const file of torrentFiles) {
      await uploadTorrent(file);
    }
    
    // 파일 입력 초기화
    e.target.value = '';
  }, []);

  const uploadTorrent = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('torrent', file);

      const response = await fetch('/api/torrent/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('토렌트 업로드 성공:', result);
        
        // 새 다운로드 추가
        const newDownload: DownloadInfo = {
          id: result.downloadId,
          torrentName: result.torrentName,
          downloadPath: result.downloadPath,
          startTime: new Date().toISOString(),
          status: 'downloading',
          progress: 0
        };
        
        setDownloads(prev => [newDownload, ...prev]);
        
        alert(`토렌트 다운로드가 시작되었습니다!\n파일: ${file.name}\n저장 위치: ${result.downloadPath}`);
      } else {
        const error = await response.json();
        alert(`토렌트 업로드 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('토렌트 업로드 오류:', error);
      alert('토렌트 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading': return '⬇️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'downloading': return '다운로드 중';
      case 'completed': return '완료';
      case 'error': return '오류';
      default: return '대기 중';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🌪️ 토렌트 다운로더</h1>
        
        {/* 업로드 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">토렌트 파일 업로드</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  토렌트 파일을 여기에 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  .torrent 파일만 지원됩니다
                </p>
              </div>
              
              <div>
                <input
                  type="file"
                  accept=".torrent"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="torrent-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="torrent-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {isUploading ? '업로드 중...' : '파일 선택'}
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>다운로드 경로:</strong> /mnt/qnap/torrent</p>
            <p><strong>정리 후 이동:</strong> /mnt/qnap/media_eng (Movies/TV/Anime)</p>
            <p><strong>자막:</strong> YIFY Subtitles에서 자동 다운로드</p>
          </div>
        </div>

        {/* 다운로드 목록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">다운로드 목록</h2>
          
          {downloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>진행 중인 다운로드가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {downloads.map((download) => (
                <div key={download.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getStatusIcon(download.status)}</span>
                      <span className="font-medium">{download.torrentName}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      download.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : download.status === 'downloading'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(download.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <p>시작: {new Date(download.startTime).toLocaleString()}</p>
                    {download.completedTime && (
                      <p>완료: {new Date(download.completedTime).toLocaleString()}</p>
                    )}
                    <p>저장 위치: {download.downloadPath}</p>
                  </div>
                  
                  {download.status === 'downloading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${download.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {download.status === 'completed' && download.videoFiles && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm">
                        <strong>비디오 파일:</strong> {download.videoFiles.length}개
                      </div>
                      {download.subtitleResults && (
                        <div className="text-sm">
                          <strong>자막:</strong> {download.subtitleResults.filter(r => r.success).length}개 성공, {download.subtitleResults.filter(r => !r.success).length}개 실패
                        </div>
                      )}
                      {download.organizedFiles && (
                        <div className="text-sm">
                          <strong>정리된 파일:</strong> {download.organizedFiles.length}개
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 