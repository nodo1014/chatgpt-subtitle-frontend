import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// 데이터베이스 연결
function getDB() {
  const dbPath = path.join(process.cwd(), 'public', 'clips.db');
  return new Database(dbPath);
}

interface SentenceUpdate {
  id: number;
  text: string;
  ai_translation: string;
  ai_explanation: string;
  pronunciation_guide: string;
  learning_priority: number;
  is_bookmarked: boolean;
}

// POST /api/sentence-manager/bulk-update - 문장 일괄 업데이트
export async function POST(request: Request) {
  const db = getDB();
  
  try {
    const { workspaceId, sentences } = await request.json();
    
    if (!workspaceId || !Array.isArray(sentences)) {
      return NextResponse.json({ error: '워크스페이스 ID와 문장 데이터가 필요합니다' }, { status: 400 });
    }
    
    // 트랜잭션 시작
    const updateTransaction = db.transaction((sentenceList: SentenceUpdate[]) => {
      const updateStmt = db.prepare(`
        UPDATE workspace_sentences 
        SET 
          korean_translation = ?,
          notes = ?,
          mastery_level = ?,
          is_bookmarked = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND workspace_id = ?
      `);
      
      let updatedCount = 0;
      
      for (const sentence of sentenceList) {
        if (sentence.id && sentence.id > 0) {
          const notes = `해설: ${sentence.ai_explanation || ''}\n발음: ${sentence.pronunciation_guide || ''}`;
          
          const result = updateStmt.run(
            sentence.ai_translation || '',
            notes,
            sentence.learning_priority || 5,
            sentence.is_bookmarked ? 1 : 0,
            sentence.id,
            workspaceId
          );
          
          if (result.changes > 0) {
            updatedCount++;
          }
        }
      }
      
      return updatedCount;
    });
    
    const updatedCount = updateTransaction(sentences);
    
    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount}개 문장이 업데이트되었습니다`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('문장 업데이트 오류:', error);
    return NextResponse.json({ error: '문장 업데이트 실패: ' + error.message }, { status: 500 });
  } finally {
    db.close();
  }
} 