import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'clips.db');

export async function PUT(request: NextRequest) {
  try {
    const { rows } = await request.json();
    
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: '유효하지 않은 데이터입니다.' }, { status: 400 });
    }

    console.log('📝 일괄 업데이트 요청:', rows.length, '개 행');

    const db = new Database(dbPath);
    
    // 트랜잭션으로 일괄 처리
    const updateStmt = db.prepare(`
      UPDATE workspace_sentences 
      SET 
        ai_translation = ?,
        explanation_line1 = ?,
        explanation_line2 = ?,
        explanation_line3 = ?,
        pronunciation_guide = ?,
        learning_priority = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const transaction = db.transaction((rows: any[]) => {
      for (const row of rows) {
        updateStmt.run(
          row.korean_translation || '',
          row.explanation_line1 || '',
          row.explanation_line2 || '',
          row.explanation_line3 || '',
          row.pronunciation_guide || '',
          row.learning_priority || 5,
          row.id
        );
      }
    });

    transaction(rows);
    db.close();

    console.log('✅ 일괄 업데이트 완료:', rows.length, '개 행');

    return NextResponse.json({ 
      success: true, 
      updated: rows.length,
      message: `${rows.length}개 문장이 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('❌ 일괄 업데이트 실패:', error);
    return NextResponse.json({ 
      error: '일괄 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 