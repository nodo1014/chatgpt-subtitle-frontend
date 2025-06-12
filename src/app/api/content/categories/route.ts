// 컨텐츠 카테고리 API
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');

export async function GET() {
  try {
    const db = new Database(dbPath);
    
    // 모든 컨텐츠 카테고리 조회
    const categories = db.prepare(`
      SELECT 
        id,
        name,
        description,
        icon,
        category_type,
        filter_conditions,
        target_audience,
        estimated_clips,
        is_active,
        sort_order
      FROM content_categories 
      WHERE is_active = 1
      ORDER BY sort_order, name
    `).all();
    
    // JSON 필드 파싱
    const parsedCategories = categories.map((cat: any) => ({
      ...cat,
      filter_conditions: JSON.parse(cat.filter_conditions || '{}'),
      is_active: Boolean(cat.is_active)
    }));
    
    db.close();
    
    return NextResponse.json({
      success: true,
      categories: parsedCategories,
      count: parsedCategories.length
    });
    
  } catch (error) {
    console.error('컨텐츠 카테고리 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      icon, 
      category_type, 
      filter_conditions, 
      target_audience,
      estimated_clips = 0,
      sort_order = 0
    } = body;
    
    if (!name || !category_type || !filter_conditions) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      INSERT INTO content_categories (
        name, description, icon, category_type, filter_conditions,
        target_audience, estimated_clips, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, 
      description, 
      icon, 
      category_type, 
      JSON.stringify(filter_conditions),
      target_audience,
      estimated_clips,
      sort_order
    );
    
    db.close();
    
    return NextResponse.json({
      success: true,
      categoryId: result.lastInsertRowid,
      message: '카테고리가 성공적으로 생성되었습니다.'
    });
    
  } catch (error) {
    console.error('컨텐츠 카테고리 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
