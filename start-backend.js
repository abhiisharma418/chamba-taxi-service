const { spawn } = require('child_process');

const backend = spawn('npm', ['start'], {
  cwd: './backend',
  env: {
    ...process.env,
    PORT: '5000',
    NODE_ENV: 'development',
    FRONTEND_URL: 'http://localhost:5174'
  },
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
});

process.on('SIGTERM', () => {
  backend.kill();
});
