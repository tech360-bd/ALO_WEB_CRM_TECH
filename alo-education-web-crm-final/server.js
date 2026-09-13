/* eslint-disable @typescript-eslint/no-require-imports */
// cPanel Root Startup Entrypoint - server.js
// Launches the verified Next.js standalone server for Node.js 22 on cPanel.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { existsSync, cpSync } = require('fs');

const rootDir = __dirname;
const topNextDir = path.join(rootDir, '.next');
const standaloneDir = path.join(topNextDir, 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');
const standaloneServerPath = path.join(standaloneDir, 'server.js');

// Auto-sync standalone manifests to top-level .next if missing
if (existsSync(standaloneNextDir) && !existsSync(path.join(topNextDir, 'BUILD_ID'))) {
  try {
    cpSync(standaloneNextDir, topNextDir, { recursive: true });
    console.log('[cPanel Startup] Auto-synced standalone manifests to top-level .next directory.');
  } catch (err) {
    console.error('[cPanel Startup] Warning syncing manifests:', err.message);
  }
}

const dev = process.env.NODE_ENV !== 'production';

if (!dev && existsSync(standaloneServerPath)) {
  process.chdir(standaloneDir);
  require(standaloneServerPath);
} else {
  const { createServer } = require('http');
  const { parse } = require('url');
  const next = require('next');
  const hostname = process.env.HOSTNAME || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

  console.log('[cPanel Startup] Standalone bundle not found, initializing Next.js server...');
  const app = next({ dev, hostname, port, dir: rootDir });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (error) {
        console.error('Error handling request:', req.url, error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, () => {
      console.log(`> ALO Education Production Server ready on http://${hostname}:${port}`);
    });
  });
}
