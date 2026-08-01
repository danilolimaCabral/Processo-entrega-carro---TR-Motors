import mysql from 'mysql2/promise';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

console.log('Connecting to database...');
const pool = mysql.createPool(connectionString);

const sql = fs.readFileSync('./migrations.sql', 'utf-8');
const statements = sql.split(';').filter(s => s.trim().length > 0);

let success = 0;
let failed = 0;

for (const stmt of statements) {
  if (!stmt.trim()) continue;
  try { 
    await pool.execute(stmt + ';'); 
    success++;
    console.log('OK:', stmt.substring(0, 80));
  } catch(e) { 
    failed++;
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.message.includes('already exists')) {
      console.log('SKIP (exists):', stmt.substring(0, 60));
    } else {
      console.log('ERR:', e.message?.substring(0, 100) || e.code);
    }
  }
}

const [tables] = await pool.execute('SHOW TABLES');
console.log('\nTables in database:', tables.length);
tables.forEach(t => console.log(' -', Object.values(t)[0]));

await pool.end();
console.log(`\nMigration complete! Success: ${success}, Failed/Skipped: ${failed}`);
