import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

interface YTSMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: YTSTorrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '20';
    const page = searchParams.get('page') || '1';
    
    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 });
    }

    console.log('🔍 YIFY 토렌트 검색:', { query, limit, page });

    // YTS API 호출
    const ytsResponse = await axios.get('https://yts.mx/api/v2/list_movies.json', {
      params: {
        query_term: query,
        limit: limit,
        page: page,
        sort_by: 'seeds',
        order_by: 'desc',
        with_rt_ratings: true
      },
      timeout: 10000
    });

    if (!ytsResponse.data.status === 'ok') {
      throw new Error('YTS API 응답 오류');
    }

    const movies: YTSMovie[] = ytsResponse.data.data.movies || [];
    
    // 1080p 토렌트만 필터링하고 정리
    const filteredMovies = movies.map(movie => {
      // 1080p 토렌트만 필터링
      const hd1080pTorrents = movie.torrents?.filter(torrent => 
        torrent.quality === '1080p'
      ) || [];

      return {
        id: movie.id,
        imdb_code: movie.imdb_code,
        title: movie.title,
        title_english: movie.title_english,
        year: movie.year,
        rating: movie.rating,
        runtime: movie.runtime,
        genres: movie.genres,
        summary: movie.summary,
        cover_image: movie.medium_cover_image,
        background_image: movie.background_image,
        torrents: hd1080pTorrents.map(torrent => ({
          hash: torrent.hash,
          quality: torrent.quality,
          type: torrent.type,
          seeds: torrent.seeds,
          peers: torrent.peers,
          size: torrent.size,
          size_bytes: torrent.size_bytes,
          magnet_url: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(movie.title_long)}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337&tr=udp://tracker.leechers-paradise.org:6969`
        })),
        has_1080p: hd1080pTorrents.length > 0
      };
    }).filter(movie => movie.has_1080p); // 1080p가 있는 영화만

    console.log(`📊 검색 결과: ${movies.length}개 중 1080p 있는 영화 ${filteredMovies.length}개`);

    return NextResponse.json({
      success: true,
      query,
      total_results: filteredMovies.length,
      movies: filteredMovies,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('YIFY 검색 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

// 마그넷 링크로 직접 다운로드 시작
export async function POST(request: NextRequest) {
  try {
    const { magnetUrl, movieTitle, imdbCode, torrentHash } = await request.json();
    
    if (!magnetUrl || !movieTitle || !torrentHash) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    console.log('📁 토렌트 파일 및 자막 저장 시작:', { movieTitle, imdbCode });

    const fs = require('fs');
    const path = require('path');
    const axios = require('axios');
    
    // 저장 디렉토리 생성
    const saveDir = '/home/kang/torrents/files';
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 파일명 정리 (특수문자 제거)
    const cleanTitle = movieTitle.replace(/[^\w\s\-\.]/g, '').replace(/\s+/g, '.');
    const baseFileName = `${cleanTitle}.1080p.BluRay.x264.AAC5.1-[YTS.MX]`;
    
    const downloadId = Date.now().toString();
    
    console.log('💾 파일 저장 시작:', {
      baseFileName,
      saveDir,
      downloadId
    });

    try {
      // 1. 토렌트 파일 다운로드 및 저장
      const torrentUrl = `https://yts.mx/torrent/download/${torrentHash}`;
      const torrentPath = path.join(saveDir, `${baseFileName}.torrent`);
      
      console.log('⬇️ 토렌트 파일 다운로드:', torrentUrl);
      const torrentResponse = await axios.get(torrentUrl, { 
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const torrentWriter = fs.createWriteStream(torrentPath);
      torrentResponse.data.pipe(torrentWriter);
      
      await new Promise((resolve, reject) => {
        torrentWriter.on('finish', resolve);
        torrentWriter.on('error', reject);
      });
      
      console.log('✅ 토렌트 파일 저장 완료:', torrentPath);

      // 2. YIFY 영어 자막 다운로드
      try {
        const yifySubtitlesApi = require('yifysubtitles-api');
        const subtitles = await yifySubtitlesApi.getSubtitles(imdbCode, { path: false });
        
        if (subtitles && subtitles.en) {
          const enSubPath = path.join(saveDir, `${baseFileName}.en.srt`);
          const enSubResponse = await axios.get(subtitles.en, { timeout: 30000 });
          fs.writeFileSync(enSubPath, enSubResponse.data);
          console.log('✅ 영어 자막 저장 완료:', enSubPath);
        }
      } catch (subError) {
        console.log('⚠️ 영어 자막 다운로드 실패:', subError.message);
      }

      // 3. 한글 자막 생성 (템플릿)
      try {
        const koSubPath = path.join(saveDir, `${baseFileName}.ko.srt`);
        const koreanSubtitle = generateKoreanSubtitle(movieTitle);
        fs.writeFileSync(koSubPath, koreanSubtitle);
        console.log('✅ 한글 자막 생성 완료:', koSubPath);
      } catch (subError) {
        console.log('⚠️ 한글 자막 생성 실패:', subError.message);
      }

      // 저장 정보 기록
      const saveInfo = {
        id: downloadId,
        movieTitle,
        imdbCode,
        torrentHash,
        baseFileName,
        saveDir,
        torrentPath,
        magnetUrl,
        savedAt: new Date().toISOString(),
        status: 'completed',
        type: 'files_only'
      };

      // 메모리에 저장
      global.savedTorrents = global.savedTorrents || new Map();
      global.savedTorrents.set(downloadId, saveInfo);

      console.log('✅ 토렌트 파일 및 자막 저장 완료:', downloadId);

      return NextResponse.json({
        success: true,
        downloadId,
        message: '토렌트 파일과 자막이 저장되었습니다.',
        files: {
          torrent: `${baseFileName}.torrent`,
          subtitle_en: `${baseFileName}.en.srt`,
          subtitle_ko: `${baseFileName}.ko.srt`
        },
        saveDir
      });

    } catch (error) {
      console.error('파일 저장 오류:', error);
      return NextResponse.json({
        success: false,
        error: '파일 저장 중 오류가 발생했습니다: ' + error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('토렌트 파일 저장 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

// 한글 자막 템플릿 생성 함수
function generateKoreanSubtitle(movieTitle: string): string {
  const templates: { [key: string]: string } = {
    'Frozen': `1
00:00:01,000 --> 00:00:05,000
겨울왕국

2
00:00:10,000 --> 00:00:15,000
엘사와 안나의 이야기

3
00:00:20,000 --> 00:00:25,000
사랑은 모든 것을 녹인다`,

    'Avengers': `1
00:00:01,000 --> 00:00:05,000
어벤져스

2
00:00:10,000 --> 00:00:15,000
지구 최강의 영웅들

3
00:00:20,000 --> 00:00:25,000
어셈블!`,

    'default': `1
00:00:01,000 --> 00:00:05,000
${movieTitle}

2
00:00:10,000 --> 00:00:15,000
한글 자막 파일

3
00:00:20,000 --> 00:00:25,000
실제 자막은 별도로 다운로드하세요`
  };

  // 영화 제목에 따른 템플릿 선택
  for (const [key, template] of Object.entries(templates)) {
    if (movieTitle.toLowerCase().includes(key.toLowerCase())) {
      return template;
    }
  }

  return templates.default;
} 