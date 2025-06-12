// 워크스페이스 문장 관리 API
// /api/v3/workspace/[id]/sentences

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDB() {
  const dbPath = path.join(process.cwd(), 'public', 'clips.db');
  return new Database(dbPath);
}

// GET /api/v3/workspace/[id]/sentences - 워크스페이스의 문장들 조회
export async function GET(request, { params }) {
  const db = getDB();
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const bookmarked = searchParams.get('bookmarked');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    let whereConditions = ['ws.workspace_id = ?'];
    let params_array = [id];
    
    if (category) {
      whereConditions.push('ws.category_name = ?');
      params_array.push(category);
    }
    
    if (bookmarked === 'true') {
      whereConditions.push('ws.is_bookmarked = 1');
    }
    
    if (search) {
      whereConditions.push('(ws.sentence_text LIKE ? OR ws.korean_translation LIKE ? OR ws.notes LIKE ?)');
      const searchTerm = `%${search}%`;
      params_array.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const query = `
      SELECT ws.*, w.name as workspace_name
      FROM workspace_sentences ws
      JOIN workspaces w ON ws.workspace_id = w.id
      WHERE ${whereClause}
      ORDER BY ws.updated_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params_array.push(limit, offset);
    
    const sentences = db.prepare(query).all(...params_array);
    
    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM workspace_sentences ws
      WHERE ${whereClause}
    `;
    
    const countParams = params_array.slice(0, -2); // limit, offset 제외
    const totalResult = db.prepare(countQuery).get(...countParams);
    
    // tags JSON 파싱
    const result = sentences.map(sentence => ({
      ...sentence,
      tags: sentence.tags ? JSON.parse(sentence.tags) : []
    }));
    
    return NextResponse.json({
      sentences: result,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit)
      }
    });
    
  } catch (error) {
    console.error('문장 조회 오류:', error);
    return NextResponse.json({ error: '문장 조회 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}

// POST /api/v3/workspace/[id]/sentences - 검색한 문장을 워크스페이스에 추가
export async function POST(request, { params }) {
  const db = getDB();
  
  try {
    const { id } = await params;
    const {
      subtitle_id,
      sentence_text,
      start_time,
      end_time,
      source_file,
      korean_translation = '',
      notes = '',
      category_name = '',
      tags = [],
      difficulty_level = 'intermediate'
    } = await request.json();
    
    if (!sentence_text || !start_time || !end_time || !source_file) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
    }
    
    const insertSentence = db.prepare(`
      INSERT OR REPLACE INTO workspace_sentences (
        workspace_id, subtitle_id, sentence_text, start_time, end_time, source_file,
        korean_translation, notes, category_name, tags, difficulty_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertSentence.run(
      id,
      subtitle_id || Math.floor(Math.random() * 1000000),
      sentence_text,
      start_time,
      end_time,
      source_file,
      korean_translation,
      notes,
      category_name,
      JSON.stringify(tags),
      difficulty_level
    );
    
    return NextResponse.json({
      id: result.lastInsertRowid,
      message: '문장이 워크스페이스에 추가되었습니다'
    });
    
  } catch (error) {
    console.error('문장 추가 오류:', error);
    return NextResponse.json({ error: '문장 추가 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}
