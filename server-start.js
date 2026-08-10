import { execSync } from 'child_process';
import { spawn } from 'child_process';

console.log('=== Starting migration ===');
try {
  execSync('node migrate.js', { stdio: 'inherit', env: process.env });
  console.log('=== Migration complete ===');
} catch (e) {
  console.error('=== Migration failed, continuing anyway ===');
}

console.log('=== Starting server ===');
const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log('Server exited with code:', code);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});
