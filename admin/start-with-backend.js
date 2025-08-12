import { spawn } from 'child_process';
import path from 'path';

// Start mock backend first
console.log('Starting mock backend...');
const mockBackend = spawn('node', ['../mock-backend.js'], {
  stdio: 'pipe'
});

mockBackend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data}`);
});

mockBackend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data}`);
});

// Wait a moment for backend to start, then start vite
setTimeout(() => {
  console.log('Starting Vite dev server...');
  const vite = spawn('node', ['node_modules/vite/bin/vite.js'], {
    stdio: 'inherit'
  });
  
  vite.on('exit', () => {
    mockBackend.kill();
    process.exit();
  });
}, 2000);

process.on('SIGTERM', () => {
  mockBackend.kill();
  process.exit();
});
