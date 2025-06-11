// Database test script
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');
console.log('DB Path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  
  // Check subtitles table structure
  if (tables.some(t => t.name === 'subtitles')) {
    const schema = db.prepare("PRAGMA table_info(subtitles)").all();
    console.log('Subtitles schema:', schema);
    
    // Count records
    const count = db.prepare("SELECT COUNT(*) as count FROM subtitles").get();
    console.log('Total records:', count);
    
    // Sample records
    const samples = db.prepare("SELECT * FROM subtitles LIMIT 3").all();
    console.log('Sample records:', samples);
  }
  
  // Check if FTS table exists
  if (tables.some(t => t.name === 'subtitles_fts')) {
    console.log('FTS table exists');
    const ftsCount = db.prepare("SELECT COUNT(*) as count FROM subtitles_fts").get();
    console.log('FTS records:', ftsCount);
  } else {
    console.log('FTS table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}
