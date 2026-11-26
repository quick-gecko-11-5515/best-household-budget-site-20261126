// Minimal local HTTP server for previewing app/ during development and verification.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'app');
const portFlag = process.argv.indexOf('--port');
const parsedPort = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 8080;
const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  let cleanPath: string;
  try {
    cleanPath = decodeURIComponent(reqUrl.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (cleanPath.endsWith('/')) cleanPath += 'index.html';
  const target = resolve(join(appRoot, normalize(cleanPath)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('Not a regular file');
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-store',
    });
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Hearthbook app/ running at http://127.0.0.1:${port}`);
});
