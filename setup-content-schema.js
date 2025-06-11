// 컨텐츠 제작 시스템 DB 스키마 적용 스크립트
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');
const schemaPath = path.join(__dirname, 'public', 'content-production-schema.sql');

try {
  // 데이터베이스 연결
  const db = new Database(dbPath);
  
  // 스키마 파일 읽기
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // SQL 문을 세미콜론으로 분리
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
  
  console.log('🚀 컨텐츠 제작 시스템 DB 스키마 적용 시작...');
  
  // 트랜잭션으로 모든 스키마 적용
  const transaction = db.transaction(() => {
    statements.forEach((stmt, index) => {
      try {
        db.exec(stmt.trim());
        console.log(`✅ SQL 문 ${index + 1}/${statements.length} 실행 완료`);
      } catch (error) {
        console.log(`⚠️ SQL 문 ${index + 1} 건너뜀 (이미 존재할 수 있음): ${error.message}`);
      }
    });
  });
  
  transaction();
  
  console.log('🎉 컨텐츠 제작 시스템 DB 스키마 적용 완료!');
  
  // 생성된 테이블 확인
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%content%' OR name LIKE '%youtube%' OR name LIKE '%series%' OR name LIKE '%production%'").all();
  console.log('\n📋 생성된 테이블:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // 초기 데이터 확인
  const categories = db.prepare("SELECT COUNT(*) as count FROM content_categories").get();
  const menus = db.prepare("SELECT COUNT(*) as count FROM sidebar_menus").get();
  
  console.log('\n📊 초기 데이터:');
  console.log(`  - 컨텐츠 카테고리: ${categories.count}개`);
  console.log(`  - 사이드바 메뉴: ${menus.count}개`);
  
  db.close();
  console.log('\n✅ Phase 1-1 완료: 데이터베이스 스키마 구축 성공');
  
} catch (error) {
  console.error('❌ 스키마 적용 실패:', error);
  process.exit(1);
}
