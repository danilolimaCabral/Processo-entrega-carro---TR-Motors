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

  console.log('Starting database migration...');
  console.log('DATABASE_URL:', connectionString.replace(/root:[^@]+@/, 'root:***@'));

  // Parse the DATABASE_URL to get connection details
  const url = new URL(connectionString);
  const hostname = url.hostname;
  const port = parseInt(url.port) || 3306;
  const username = url.username;
  const password = url.password;
  const database = url.pathname.slice(1);

  console.log(`Connecting to MySQL at ${hostname}:${port}...`);

  // First, connect without database to create it if needed
  let serverConnection;
  try {
    serverConnection = await mysql.createConnection({
      host: hostname,
      port: port,
      user: username,
      password: password,
    });
    console.log('Connected to MySQL server');
  } catch (error) {
    console.error('Failed to connect to MySQL server:', error.message);
    process.exit(1);
  }

  // Create the database if it doesn't exist
  console.log(`Creating database '${database}' if not exists...`);
  try {
    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`Database '${database}' is ready`);
  } catch (error) {
    console.error('Failed to create database:', error.message);
    process.exit(1);
  }
  await serverConnection.end();

  // Now connect to the specific database
  let connection;
  try {
    connection = await mysql.createConnection(connectionString);
    console.log('Connected to database successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }

  const migrationsPath = path.join(__dirname, 'migrations.sql');
  
  if (!fs.existsSync(migrationsPath)) {
    console.error('ERROR: migrations.sql not found at:', migrationsPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationsPath, 'utf-8');
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    try { 
      await connection.execute(stmt); 
      success++;
      console.log(`[${i + 1}/${statements.length}] OK: ${stmt.substring(0, 60).replace(/\n/g, ' ')}`);
    } catch(e) { 
      const errorMsg = e.message || e.code || 'unknown error';
      if (
        e.code === 'ER_TABLE_EXISTS_ERROR' || 
        e.code === 'ER_DUP_FIELDNAME' ||
        e.code === 'ER_DUP_ENTRY' ||
        errorMsg.includes('already exists') ||
        errorMsg.includes('Duplicate column')
      ) {
        skipped++;
        console.log(`[${i + 1}/${statements.length}] SKIP: ${stmt.substring(0, 50).replace(/\n/g, ' ')}`);
      } else {
        failed++;
        console.log(`[${i + 1}/${statements.length}] ERR: ${errorMsg.substring(0, 150)}`);
      }
    }
  }

  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`\nTables in database: ${tables.length}`);
  if (tables.length > 0) {
    const tableNames = Object.keys(tables[0]);
    tables.forEach(t => console.log('  -', t[tableNames[0]]));
  }

  await connection.end();
  
  console.log(`\nMigration complete!`);
  console.log(`  Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
  
  if (tables.length === 0) {
    console.error('CRITICAL: No tables found!');
    process.exit(1);
  }
}

runMigration().catch(error => {
  console.error('Migration crashed:', error.message);
  process.exit(1);
});
