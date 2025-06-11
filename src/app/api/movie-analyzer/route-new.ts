import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');
const DB_PATH = path.join(projectRoot, 'learning_platform_v3.db');

export async function POST(request: NextRequest) {
  try {
    const { movieName, sampleSize = 50 } = await request.json();
    
    if (!movieName) {
      return NextResponse.json({ success: false, error: 'Movie name is required' }, { status: 400 });
    }

    const db = new Database(DB_PATH);
    
    // 영화 목록에서 series_name 확인
    const movie = db.prepare(`
      SELECT DISTINCT series_name, actual_title, COUNT(*) as subtitle_count
      FROM subtitles_v3 
      WHERE is_movie = 1 
      AND (series_name LIKE ? OR actual_title LIKE ?)
      GROUP BY series_name 
      ORDER BY subtitle_count DESC
      LIMIT 1
    `).get(`%${movieName}%`, `%${movieName}%`);

    if (!movie) {
      db.close();
      return NextResponse.json({ 
        success: false, 
        error: `Movie "${movieName}" not found in database` 
      }, { status: 404 });
    }

    db.close();

    try {
      // 영화 자막 분석기 로드
      const MovieSubtitleAnalyzer = require(path.join(process.cwd(), 'src/lib/movie_subtitle_analyzer.js'));
      const analyzer = new MovieSubtitleAnalyzer();

      // 영화 자막 분석 실행
      const results = await analyzer.analyzeMovieSubtitles(movie.series_name, parseInt(sampleSize.toString()));
      
      // 상위 문장들을 학습 DB에 자동 추가
      const addedCount = await analyzer.addBestSentencesToLearning(results, 20);
      results.addedToLearning = addedCount;
      
      analyzer.close();

      return NextResponse.json({ success: true, results });

    } catch (analysisError: any) {
      console.error('Movie analysis error:', analysisError);
      return NextResponse.json({ 
        success: false, 
        error: `영화 분석 중 오류 발생: ${analysisError.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Movie analysis API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = new Database(DB_PATH);
    
    // 영화 목록 조회
    const movies = db.prepare(`
      SELECT 
        series_name,
        actual_title,
        COUNT(*) as subtitle_count,
        AVG(LENGTH(text)) as avg_text_length,
        content_type,
        is_movie,
        is_animation
      FROM subtitles_v3 
      WHERE is_movie = 1 
      AND LENGTH(text) BETWEEN 5 AND 200
      GROUP BY series_name, actual_title
      HAVING subtitle_count > 100
      ORDER BY subtitle_count DESC
      LIMIT 20
    `).all();

    db.close();

    return NextResponse.json({ success: true, movies });

  } catch (error: any) {
    console.error('Movie list API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch movie list',
      details: error.message
    }, { status: 500 });
  }
}
