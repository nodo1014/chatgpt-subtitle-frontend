const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'public', 'clips.db');
const db = new Database(dbPath);

try {
  console.log('=== 클립 경로 수정 시작 ===');
  
  // 실제 존재하는 파일들
  const clipsDir = path.join(__dirname, 'public', 'clips');
  const actualFiles = fs.readdirSync(clipsDir).filter(file => file.endsWith('.mp4'));
  
  console.log(`실제 MP4 파일 수: ${actualFiles.length}`);
  
  const updateStmt = db.prepare(`
    UPDATE clips 
    SET clip_path = ?, thumbnail_path = ?
    WHERE id = ?
  `);
  
  let updateCount = 0;
  
  actualFiles.forEach(fileName => {
    const clipId = fileName.replace('.mp4', '');
    
    // 데이터베이스에 해당 ID가 있는지 확인
    const existingClip = db.prepare('SELECT id FROM clips WHERE id = ?').get(clipId);
    
    if (existingClip) {
      const clipPath = `clips/${fileName}`;
      const thumbnailPath = `thumbnails/${clipId}.jpg`;
      
      updateStmt.run(clipPath, thumbnailPath, clipId);
      updateCount++;
      console.log(`✅ 업데이트: ${clipId}`);
      console.log(`   Video: ${clipPath}`);
      console.log(`   Thumbnail: ${thumbnailPath}`);
    }
  });
  
  console.log(`\n✅ 총 ${updateCount}개 클립 경로 업데이트 완료`);
  
  // 업데이트 결과 확인
  const updatedClips = db.prepare(`
    SELECT id, clip_path, thumbnail_path, title
    FROM clips 
    WHERE clip_path IS NOT NULL
    LIMIT 5
  `).all();
  
  console.log('\n=== 업데이트된 클립들 ===');
  updatedClips.forEach(clip => {
    console.log(`ID: ${clip.id}`);
    console.log(`Title: ${clip.title}`);
    console.log(`Video: ${clip.clip_path}`);
    console.log(`Thumbnail: ${clip.thumbnail_path}`);
    
    // 파일 존재 확인
    const videoExists = fs.existsSync(path.join(__dirname, 'public', clip.clip_path));
    console.log(`Video Exists: ${videoExists}`);
    console.log('---');
  });
  
} catch (error) {
  console.error('오류:', error);
} finally {
  db.close();
}
