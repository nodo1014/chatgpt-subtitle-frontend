import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// 데이터베이스 연결
function getDB() {
  const dbPath = path.join(process.cwd(), 'public', 'clips.db');
  return new Database(dbPath);
}

// GET /api/sentence-manager/sentences - 워크스페이스 문장 조회
export async function GET(request: Request) {
  const db = getDB();
  
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: '워크스페이스 ID가 필요합니다' }, { status: 400 });
    }
    
    // workspace_sentences 테이블에서 문장 조회
    const query = `
      SELECT 
        ws.id,
        ws.subtitle_id,
        ws.sentence_text as text,
        ws.korean_translation as ai_translation,
        ws.notes,
        ws.is_bookmarked,
        ws.difficulty_level,
        ws.mastery_level
      FROM workspace_sentences ws
      WHERE ws.workspace_id = ?
      ORDER BY ws.id ASC
    `;
    
    const sentences = db.prepare(query).all(workspaceId);
    
    return NextResponse.json({ 
      success: true, 
      sentences: sentences.map(sentence => {
        // notes에서 해설과 발음 분리
        const notes = sentence.notes || '';
        const lines = notes.split('\n');
        const ai_explanation = lines.find(line => line.startsWith('해설:'))?.replace('해설:', '').trim() || '';
        const pronunciation_guide = lines.find(line => line.startsWith('발음:'))?.replace('발음:', '').trim() || '';
        
        return {
          ...sentence,
          ai_translation: sentence.ai_translation || '',
          ai_explanation,
          pronunciation_guide,
          learning_priority: sentence.mastery_level || 5,
          is_bookmarked: Boolean(sentence.is_bookmarked)
        };
      })
    });
    
  } catch (error) {
    console.error('문장 조회 오류:', error);
    return NextResponse.json({ error: '문장 조회 실패' }, { status: 500 });
  } finally {
    db.close();
  }
} 