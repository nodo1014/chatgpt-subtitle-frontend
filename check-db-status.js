const Database = require('better-sqlite3');

try {
  const db = new Database('clips.db');
  
  console.log('📊 현재 데이터베이스 상태:');
  
  // 테이블 목록 확인
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('테이블 목록:', tables.map(t => t.name));
  
  // subtitles_v3 테이블 확인
  try {
    const subtitleCount = db.prepare('SELECT COUNT(*) as count FROM subtitles_v3').get();
    console.log('\n📚 자막 데이터:', subtitleCount.count + '개');
    
    if (subtitleCount.count > 0) {
      // 시리즈별 데이터 확인
      const seriesSample = db.prepare(`
        SELECT DISTINCT series_name, COUNT(*) as count 
        FROM subtitles_v3 
        WHERE series_name IS NOT NULL 
        GROUP BY series_name 
        ORDER BY count DESC 
        LIMIT 10
      `).all();
      console.log('시리즈별 데이터:');
      seriesSample.forEach(s => console.log(`  - ${s.series_name}: ${s.count}개`));
      
      // 샘플 데이터 확인
      const samples = db.prepare(`
        SELECT text, series_name, start_time, end_time 
        FROM subtitles_v3 
        WHERE length(text) BETWEEN 20 AND 100
        ORDER BY RANDOM() 
        LIMIT 3
      `).all();
      console.log('\n📝 샘플 문장:');
      samples.forEach((s, i) => {
        console.log(`  ${i+1}. "${s.text}" (${s.series_name})`);
      });
    }
  } catch (e) {
    console.log('❌ subtitles_v3 테이블 없음:', e.message);
  }
  
  // selected_sentences 테이블 확인
  try {
    const selectedCount = db.prepare('SELECT COUNT(*) as count FROM selected_sentences').get();
    console.log('\n🎯 선택된 문장:', selectedCount.count + '개');
  } catch (e) {
    console.log('\n❌ selected_sentences 테이블 없음 - 생성 필요');
  }
  
  // themes 테이블 확인
  try {
    const themesCount = db.prepare('SELECT COUNT(*) as count FROM themes').get();
    console.log('🏷️ 테마 데이터:', themesCount.count + '개');
  } catch (e) {
    console.log('❌ themes 테이블 없음');
  }
  
  db.close();
  console.log('\n✅ 데이터베이스 상태 확인 완료');
  
} catch (error) {
  console.error('❌ 데이터베이스 연결 실패:', error.message);
} 