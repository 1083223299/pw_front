const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VITE_PORT = 3000;
const VITE_MODE = process.env.VITE_APP_ENV === 'prod' ? 'production' : 'development';

function getAvailablePort(startPort = VITE_PORT) {
  return new Promise((resolve, reject) => {
    const testPort = (port) => {
      const server = net.createServer();
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE') return testPort(port + 1);
        reject(error);
      });
      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        server.close(() => resolve(address.port));
      });
    };
    testPort(startPort);
  });
}

function waitForServer(url, retries = 60) {
  return new Promise((resolve, reject) => {
    const tryOnce = (left) => {
      http.get(url, () => resolve()).on('error', () => {
        if (left <= 0) return reject(new Error('Vite dev server 启动超时'));
        setTimeout(() => tryOnce(left - 1), 500);
      });
    };
    tryOnce(retries);
  });
}

(async () => {
  const port = await getAvailablePort();
  const devUrl = `http://localhost:${port}`;
  console.log(`[dev] Vite 启动端口: ${port}，模式: ${VITE_MODE}`);

  const vite = spawn('npx', [
    'vite', '--host', '0.0.0.0', '--port', String(port), '--mode', VITE_MODE,
  ], {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
  });

  try {
    await waitForServer(devUrl);
    const electron = spawn('npx', ['electron', '.'], {
      cwd: ROOT,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, VITE_DEV_SERVER_URL: devUrl },
    });
    electron.on('close', () => {
      vite.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error(error.message);
    vite.kill();
    process.exit(1);
  }

  process.on('SIGINT', () => {
    vite.kill();
    process.exit(0);
  });
})();
