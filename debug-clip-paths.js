const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'public', 'clips.db');
const db = new Database(dbPath);

try {
  console.log('=== 클립 경로 정보 확인 ===');
  
  const clips = db.prepare(`
    SELECT id, clip_path, thumbnail_path, title 
    FROM clips 
    LIMIT 5
  `).all();
  
  clips.forEach(clip => {
    console.log(`\nID: ${clip.id}`);
    console.log(`Title: ${clip.title}`);
    console.log(`Video Path: ${clip.clip_path}`);
    console.log(`Thumbnail Path: ${clip.thumbnail_path}`);
    
    // 실제 파일 존재 여부 확인
    const fs = require('fs');
    if (clip.clip_path) {
      const videoExists = fs.existsSync(path.join(__dirname, 'public', clip.clip_path));
      console.log(`Video File Exists: ${videoExists}`);
    }
    if (clip.thumbnail_path) {
      const thumbnailExists = fs.existsSync(path.join(__dirname, 'public', clip.thumbnail_path));
      console.log(`Thumbnail File Exists: ${thumbnailExists}`);
    }
  });
  
} catch (error) {
  console.error('데이터베이스 조회 오류:', error);
} finally {
  db.close();
}
