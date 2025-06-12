import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), '..', 'working_subtitles.db');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit')) || 100;
    
    const db = new Database(dbPath, { readonly: true });
    
    // 테이블 데이터 조회 요청인 경우
    if (tableName) {
      try {
        // 테이블이 존재하는지 확인
        const tableExists = db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(tableName);
        
        if (!tableExists) {
          return Response.json({ 
            success: false, 
            error: `테이블 '${tableName}'이 존재하지 않습니다.` 
          });
        }
        
        // 테이블 데이터 조회 (LIMIT 적용)
        const data = db.prepare(`SELECT * FROM "${tableName}" LIMIT ?`).all(limit);
        
        // 총 레코드 수 조회
        const totalCount = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
        
        db.close();
        
        return Response.json({
          success: true,
          data: data,
          totalCount: totalCount.count,
          limit: limit,
          tableName: tableName
        });
        
      } catch (error) {
        db.close();
        return Response.json({ 
          success: false, 
          error: `데이터 조회 실패: ${error.message}` 
        });
      }
    }
    
    // 기존 스키마 조회 로직
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    const schema = {};
    
    // 각 테이블의 스키마 정보 조회
    for (const table of tables) {
      const tableName = table.name;
      
      // 테이블 구조 조회
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      
      // 인덱스 정보 조회
      const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
      
      // 외래키 정보 조회
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
      
      // 테이블 행 수 조회
      let rowCount = 0;
      try {
        const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        rowCount = countResult.count;
      } catch (error) {
        console.warn(`테이블 ${tableName} 행 수 조회 실패:`, error.message);
      }
      
      schema[tableName] = {
        name: tableName,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk === 1
        })),
        indexes: indexes.map(idx => ({
          name: idx.name,
          unique: idx.unique === 1,
          partial: idx.partial === 1
        })),
        foreignKeys: foreignKeys.map(fk => ({
          column: fk.from,
          referencedTable: fk.table,
          referencedColumn: fk.to
        })),
        rowCount
      };
    }
    
    db.close();
    
    return Response.json({
      success: true,
      schema,
      tableCount: tables.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('스키마 조회 오류:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 