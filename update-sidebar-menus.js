// 사이드바 메뉴에 시리즈 동적 추가 스크립트
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');

try {
  const db = new Database(dbPath);
  
  console.log('🔄 사이드바 메뉴에 시리즈 추가 중...');
  
  // 기존 시리즈 메뉴들 제거 (테스트용)
  db.prepare("DELETE FROM sidebar_menus WHERE menu_type = 'series' AND target_id IS NOT NULL").run();
  
  // 모든 활성 시리즈 조회
  const series = db.prepare(`
    SELECT id, series_name, status 
    FROM youtube_series 
    WHERE is_active = 1
    ORDER BY series_name
  `).all();
  
  // 진행 중인 시리즈의 부모 메뉴 ID 찾기
  const parentMenu = db.prepare(`
    SELECT id FROM sidebar_menus 
    WHERE name = '진행 중인 시리즈' AND menu_type = 'series'
  `).get();
  
  if (!parentMenu) {
    console.log('❌ 부모 메뉴를 찾을 수 없습니다.');
    process.exit(1);
  }
  
  // 각 시리즈를 사이드바 메뉴에 추가
  let sortOrder = 1;
  for (const seriesItem of series) {
    const statusIcon = seriesItem.status === 'planning' ? '💡' : 
                      seriesItem.status === 'in_progress' ? '🚧' : 
                      seriesItem.status === 'completed' ? '✅' : '📋';
    
    const result = db.prepare(`
      INSERT INTO sidebar_menus (
        name, icon, menu_type, target_id, parent_id,
        workflow_stage, sort_order
      ) VALUES (?, ?, 'series', ?, ?, 'editing', ?)
    `).run(
      seriesItem.series_name,
      statusIcon,
      seriesItem.id,
      parentMenu.id,
      sortOrder++
    );
    
    console.log(`✅ 시리즈 추가: ${seriesItem.series_name} (ID: ${result.lastInsertRowid})`);
  }
  
  // 테마별 컨텐츠에도 카테고리들 추가
  const categoryParent = db.prepare(`
    SELECT id FROM sidebar_menus 
    WHERE name = '테마별 컨텐츠' AND menu_type = 'category'
  `).get();
  
  if (categoryParent) {
    // 기존 카테고리 메뉴들 제거
    db.prepare("DELETE FROM sidebar_menus WHERE menu_type = 'category' AND target_id IS NOT NULL").run();
    
    const categories = db.prepare(`
      SELECT id, name, icon, category_type
      FROM content_categories 
      WHERE is_active = 1
      ORDER BY sort_order, name
    `).all();
    
    sortOrder = 1;
    for (const category of categories) {
      const result = db.prepare(`
        INSERT INTO sidebar_menus (
          name, icon, menu_type, target_id, parent_id,
          workflow_stage, sort_order
        ) VALUES (?, ?, 'category', ?, ?, 'collection', ?)
      `).run(
        category.name,
        category.icon,
        category.id,
        categoryParent.id,
        sortOrder++
      );
      
      console.log(`✅ 카테고리 추가: ${category.name} (ID: ${result.lastInsertRowid})`);
    }
  }
  
  db.close();
  console.log('\n🎉 사이드바 메뉴 업데이트 완료!');
  
} catch (error) {
  console.error('❌ 메뉴 업데이트 실패:', error);
  process.exit(1);
}
