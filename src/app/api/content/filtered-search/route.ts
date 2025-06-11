import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

interface FilteredSearchRequest {
  text?: string;
  categoryId?: number;
  seriesId?: number;
  maxClips?: number;
  minClipScore?: number;
  sortBy?: 'score' | 'duration' | 'popularity';
}

export async function POST(request: NextRequest) {
  let db: Database.Database | null = null;
  
  try {
    const body: FilteredSearchRequest = await request.json();
    const { 
      text = '', 
      categoryId, 
      seriesId, 
      maxClips = 50,
      minClipScore = 0,
      sortBy = 'score'
    } = body;

    console.log('🔍 카테고리별 필터링 검색 요청:', body);

    // 먼저 컨텐츠 데이터베이스에서 카테고리 정보 조회
    const contentDbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
    db = new Database(contentDbPath);

    let categoryName = '';
    let seriesName = '';

    // 카테고리별 필터링 조건 구성
    let whereConditions: string[] = ['1=1'];
    let queryParams: any[] = [];

    // 텍스트 검색 추가
    if (text && text.trim()) {
      whereConditions.push('text LIKE ?');
      queryParams.push(`%${text.trim()}%`);
    }

    // 카테고리별 필터링
    if (categoryId) {
      // 카테고리 정보 조회 (컨텐츠 제작 DB에서)
      try {
        const categoryQuery = `
          SELECT id, name, description, keywords 
          FROM content_categories 
          WHERE id = ?
        `;
        const categoryResult = db.prepare(categoryQuery).get(categoryId) as any;
        
        if (categoryResult) {
          categoryName = categoryResult.name;
          console.log('📂 카테고리 정보:', categoryResult);
          
          // 카테고리별 추가 필터링
          switch (categoryId) {
            case 1: // 비즈니스 영어
              whereConditions.push(`(
                text LIKE '%business%' OR 
                text LIKE '%work%' OR 
                text LIKE '%meeting%' OR
                text LIKE '%office%' OR
                text LIKE '%professional%'
              )`);
              break;
            case 2: // 여행 영어
              whereConditions.push(`(
                text LIKE '%travel%' OR 
                text LIKE '%trip%' OR 
                text LIKE '%vacation%' OR
                text LIKE '%hotel%' OR
                text LIKE '%airport%'
              )`);
              break;
            case 3: // 일상 대화
              whereConditions.push(`(
                text LIKE '%hello%' OR 
                text LIKE '%how are you%' OR 
                text LIKE '%good morning%' OR
                text LIKE '%thank you%' OR
                text LIKE '%please%'
              )`);
              break;
            case 4: // 감정 표현
              whereConditions.push(`(
                text LIKE '%love%' OR 
                text LIKE '%happy%' OR 
                text LIKE '%sad%' OR
                text LIKE '%angry%' OR
                text LIKE '%excited%'
              )`);
              break;
            case 5: // 프렌즈 시리즈
              whereConditions.push(`media_file LIKE '%friends%'`);
              break;
            case 6: // 디즈니 애니메이션
              whereConditions.push(`media_file LIKE '%disney%'`);
              break;
          }
        }
      } catch (error) {
        console.log('카테고리 조회 실패 (기본 필터링 사용):', error);
        categoryName = `카테고리 ${categoryId}`;
      }
    }

    // 시리즈별 필터링
    if (seriesId) {
      try {
        const seriesQuery = `
          SELECT ys.*, scm.clip_selection_criteria 
          FROM youtube_series ys
          LEFT JOIN series_clip_mappings scm ON ys.id = scm.series_id
          WHERE ys.id = ?
        `;
        const seriesResult = db.prepare(seriesQuery).get(seriesId) as any;
        
        if (seriesResult) {
          seriesName = seriesResult.title;
          console.log('🎥 시리즈 정보:', seriesResult);
        }
      } catch (error) {
        console.log('시리즈 조회 실패 (무시):', error);
      }
    }

    // 기본 검색 쿼리 구성
    let query = `
      SELECT 
        text as subtitle_text,
        media_file,
        start_time,
        end_time,
        CASE 
          WHEN media_file LIKE '%friends%' THEN 'Friends'
          WHEN media_file LIKE '%disney%' THEN 'Disney'
          ELSE 'Other'
        END as source_series,
        0.8 as score,
        CAST((
          CAST(substr(end_time, 1, instr(end_time, ':') - 1) AS INTEGER) * 3600 +
          CAST(substr(end_time, instr(end_time, ':') + 1, instr(end_time, '.') - instr(end_time, ':') - 1) AS INTEGER) * 60 +
          CAST(substr(end_time, instr(end_time, '.') - 2, 2) AS INTEGER)
        ) - (
          CAST(substr(start_time, 1, instr(start_time, ':') - 1) AS INTEGER) * 3600 +
          CAST(substr(start_time, instr(start_time, ':') + 1, instr(start_time, '.') - instr(start_time, ':') - 1) AS INTEGER) * 60 +
          CAST(substr(start_time, instr(start_time, '.') - 2, 2) AS INTEGER)
        ) AS REAL) as duration
      FROM subtitles
      WHERE ${whereConditions.join(' AND ')}
        AND language = 'en'
        AND length(text) > 10
    `;

    // 정렬 추가
    switch (sortBy) {
      case 'duration':
        query += ` ORDER BY duration DESC`;
        break;
      case 'popularity':
        query += ` ORDER BY length(text) ASC, media_file`;
        break;
      case 'score':
      default:
        query += ` ORDER BY length(text) ASC`;
        break;
    }

    // 최대 클립 수 제한
    query += ` LIMIT ?`;
    queryParams.push(maxClips);

    console.log('🔍 실행할 쿼리:', query);
    console.log('🔍 쿼리 파라미터:', queryParams);

    const results = db.prepare(query).all(...queryParams);

    // 메타데이터 계산
    const totalClips = results.length;
    const averageScore = totalClips > 0 
      ? results.reduce((sum: number, row: any) => sum + (row.score || 0), 0) / totalClips 
      : 0;
    const estimatedDuration = results.reduce((sum: number, row: any) => sum + (row.duration || 0), 0);

    const response = {
      success: true,
      results: results.map((row: any) => ({
        subtitle_text: row.subtitle_text,
        media_file: row.media_file,
        start_time: row.start_time,
        end_time: row.end_time,
        duration: row.duration,
        score: row.score,
        source_series: row.source_series
      })),
      metadata: {
        categoryName,
        seriesName,
        totalClips,
        averageScore: Math.round(averageScore * 100) / 100,
        estimatedDuration: Math.round(estimatedDuration * 100) / 100
      },
      query_info: {
        text,
        categoryId,
        seriesId,
        maxClips,
        minClipScore,
        sortBy
      }
    };

    console.log('✅ 필터링된 검색 결과:', {
      totalClips,
      categoryName,
      seriesName,
      averageScore: response.metadata.averageScore
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 카테고리별 필터링 검색 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
        metadata: {
          categoryName: '',
          seriesName: '',
          totalClips: 0,
          averageScore: 0,
          estimatedDuration: 0
        }
      }, 
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}
