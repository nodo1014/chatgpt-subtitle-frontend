// 개별 문장 관리 API
// /api/v3/workspace/[id]/sentences/[sentenceId]

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDB() {
  const dbPath = path.join(process.cwd(), 'public', 'clips.db');
  return new Database(dbPath);
}

// PUT /api/v3/workspace/[id]/sentences/[sentenceId] - 문장 메타데이터 업데이트
export async function PUT(request, { params }) {
  const db = getDB();
  
  try {
    const { id, sentenceId } = await params;
    const updateData = await request.json();
    
    // 허용된 필드만 업데이트
    const allowedFields = [
      'is_bookmarked', 'category_name', 'tags', 'korean_translation', 
      'notes', 'difficulty_level', 'study_count', 'mastery_level'
    ];
    
    const updates = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(key === 'tags' ? JSON.stringify(value) : value);
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: '업데이트할 필드가 없습니다' }, { status: 400 });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `
      UPDATE workspace_sentences 
      SET ${updates.join(', ')}
      WHERE id = ? AND workspace_id = ?
    `;
    
    values.push(sentenceId, id);
    
    const result = db.prepare(query).run(...values);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: '문장을 찾을 수 없습니다' }, { status: 404 });
    }
    
    return NextResponse.json({ message: '문장이 업데이트되었습니다' });
    
  } catch (error) {
    console.error('문장 업데이트 오류:', error);
    return NextResponse.json({ error: '문장 업데이트 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}

// DELETE /api/v3/workspace/[id]/sentences/[sentenceId] - 문장 삭제
export async function DELETE(request, { params }) {
  const db = getDB();
  
  try {
    const { id, sentenceId } = await params;
    
    const deleteQuery = `
      DELETE FROM workspace_sentences 
      WHERE id = ? AND workspace_id = ?
    `;
    
    const result = db.prepare(deleteQuery).run(sentenceId, id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: '문장을 찾을 수 없습니다' }, { status: 404 });
    }
    
    return NextResponse.json({ message: '문장이 삭제되었습니다' });
    
  } catch (error) {
    console.error('문장 삭제 오류:', error);
    return NextResponse.json({ error: '문장 삭제 실패' }, { status: 500 });
  } finally {
    db.close();
  }
}
