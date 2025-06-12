// 유튜브 시리즈 API
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');

export async function GET() {
  try {
    const db = new Database(dbPath);
    
    // 모든 유튜브 시리즈 조회 (카테고리 정보 포함)
    const series = db.prepare(`
      SELECT 
        ys.id,
        ys.series_name,
        ys.series_description,
        ys.thumbnail_url,
        ys.target_episode_count,
        ys.current_episode_count,
        ys.status,
        ys.upload_schedule,
        ys.estimated_views,
        ys.target_duration,
        ys.is_active,
        ys.sort_order,
        cc.name as category_name,
        cc.icon as category_icon,
        cc.category_type
      FROM youtube_series ys
      LEFT JOIN content_categories cc ON ys.category_id = cc.id
      WHERE ys.is_active = 1
      ORDER BY ys.sort_order, ys.series_name
    `).all();
    
    // 각 시리즈의 클립 수 계산
    const seriesWithStats = series.map((s: any) => {
      const clipCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM series_clip_mappings 
        WHERE series_id = ?
      `).get(s.id) as any;
      
      return {
        ...s,
        is_active: Boolean(s.is_active),
        clip_count: clipCount?.count || 0,
        progress: s.target_episode_count > 0 
          ? Math.round((s.current_episode_count / s.target_episode_count) * 100)
          : 0
      };
    });
    
    db.close();
    
    return NextResponse.json({
      success: true,
      series: seriesWithStats,
      count: seriesWithStats.length
    });
    
  } catch (error) {
    console.error('유튜브 시리즈 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '시리즈 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      series_name,
      series_description,
      thumbnail_url,
      target_episode_count = 10,
      category_id,
      status = 'planning',
      upload_schedule = 'weekly',
      estimated_views = 0,
      target_duration = 600,
      sort_order = 0
    } = body;
    
    if (!series_name) {
      return NextResponse.json(
        { success: false, error: '시리즈 이름은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      INSERT INTO youtube_series (
        series_name, series_description, thumbnail_url, target_episode_count,
        category_id, status, upload_schedule, estimated_views, target_duration, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      series_name,
      series_description,
      thumbnail_url,
      target_episode_count,
      category_id,
      status,
      upload_schedule,
      estimated_views,
      target_duration,
      sort_order
    );
    
    db.close();
    
    return NextResponse.json({
      success: true,
      seriesId: result.lastInsertRowid,
      message: '시리즈가 성공적으로 생성되었습니다.'
    });
    
  } catch (error) {
    console.error('유튜브 시리즈 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '시리즈 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
