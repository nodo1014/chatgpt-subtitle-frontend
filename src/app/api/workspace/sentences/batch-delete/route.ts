import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'clips.db');

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '삭제할 ID가 없습니다.' }, { status: 400 });
    }

    console.log('🗑️ 일괄 삭제 요청:', ids.length, '개 문장');

    const db = new Database(dbPath);
    
    // 트랜잭션으로 일괄 삭제
    const deleteStmt = db.prepare('DELETE FROM workspace_sentences WHERE id = ?');
    
    const transaction = db.transaction((ids: number[]) => {
      for (const id of ids) {
        deleteStmt.run(id);
      }
    });

    transaction(ids);
    db.close();

    console.log('✅ 일괄 삭제 완료:', ids.length, '개 문장');

    return NextResponse.json({ 
      success: true, 
      deleted: ids.length,
      message: `${ids.length}개 문장이 삭제되었습니다.`
    });

  } catch (error) {
    console.error('❌ 일괄 삭제 실패:', error);
    return NextResponse.json({ 
      error: '일괄 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 