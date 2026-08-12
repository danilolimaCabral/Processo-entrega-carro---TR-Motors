import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set');
    process.exit(1);
  }
  
  const url = new URL(connectionString);
  console.log('Connecting to:', url.hostname, url.port, url.pathname.slice(1));
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });
  
  console.log('Connected to database');
  
  // Read migrations.sql
  const migrationsPath = path.join(__dirname, 'migrations.sql');
  if (!fs.existsSync(migrationsPath)) {
    console.error('ERROR: migrations.sql not found');
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationsPath, 'utf-8');
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  const destructiveStatements = statements.filter((statement) => /\b(DROP|TRUNCATE)\s+TABLE\b/i.test(statement));
  if (destructiveStatements.length > 0) {
    throw new Error(`Migration blocked: destructive table operation detected (${destructiveStatements[0].trim().split("\n")[0]}).`);
  }
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  let success = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    
    try {
      await connection.execute(stmt);
      success++;
      console.log(`[${i + 1}/${statements.length}] OK: ${stmt.substring(0, 60).replace(/\n/g, ' ')}`);
    } catch (e) {
      const errorMsg = e.message || e.code || 'unknown error';
      if (
        e.code === 'ER_TABLE_EXISTS_ERROR' ||
        e.code === 'ER_DUP_FIELDNAME' ||
        e.code === 'ER_DUP_ENTRY' ||
        errorMsg.includes('already exists') ||
        errorMsg.includes('Duplicate column') ||
        errorMsg.includes('Duplicate')
      ) {
        skipped++;
        console.log(`[${i + 1}/${statements.length}] SKIP: ${stmt.substring(0, 50).replace(/\n/g, ' ')}`);
      } else {
        failed++;
        console.log(`[${i + 1}/${statements.length}] ERR: ${errorMsg.substring(0, 150)}`);
      }
    }
  }
  
  // Verify tables
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`\nTables in database: ${tables.length}`);
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  
  // Verify users
  const [users] = await connection.execute('SELECT id, name, email, role FROM users');
  console.log(`\nUsers: ${users.length}`);
  users.forEach(u => console.log(`  - ${u.id}: ${u.name} (${u.email}) - ${u.role}`));
  
  await connection.end();
  console.log(`\nMigration complete! Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
}

runMigration().catch(error => {
  console.error('Migration crashed:', error.message);
  process.exit(1);
});
