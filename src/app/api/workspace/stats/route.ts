import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 워크스페이스 통계 조회 시작');

    // 데이터베이스 연결
    const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
    const db = new Database(dbPath);

    // 총 문장 수
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM selected_sentences ss
      WHERE ss.is_active = 1
    `;
    const totalResult = db.prepare(totalQuery).get() as { total: number };
    const total_sentences = totalResult?.total || 0;

    // 시리즈별 통계
    const seriesQuery = `
      SELECT 
        s.series_name,
        COUNT(*) as count
      FROM selected_sentences ss
      JOIN subtitles_v3 s ON ss.subtitle_id = s.id
      WHERE ss.is_active = 1
      GROUP BY s.series_name
      ORDER BY count DESC
    `;
    const seriesResults = db.prepare(seriesQuery).all() as { series_name: string; count: number }[];
    const by_series: { [key: string]: number } = {};
    seriesResults.forEach(row => {
      by_series[row.series_name] = row.count;
    });

    // 우선순위별 통계
    const priorityQuery = `
      SELECT 
        ss.learning_priority,
        COUNT(*) as count
      FROM selected_sentences ss
      WHERE ss.is_active = 1
      GROUP BY ss.learning_priority
      ORDER BY ss.learning_priority DESC
    `;
    const priorityResults = db.prepare(priorityQuery).all() as { learning_priority: number; count: number }[];
    const by_priority: { [key: string]: number } = {};
    priorityResults.forEach(row => {
      by_priority[row.learning_priority.toString()] = row.count;
    });

    // 난이도별 통계 (subtitles_v3 테이블에서)
    const difficultyQuery = `
      SELECT 
        s.difficulty_level,
        COUNT(*) as count
      FROM selected_sentences ss
      JOIN subtitles_v3 s ON ss.subtitle_id = s.id
      WHERE ss.is_active = 1 AND s.difficulty_level IS NOT NULL
      GROUP BY s.difficulty_level
      ORDER BY count DESC
    `;
    const difficultyResults = db.prepare(difficultyQuery).all() as { difficulty_level: string; count: number }[];
    const by_difficulty: { [key: string]: number } = {};
    difficultyResults.forEach(row => {
      by_difficulty[row.difficulty_level] = row.count;
    });

    db.close();

    const stats = {
      total_sentences,
      by_series,
      by_priority,
      by_difficulty
    };

    console.log('✅ 워크스페이스 통계 조회 완료:', stats);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ 워크스페이스 통계 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '통계 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 