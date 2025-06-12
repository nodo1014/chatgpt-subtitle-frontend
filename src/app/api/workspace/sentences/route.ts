import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const series = searchParams.get('series');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    console.log('📚 워크스페이스 문장 조회:', { limit, offset, series, priority, search });

    // 데이터베이스 연결
    const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
    const db = new Database(dbPath);

    // 기본 쿼리
    let query = `
      SELECT 
        ss.id,
        ss.subtitle_id,
        ss.ai_translation,
        ss.ai_explanation,
        ss.explanation_line1,
        ss.explanation_line2,
        ss.explanation_line3,
        ss.pronunciation_guide,
        ss.pronunciation_notes,
        ss.learning_priority,
        ss.selection_reason,
        ss.created_at,
        ss.is_active,
        s.text,
        s.series_name,
        s.episode_title,
        s.start_time,
        s.end_time,
        s.media_file
      FROM selected_sentences ss
      JOIN subtitles_v3 s ON ss.subtitle_id = s.id
      WHERE ss.is_active = 1
    `;

    const params: any[] = [];

    // 필터 조건 추가
    if (series) {
      query += ` AND s.series_name = ?`;
      params.push(series);
    }

    if (priority) {
      query += ` AND ss.learning_priority = ?`;
      params.push(parseInt(priority));
    }

    if (search) {
      query += ` AND (s.text LIKE ? OR ss.ai_translation LIKE ? OR s.series_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 정렬 및 페이징
    query += ` ORDER BY ss.learning_priority DESC, ss.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('🔍 실행할 쿼리:', query);
    console.log('📝 쿼리 파라미터:', params);

    const sentences = db.prepare(query).all(...params);

    // 총 개수 조회
    let countQuery = `
      SELECT COUNT(*) as total
      FROM selected_sentences ss
      JOIN subtitles_v3 s ON ss.subtitle_id = s.id
      WHERE ss.is_active = 1
    `;

    const countParams: any[] = [];
    if (series) {
      countQuery += ` AND s.series_name = ?`;
      countParams.push(series);
    }
    if (priority) {
      countQuery += ` AND ss.learning_priority = ?`;
      countParams.push(parseInt(priority));
    }
    if (search) {
      countQuery += ` AND (s.text LIKE ? OR ss.ai_translation LIKE ? OR s.series_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };
    const total = totalResult?.total || 0;

    db.close();

    console.log(`✅ 워크스페이스 문장 조회 완료: ${sentences.length}개 (총 ${total}개)`);

    return NextResponse.json({
      success: true,
      sentences,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + sentences.length < total
      }
    });

  } catch (error) {
    console.error('❌ 워크스페이스 문장 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '문장 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 