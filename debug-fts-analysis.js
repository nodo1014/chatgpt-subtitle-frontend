const Database = require('better-sqlite3');
const path = require('path');

// 데이터베이스 경로
const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');
console.log('🔍 데이터베이스 경로:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  console.log('✅ 데이터베이스 연결 성공');

  // 1. 전체 테이블 구조 확인
  console.log('\n📋 전체 테이블 목록:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(`  - ${table.name}`));

  // 2. subtitles 테이블 정보
  console.log('\n📊 subtitles 테이블:');
  const subtitlesCount = db.prepare("SELECT COUNT(*) as count FROM subtitles").get();
  console.log(`  레코드 수: ${subtitlesCount.count}개`);

  // 3. FTS 테이블 정보
  console.log('\n📊 subtitles_fts 테이블:');
  const ftsCount = db.prepare("SELECT COUNT(*) as count FROM subtitles_fts").get();
  console.log(`  레코드 수: ${ftsCount.count}개`);

  // 4. FTS 테이블 스키마 확인
  console.log('\n📋 subtitles_fts 테이블 스키마:');
  try {
    const ftsSchema = db.prepare("PRAGMA table_info(subtitles_fts)").all();
    ftsSchema.forEach(col => console.log(`  - ${col.name}: ${col.type}`));
  } catch (error) {
    console.log('  FTS 스키마 조회 실패:', error.message);
  }

  // 5. FTS 테이블 생성 SQL 확인
  console.log('\n📜 subtitles_fts 생성 SQL:');
  const ftsCreateSql = db.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='subtitles_fts'
  `).get();
  if (ftsCreateSql) {
    console.log(ftsCreateSql.sql);
  } else {
    console.log('  FTS 테이블 생성 SQL을 찾을 수 없음');
  }

  // 6. 인덱스 정보 확인
  console.log('\n🔍 FTS 관련 인덱스:');
  const indexes = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='index' AND name LIKE '%fts%'
  `).all();
  indexes.forEach(idx => {
    console.log(`  - ${idx.name}: ${idx.sql || 'AUTO'}`);
  });

  // 7. subtitles와 subtitles_fts의 ID 매핑 확인
  console.log('\n🔗 ID 매핑 확인:');
  
  // subtitles의 최대/최소 ID
  const subtitlesIdRange = db.prepare(`
    SELECT MIN(id) as min_id, MAX(id) as max_id 
    FROM subtitles
  `).get();
  console.log(`  subtitles ID 범위: ${subtitlesIdRange.min_id} ~ ${subtitlesIdRange.max_id}`);

  // FTS의 rowid 범위
  try {
    const ftsIdRange = db.prepare(`
      SELECT MIN(rowid) as min_rowid, MAX(rowid) as max_rowid 
      FROM subtitles_fts
    `).get();
    console.log(`  FTS rowid 범위: ${ftsIdRange.min_rowid} ~ ${ftsIdRange.max_rowid}`);
  } catch (error) {
    console.log('  FTS rowid 조회 실패:', error.message);
  }

  // 8. 매핑되지 않은 subtitles 레코드 확인
  console.log('\n❌ FTS에 없는 subtitles 레코드 샘플:');
  try {
    const unmappedRecords = db.prepare(`
      SELECT s.id, s.text, s.media_file
      FROM subtitles s
      LEFT JOIN subtitles_fts fts ON s.id = fts.rowid
      WHERE fts.rowid IS NULL
      LIMIT 10
    `).all();
    
    console.log(`  FTS에 없는 레코드 수: ${unmappedRecords.length}개`);
    unmappedRecords.forEach((record, i) => {
      console.log(`    ${i+1}. ID ${record.id}: "${record.text.slice(0, 50)}${record.text.length > 50 ? '...' : ''}"`);
    });

    // 전체 매핑되지 않은 개수
    const unmappedCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM subtitles s
      LEFT JOIN subtitles_fts fts ON s.id = fts.rowid
      WHERE fts.rowid IS NULL
    `).get();
    console.log(`  전체 매핑되지 않은 레코드: ${unmappedCount.count}개`);

  } catch (error) {
    console.log('  매핑 확인 실패:', error.message);
  }

  // 9. FTS 테이블 재구축 명령어 제안
  console.log('\n🔧 FTS 테이블 재구축 방법:');
  console.log('  1. FTS 테이블 삭제: DROP TABLE subtitles_fts;');
  console.log('  2. FTS 테이블 재생성: CREATE VIRTUAL TABLE subtitles_fts USING fts5(text, content="subtitles", content_rowid="id");');
  console.log('  3. 데이터 재구축: INSERT INTO subtitles_fts(rowid, text) SELECT id, text FROM subtitles;');

  db.close();
  console.log('\n✅ 분석 완료');

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
}
