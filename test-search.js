// FTS test script
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Test FTS search
  console.log('Testing FTS search...');
  try {
    const ftsResults = db.prepare(`
      SELECT s.media_file, s.text, s.start_time, s.end_time, s.language, s.directory
      FROM subtitles_fts fts
      JOIN subtitles s ON s.id = fts.rowid
      WHERE fts.text MATCH ?
      LIMIT 5
    `).all('hello');
    console.log('FTS Results for "hello":', ftsResults.length);
    ftsResults.forEach(r => console.log('  -', r.text));
  } catch (ftsError) {
    console.error('FTS Error:', ftsError.message);
  }
  
  // Test LIKE search as fallback
  console.log('\nTesting LIKE search...');
  try {
    const likeResults = db.prepare(`
      SELECT media_file, text, start_time, end_time, language, directory
      FROM subtitles 
      WHERE text LIKE ? COLLATE NOCASE
      LIMIT 5
    `).all('%hello%');
    console.log('LIKE Results for "hello":', likeResults.length);
    likeResults.forEach(r => console.log('  -', r.text));
  } catch (likeError) {
    console.error('LIKE Error:', likeError.message);
  }
  
  // Test with "world"
  console.log('\nTesting with "world"...');
  try {
    const worldResults = db.prepare(`
      SELECT media_file, text, start_time, end_time, language, directory
      FROM subtitles 
      WHERE text LIKE ? COLLATE NOCASE
      LIMIT 5
    `).all('%world%');
    console.log('LIKE Results for "world":', worldResults.length);
    worldResults.forEach(r => console.log('  -', r.text));
  } catch (worldError) {
    console.error('World search error:', worldError.message);
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}
