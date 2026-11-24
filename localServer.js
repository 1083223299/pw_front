const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function isApiPath(pathname) {
  return pathname === '/pws' || pathname.startsWith('/pws/')
    || pathname === '/doudian_shop' || pathname.startsWith('/doudian_shop/');
}

/**
 * 打包版通过仅监听本机回环地址的 HTTP 服务加载页面。
 * 这样原有 /pws、/doudian_shop 相对接口值无需修改，也不会被解析成 file://。
 */
function startLocalServer({ root, apiTarget }) {
  const target = new URL(apiTarget);
  const distRoot = path.resolve(root);

  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      response.writeHead(400);
      response.end('Bad Request');
      return;
    }

    // Web 产物可能使用 /h5_pw/ 公共前缀；桌面端本地服务按 dist 根目录提供文件，需要去掉该前缀。
    const WEB_BASE_PREFIX = '/h5_pw/';
    if (pathname.startsWith(WEB_BASE_PREFIX)) {
      pathname = `/${pathname.slice(WEB_BASE_PREFIX.length)}`;
    }

    if (isApiPath(pathname)) {
      const headers = { ...request.headers, host: target.host };
      const proxy = http.request({
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 80,
        method: request.method,
        path: request.url,
        headers,
        timeout: 60000,
      }, (upstream) => {
        response.writeHead(upstream.statusCode || 502, upstream.headers);
        upstream.pipe(response);
      });
      proxy.on('timeout', () => proxy.destroy(new Error('上游接口请求超时')));
      proxy.on('error', (error) => {
        if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ message: error.message }));
      });
      request.pipe(proxy);
      return;
    }

    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.resolve(distRoot, `.${requestedPath}`);
    if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${path.sep}`)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // hash 路由不需要服务端重写；仅对无扩展名路径提供入口页兜底。
      if (path.extname(requestedPath)) {
        response.writeHead(404);
        response.end('Not Found');
        return;
      }
      filePath = path.join(distRoot, 'index.html');
    }

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  });

  // 桌面打包版本地服务需要把通知 WebSocket 升级请求转发到后端。
  server.on('upgrade', (request, socket, head) => {
    let pathname = '/';
    try {
      pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    } catch {
      socket.destroy();
      return;
    }

    if (!pathname.startsWith('/pws/')) {
      socket.destroy();
      return;
    }

    const headers = { ...request.headers, host: target.host };
    const upstream = http.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 80,
      method: request.method || 'GET',
      path: request.url,
      headers,
      agent: false,
      timeout: 60000,
    });

    upstream.on('upgrade', (upstreamRes, upstreamSocket, upstreamHead) => {
      if (head && head.length) upstreamSocket.unshift(head);
      if (upstreamHead && upstreamHead.length) upstreamSocket.unshift(upstreamHead);

      const headerLines = Object.entries(upstreamRes.headers || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n');

      socket.write(
        `HTTP/1.1 ${upstreamRes.statusCode || 101} ${upstreamRes.statusMessage || 'Switching Protocols'}\r\n` +
        `${headerLines}\r\n\r\n`
      );

      upstreamSocket.pipe(socket);
      socket.pipe(upstreamSocket);
      socket.on('close', () => upstreamSocket.destroy());
      upstreamSocket.on('close', () => socket.destroy());
    });

    upstream.on('error', () => socket.destroy());
    upstream.end();
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}/index.html` });
    });
  });
}

module.exports = { startLocalServer };
