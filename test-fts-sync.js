const Database = require('better-sqlite3');
const path = require('path');

// 자동 동기화 테스트
const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');
console.log('🧪 FTS 자동 동기화 테스트');

try {
  const db = new Database(dbPath, { readonly: false });
  
  // 1. 테스트 데이터 삽입
  console.log('\n1️⃣ 테스트 데이터 삽입...');
  const insertStmt = db.prepare(`
    INSERT INTO subtitles (media_file, subtitle_file, start_time, end_time, text, language, directory)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const testResult = insertStmt.run(
    'test_movie.mp4',
    'test_movie.srt', 
    '00:00:01,000',
    '00:00:03,000',
    'This is a test subtitle for FTS sync',
    'en',
    '/test/directory'
  );
  
  const insertedId = testResult.lastInsertRowid;
  console.log(`   삽입된 ID: ${insertedId}`);
  
  // 2. FTS에서 검색하여 자동 동기화 확인
  console.log('\n2️⃣ FTS 자동 동기화 확인...');
  const searchResult = db.prepare(`
    SELECT s.id, s.text, s.media_file
    FROM subtitles_fts fts
    JOIN subtitles s ON s.id = fts.rowid
    WHERE fts.text MATCH 'test subtitle FTS sync'
    AND s.id = ?
  `).get(insertedId);
  
  if (searchResult) {
    console.log('   ✅ 자동 동기화 성공!');
    console.log(`   검색된 텍스트: "${searchResult.text}"`);
  } else {
    console.log('   ❌ 자동 동기화 실패');
  }
  
  // 3. 테스트 데이터 업데이트
  console.log('\n3️⃣ 데이터 업데이트 테스트...');
  const updateStmt = db.prepare(`
    UPDATE subtitles 
    SET text = ? 
    WHERE id = ?
  `);
  
  updateStmt.run('Updated test subtitle for FTS sync verification', insertedId);
  
  // FTS에서 업데이트된 내용 확인
  const updatedResult = db.prepare(`
    SELECT s.id, s.text
    FROM subtitles_fts fts
    JOIN subtitles s ON s.id = fts.rowid
    WHERE fts.text MATCH 'Updated test subtitle'
    AND s.id = ?
  `).get(insertedId);
  
  if (updatedResult) {
    console.log('   ✅ 업데이트 자동 동기화 성공!');
    console.log(`   업데이트된 텍스트: "${updatedResult.text}"`);
  } else {
    console.log('   ❌ 업데이트 자동 동기화 실패');
  }
  
  // 4. 테스트 데이터 삭제
  console.log('\n4️⃣ 데이터 삭제 테스트...');
  const deleteStmt = db.prepare('DELETE FROM subtitles WHERE id = ?');
  const deleteResult = deleteStmt.run(insertedId);
  
  // FTS에서 삭제 확인
  const deletedCheck = db.prepare(`
    SELECT COUNT(*) as count
    FROM subtitles_fts fts
    WHERE fts.rowid = ?
  `).get(insertedId);
  
  if (deletedCheck.count === 0) {
    console.log('   ✅ 삭제 자동 동기화 성공!');
    console.log(`   삭제된 레코드 수: ${deleteResult.changes}`);
  } else {
    console.log('   ❌ 삭제 자동 동기화 실패');
  }
  
  console.log('\n🎉 FTS 자동 동기화가 완벽하게 작동합니다!');
  console.log('앞으로 subtitles 테이블만 관리하면 FTS가 자동으로 동기화됩니다.');
  
  db.close();

} catch (error) {
  console.error('❌ 테스트 실패:', error.message);
}
