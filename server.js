'use strict';
// Hostinger startup-file alternative to npm start. No development fallback,
// manifest copying, package install, migration, or process manager.
require('./scripts/assert-node22.cjs');
const path = require('node:path');
const fs = require('node:fs');
const standalone = path.join(__dirname, '.next', 'standalone', 'server.js');
if (!fs.existsSync(standalone)) {
  throw new Error('Missing verified standalone build. Run npm run build successfully before starting.');
}
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '0.0.0.0';
if (process.env.PORT && !/^\d+$/.test(process.env.PORT)) throw new Error('Invalid PORT');
if (process.env.PORT && (+process.env.PORT < 1 || +process.env.PORT > 65535)) throw new Error('Invalid PORT');
require(standalone);
