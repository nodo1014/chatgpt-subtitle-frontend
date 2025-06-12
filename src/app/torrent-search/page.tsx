'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Star, Clock, Users, HardDrive } from 'lucide-react';

interface Torrent {
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  magnet_url: string;
}

interface Movie {
  id: number;
  imdb_code: string;
  title: string;
  title_english: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  cover_image: string;
  background_image: string;
  torrents: Torrent[];
  has_1080p: boolean;
}

interface SearchResult {
  success: boolean;
  query: string;
  total_results: number;
  movies: Movie[];
  page: number;
  limit: number;
}

interface DownloadStatus {
  downloadId: string;
  movieTitle: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export default function TorrentSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [downloads, setDownloads] = useState<Map<string, DownloadStatus>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);

  // 검색 함수
  const handleSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/torrent/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data);
        setCurrentPage(page);
      } else {
        console.error('검색 실패:', data.error);
        setSearchResults({ 
          success: false, 
          query, 
          total_results: 0, 
          movies: [], 
          page: 1, 
          limit: 20 
        });
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults({ 
        success: false, 
        query, 
        total_results: 0, 
        movies: [], 
        page: 1, 
        limit: 20 
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 다운로드 시작
  const handleDownload = async (movie: Movie, torrent: Torrent) => {
    try {
      const response = await fetch('/api/torrent/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magnetUrl: torrent.magnet_url,
          movieTitle: movie.title_english || movie.title,
          imdbCode: movie.imdb_code,
          torrentHash: torrent.hash
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 파일 저장 상태 추가
        const newDownload: DownloadStatus = {
          downloadId: data.downloadId,
          movieTitle: movie.title_english || movie.title,
          status: 'completed',
          progress: 100,
          message: data.message
        };
        
        setDownloads(prev => new Map(prev.set(data.downloadId, newDownload)));
        
        // 토스트 알림 대신 상태 업데이트로 표시
        console.log(`📁 ${movie.title} (${movie.year}) 토렌트 파일 및 자막 저장 완료!`);
      } else {
        console.error('파일 저장 실패:', data.error);
        // 에러 상태를 저장 목록에 표시
        const errorDownload: DownloadStatus = {
          downloadId: Date.now().toString(),
          movieTitle: movie.title_english || movie.title,
          status: 'error',
          progress: 0,
          message: data.error
        };
        setDownloads(prev => new Map(prev.set(errorDownload.downloadId, errorDownload)));
      }
    } catch (error) {
      console.error('파일 저장 오류:', error);
      // 에러 상태를 저장 목록에 표시
      const errorDownload: DownloadStatus = {
        downloadId: Date.now().toString(),
        movieTitle: movie.title_english || movie.title,
        status: 'error',
        progress: 0,
        message: '파일 저장 중 오류가 발생했습니다.'
      };
      setDownloads(prev => new Map(prev.set(errorDownload.downloadId, errorDownload)));
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  // 런타임 포맷팅
  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const cardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    marginBottom: '16px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const badgeStyle = {
    display: 'inline-block',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    margin: '2px'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
          🎬 YIFY 토렌트 검색
        </h1>
        <p style={{ color: '#6b7280' }}>1080p 고화질 영화의 토렌트 파일과 자막을 저장하세요</p>
      </div>

      {/* 검색 바 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af',
                width: '16px',
                height: '16px'
              }} 
            />
            <input
              type="text"
              placeholder="영화 제목을 입력하세요... (예: Avengers, Frozen, Joker)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ ...inputStyle, paddingLeft: '40px' }}
            />
          </div>
          <button 
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
            style={{
              ...buttonStyle,
              opacity: (isSearching || !searchQuery.trim()) ? 0.5 : 1,
              cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSearching ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {/* 다운로드 상태 */}
      {downloads.size > 0 && (
        <div style={cardStyle}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Download style={{ width: '20px', height: '20px' }} />
            파일 저장 상황
          </h3>
          <div>
            {Array.from(downloads.values()).map((download) => (
              <div 
                key={download.downloadId} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{download.movieTitle}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{download.message}</div>
                </div>
                                 <span style={{
                   ...badgeStyle,
                   backgroundColor: download.status === 'downloading' ? '#3b82f6' : 
                                   download.status === 'error' ? '#ef4444' : '#10b981',
                   color: 'white'
                 }}>
                   {download.status === 'downloading' ? '저장 중' : 
                    download.status === 'error' ? '오류' : '저장 완료 (토렌트+자막)'}
                 </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {searchResults && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              "{searchResults.query}" 검색 결과 ({searchResults.total_results}개)
            </h2>
            {searchResults.total_results === 0 && (
              <p style={{ color: '#6b7280' }}>1080p 토렌트가 있는 영화를 찾을 수 없습니다.</p>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {searchResults.movies.map((movie) => (
              <div 
                key={movie.id} 
                style={{ 
                  ...cardStyle, 
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img
                    src={movie.cover_image}
                    alt={movie.title}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover',
                      borderRadius: '6px'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {movie.year}
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                    {movie.title}
                  </h3>
                  {movie.title_english && movie.title_english !== movie.title && (
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>{movie.title_english}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: '16px', height: '16px', fill: '#fbbf24', color: '#fbbf24' }} />
                    <span>{movie.rating}/10</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '16px', height: '16px' }} />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  {movie.genres.slice(0, 3).map((genre) => (
                    <span key={genre} style={badgeStyle}>
                      {genre}
                    </span>
                  ))}
                </div>

                <p style={{ 
                  fontSize: '14px', 
                  color: '#374151', 
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {movie.summary}
                </p>

                {/* 토렌트 정보 */}
                <div>
                  <h4 style={{ fontWeight: '500', fontSize: '14px', marginBottom: '8px' }}>
                    1080p 토렌트:
                  </h4>
                  {movie.torrents.map((torrent, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <span style={{ ...badgeStyle, backgroundColor: '#e5e7eb' }}>
                          {torrent.quality}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users style={{ width: '12px', height: '12px' }} />
                          <span>{torrent.seeds}↑/{torrent.peers}↓</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HardDrive style={{ width: '12px', height: '12px' }} />
                          <span>{torrent.size}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(movie, torrent)}
                        style={{
                          ...buttonStyle,
                          fontSize: '12px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download style={{ width: '12px', height: '12px' }} />
                        저장
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {searchResults.total_results > searchResults.limit && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px', 
              marginTop: '32px' 
            }}>
              <button
                onClick={() => handleSearch(searchQuery, currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  ...buttonStyle,
                  backgroundColor: currentPage <= 1 ? '#e5e7eb' : '#3b82f6',
                  color: currentPage <= 1 ? '#9ca3af' : 'white',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                이전
              </button>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 16px',
                fontSize: '14px'
              }}>
                페이지 {currentPage}
              </span>
              <button
                onClick={() => handleSearch(searchQuery, currentPage + 1)}
                disabled={searchResults.movies.length < searchResults.limit}
                style={{
                  ...buttonStyle,
                  backgroundColor: searchResults.movies.length < searchResults.limit ? '#e5e7eb' : '#3b82f6',
                  color: searchResults.movies.length < searchResults.limit ? '#9ca3af' : 'white',
                  cursor: searchResults.movies.length < searchResults.limit ? 'not-allowed' : 'pointer'
                }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 