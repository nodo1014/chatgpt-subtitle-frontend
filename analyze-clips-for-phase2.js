// Phase 2 준비: 현재 클립 데이터 분석
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'public', 'working_subtitles.db');

try {
  const db = new Database(dbPath);
  
  console.log('🔍 Phase 2 시작: 현재 클립 데이터 분석');
  console.log('=' * 50);
  
  // 전체 자막 데이터 통계
  const totalSubtitles = db.prepare("SELECT COUNT(*) as count FROM subtitles").get();
  console.log(`📊 총 자막 레코드: ${totalSubtitles.count}개`);
  
  // 미디어별 분포 (media_file에서 파일명 추출)
  const mediaStats = db.prepare(`
    SELECT 
      CASE 
        WHEN media_file LIKE '%Friends%' THEN 'Friends'
        WHEN media_file LIKE '%Disney%' THEN 'Disney'
        WHEN media_file LIKE '%Batman%' THEN 'Batman'
        WHEN media_file LIKE '%Office%' THEN 'The Office'
        ELSE 'Others'
      END as media_title,
      COUNT(*) as count,
      AVG(LENGTH(text)) as avg_length
    FROM subtitles 
    GROUP BY media_title 
    ORDER BY count DESC
    LIMIT 10
  `).all();
  
  console.log('\n📺 미디어별 클립 분포 (상위 10개):');
  mediaStats.forEach(media => {
    console.log(`  - ${media.media_title}: ${media.count}개 (평균 길이: ${Math.round(media.avg_length)}자)`);
  });
  
  // 문장 길이별 분포
  const lengthStats = db.prepare(`
    SELECT 
      CASE 
        WHEN LENGTH(text) < 50 THEN '짧음 (50자 미만)'
        WHEN LENGTH(text) < 100 THEN '보통 (50-100자)'
        WHEN LENGTH(text) < 200 THEN '길음 (100-200자)'
        ELSE '매우 길음 (200자 이상)'
      END as length_category,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / ${totalSubtitles.count}, 1) as percentage
    FROM subtitles 
    GROUP BY length_category
    ORDER BY count DESC
  `).all();
  
  console.log('\n📏 클립 길이 분포:');
  lengthStats.forEach(stat => {
    console.log(`  - ${stat.length_category}: ${stat.count}개 (${stat.percentage}%)`);
  });
  
  // 컨텐츠 카테고리별 예상 클립 수 계산
  const categories = db.prepare(`
    SELECT 
      id, 
      name, 
      filter_conditions,
      category_type
    FROM content_categories 
    WHERE is_active = 1
  `).all();
  
  console.log('\n🏷️ 카테고리별 예상 클립 수:');
  
  categories.forEach(category => {
    const conditions = JSON.parse(category.filter_conditions);
    let query = "SELECT COUNT(*) as count FROM subtitles WHERE 1=1";
    let params = [];
    
    if (conditions.keywords) {
      const keywordConditions = conditions.keywords.map(() => "text LIKE ?").join(" OR ");
      query += ` AND (${keywordConditions})`;
      params = conditions.keywords.map(keyword => `%${keyword}%`);
    }
    
    if (conditions.media) {
      const mediaConditions = conditions.media.map(() => "media_file LIKE ?").join(" OR ");
      query += ` AND (${mediaConditions})`;
      params.push(...conditions.media.map(media => `%${media}%`));
    }
    
    try {
      const result = db.prepare(query).get(...params);
      console.log(`  - ${category.name} (${category.category_type}): ${result.count}개 클립`);
      
      // estimated_clips 업데이트
      db.prepare(`
        UPDATE content_categories 
        SET estimated_clips = ? 
        WHERE id = ?
      `).run(result.count, category.id);
      
    } catch (error) {
      console.log(`  - ${category.name}: 필터 조건 오류 (수동 확인 필요)`);
    }
  });
  
  // 유튜브 컨텐츠 제작에 적합한 클립 조건 분석
  console.log('\n🎬 유튜브 컨텐츠 제작 적합성 분석:');
  
  // 적정 길이 클립 (30-150자, 영어 학습에 적합)
  const suitableClips = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subtitles 
    WHERE LENGTH(text) BETWEEN 30 AND 150
    AND text LIKE '%[a-zA-Z]%'
  `).get();
  
  console.log(`  - 적정 길이 클립 (30-150자): ${suitableClips.count}개`);
  
  // 감정 표현이 풍부한 클립
  const emotionalClips = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subtitles 
    WHERE text LIKE '%!%' OR text LIKE '%?%' OR text LIKE '%...%'
  `).get();
  
  console.log(`  - 감정 표현 클립 (!,?,... 포함): ${emotionalClips.count}개`);
  
  // 대화형 클립 (you, I, we 포함)
  const conversationalClips = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subtitles 
    WHERE text LIKE '%you%' OR text LIKE '%I %' OR text LIKE '%we%'
  `).get();
  
  console.log(`  - 대화형 클립 (you/I/we 포함): ${conversationalClips.count}개`);
  
  console.log('\n🚀 Phase 2 권장사항:');
  console.log('  1. 프렌즈 시리즈 우선 집중 (데이터 풍부)');
  console.log('  2. 30-150자 클립을 기본 타겟으로 설정');
  console.log('  3. 대화형 클립 우선 큐레이션');
  console.log('  4. 감정 표현 클립을 별도 시리즈로 고려');
  
  db.close();
  console.log('\n✅ Phase 2 데이터 분석 완료!');
  
} catch (error) {
  console.error('❌ 데이터 분석 실패:', error);
  process.exit(1);
}
