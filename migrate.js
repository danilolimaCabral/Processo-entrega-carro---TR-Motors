import mysql from 'mysql2/promise';
import fs from 'fs';

const sql = fs.readFileSync('./migrations.sql', 'utf-8');

const conn = await mysql.createConnection({
  host: process.env.MYSQLHOST || 'mysql.railway.internal',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway',
  multipleStatements: true,
});

const statements = sql.split(';').filter(s => s.trim().length > 0);
for (const stmt of statements) {
  if (stmt.trim()) {
    try { 
      await conn.execute(stmt + ';'); 
      console.log('OK:', stmt.substring(0, 60));
    } catch(e) { 
      console.log('SKIP:', e.message.substring(0, 100)); 
    }
  }
}

const [tables] = await conn.execute('SHOW TABLES');
console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));
await conn.end();
console.log('Migration complete!');
