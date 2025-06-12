const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'public', 'clips.db');
const db = new Database(dbPath);

try {
  console.log('=== 클립 파일 매칭 확인 ===');
  
  // 데이터베이스의 모든 클립 ID 조회
  const dbClips = db.prepare(`
    SELECT id, clip_path, thumbnail_path, title 
    FROM clips 
    ORDER BY id
  `).all();
  
  console.log(`데이터베이스 클립 수: ${dbClips.length}`);
  
  // 실제 파일 목록 확인
  const clipsDir = path.join(__dirname, 'public', 'clips');
  const actualFiles = fs.readdirSync(clipsDir).filter(file => file.endsWith('.mp4'));
  
  console.log(`실제 MP4 파일 수: ${actualFiles.length}`);
  console.log('\n실제 파일들:');
  actualFiles.slice(0, 10).forEach(file => console.log(file));
  
  console.log('\n데이터베이스 ID들:');
  dbClips.slice(0, 10).forEach(clip => console.log(clip.id));
  
  // 매칭되는 파일 찾기
  let matchCount = 0;
  const matches = [];
  
  dbClips.forEach(clip => {
    const expectedFile = `${clip.id}.mp4`;
    if (actualFiles.includes(expectedFile)) {
      matchCount++;
      matches.push(clip.id);
    }
  });
  
  console.log(`\n매칭되는 파일 수: ${matchCount}`);
  if (matches.length > 0) {
    console.log('매칭되는 클립들:');
    matches.slice(0, 5).forEach(id => console.log(id));
  }
  
} catch (error) {
  console.error('오류:', error);
} finally {
  db.close();
}
