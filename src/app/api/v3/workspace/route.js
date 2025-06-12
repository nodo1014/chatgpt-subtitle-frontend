// v3 DB 관리 툴 - 워크스페이스 API
// /api/v3/workspace 관련 API 엔드포인트

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// 데이터베이스 연결
function getDB() {
  const dbPath = path.join(process.cwd(), 'public', 'clips.db');
  return new Database(dbPath);
}

// GET /api/v3/workspace - 모든 워크스페이스 조회
export async function GET(request) {
  const db = getDB();
  
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    
    let query = `
      SELECT w.*, 
             COUNT(ws.id) as sentence_count,
             COUNT(CASE WHEN ws.is_bookmarked = 1 THEN 1 END) as bookmarked_count
      FROM workspaces w
      LEFT JOIN workspace_sentences ws ON w.id = ws.workspace_id
      WHERE w.is_active = 1
      GROUP BY w.id
      ORDER BY w.updated_at DESC
    `;
    
    const workspaces = db.prepare(query).all();
    
    // settings JSON 파싱
    const result = workspaces.map(workspace => ({
      ...workspace,
      settings: workspace.settings ? JSON.parse(workspace.settings) : {},
      sentence_count: workspace.sentence_count || 0,
      bookmarked_count: workspace.bookmarked_count || 0
    }));
    
    return NextResponse.json({ success: true, workspaces: result });
  } catch (error) {
    console.error('워크스페이스 조회 오류:', error);
    return NextResponse.json({ error: '워크스페이스 조회 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}

// POST /api/v3/workspace - 새 워크스페이스 생성
export async function POST(request) {
  const db = getDB();
  
  try {
    const { name, description, workspace_type = 'learning', settings = {} } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: '작업명은 필수입니다' }, { status: 400 });
    }
    
    const insertWorkspace = db.prepare(`
      INSERT INTO workspaces (name, description, workspace_type, settings)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertWorkspace.run(
      name,
      description || '',
      workspace_type,
      JSON.stringify(settings)
    );
    
    // 기본 북마크 컬렉션 생성
    const insertBookmarkCollection = db.prepare(`
      INSERT INTO bookmark_collections (workspace_id, collection_name, description, color)
      VALUES (?, ?, ?, ?)
    `);
    
    insertBookmarkCollection.run(
      result.lastInsertRowid,
      '즐겨찾기',
      `${name} 주요 문장`,
      '#F59E0B'
    );
    
    // 생성된 워크스페이스 정보 조회
    const getWorkspace = db.prepare(`
      SELECT w.*, 
             COUNT(ws.id) as sentence_count,
             COUNT(CASE WHEN ws.is_bookmarked = 1 THEN 1 END) as bookmarked_count
      FROM workspaces w
      LEFT JOIN workspace_sentences ws ON w.id = ws.workspace_id
      WHERE w.id = ?
      GROUP BY w.id
    `);
    
    const workspace = getWorkspace.get(result.lastInsertRowid);
    
    return NextResponse.json({ 
      workspace: {
        ...workspace,
        settings: workspace.settings ? JSON.parse(workspace.settings) : {},
        sentence_count: workspace.sentence_count || 0,
        bookmarked_count: workspace.bookmarked_count || 0
      },
      message: '워크스페이스가 생성되었습니다' 
    });
    
  } catch (error) {
    console.error('워크스페이스 생성 오류:', error);
    return NextResponse.json({ error: '워크스페이스 생성 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}
