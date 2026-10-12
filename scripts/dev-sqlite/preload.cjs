/**
 * Preload shim for running existing scripts/seeds unchanged against the
 * offline SQLite dev database.
 *
 * Many seed scripts do `new PrismaClient()` from '@prisma/client', which in
 * this sandbox would require the native MySQL query engine (unavailable —
 * binaries.prisma.sh is unreachable). This shim redirects those imports to
 * the generated WASM client entry and injects the libsql driver adapter.
 *
 * Usage:
 *   NODE_OPTIONS="--require ./scripts/dev-sqlite/preload.cjs" npx tsx prisma/seed-homepage.ts
 *
 * Only for development sandboxes; never used in production.
 */
'use strict';
const Module = require('module');

const url = process.env.DATABASE_URL || '';
if (!url.startsWith('file:')) {
  // Not in SQLite dev mode — do nothing.
  return;
}

const origLoad = Module._load;
let patched = null;

function buildPatched(parent) {
  const real = origLoad.call(Module, '.prisma/client/wasm', parent, false);
  const { PrismaLibSQL } = origLoad.call(Module, '@prisma/adapter-libsql', parent, false);
  class DevSqlitePrismaClient extends real.PrismaClient {
    constructor(opts = {}) {
      super({ adapter: new PrismaLibSQL({ url }), ...opts });
    }
  }
  return Object.assign(Object.create(Object.getPrototypeOf(real)), real, {
    PrismaClient: DevSqlitePrismaClient,
  });
}

Module._load = function (request, parent, isMain) {
  if (request === '@prisma/client' || request === '.prisma/client') {
    if (!patched) patched = buildPatched(parent);
    return patched;
  }
  return origLoad.call(this, request, parent, isMain);
};
