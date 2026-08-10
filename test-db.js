import mysql from 'mysql2/promise';

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const url = new URL(dbUrl);
  console.log('Host:', url.hostname, 'Port:', url.port, 'DB:', url.pathname.slice(1));
  console.log('User:', url.username);
  
  try {
    const conn = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 15000
    });
    console.log('Connected!');
    
    const [tables] = await conn.execute('SHOW TABLES');
    console.log('Tables:', tables.length);
    
    const [users] = await conn.execute('SELECT * FROM users LIMIT 5');
    console.log('Users:', users.length);
    if (users.length > 0) {
      console.log('First user:', JSON.stringify(users[0]).slice(0, 300));
    }
    
    const [adminUser] = await conn.execute('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', ['admin@test.com']);
    console.log('Admin user found:', adminUser.length > 0);
    if (adminUser.length > 0) {
      console.log('Admin user:', JSON.stringify(adminUser[0]).slice(0, 300));
    }
    
    await conn.end();
    console.log('Done!');
  } catch(e) {
    console.error('ERROR:', e.code, e.message, e.sqlMessage || '');
  }
}

test();
