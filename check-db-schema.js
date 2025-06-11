// 데이터베이스 스키마 확인
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');

try {
  const db = new Database(dbPath);
  
  // 모든 테이블 목록
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 데이터베이스 테이블 목록:');
  tables.forEach(table => console.log(`  - ${table.name}`));
  
  // subtitles 테이블 스키마
  console.log('\n📊 subtitles 테이블 스키마:');
  const schema = db.prepare("PRAGMA table_info(subtitles)").all();
  schema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} (null: ${col.notnull ? 'NO' : 'YES'})`);
  });
  
  // 샘플 데이터 확인
  console.log('\n🔍 subtitles 샘플 데이터:');
  const sample = db.prepare("SELECT * FROM subtitles LIMIT 3").all();
  console.log(JSON.stringify(sample, null, 2));
  
  db.close();
  
} catch (error) {
  console.error('❌ 스키마 확인 실패:', error);
}
