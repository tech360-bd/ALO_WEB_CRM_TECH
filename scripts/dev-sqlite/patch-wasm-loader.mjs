#!/usr/bin/env node
/**
 * Patches the generated Prisma client's WASM engine loader so it works in
 * plain Node.js (next dev / node server) instead of only in bundlers/edge
 * runtimes. Bundlers resolve `import('./query_engine_bg.wasm')` to a module
 * whose default export is a WebAssembly.Module; Node does not, so we load the
 * bytes ourselves. Only touches node_modules — run after:
 *   npx prisma generate --schema prisma/schema.dev.prisma --config prisma/dev-sqlite.config.ts
 */
import { writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const clientDir = dirname(require.resolve('.prisma/client/package.json'));
const loaderPath = join(clientDir, 'wasm-worker-loader.mjs');

if (!existsSync(join(clientDir, 'query_engine_bg.wasm'))) {
  console.error('query_engine_bg.wasm not found — generate the dev client first.');
  process.exit(1);
}

writeFileSync(loaderPath, `// Patched by scripts/dev-sqlite/patch-wasm-loader.mjs for plain-Node execution.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const wasmPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'query_engine_bg.wasm');
export default Promise.resolve({ default: new WebAssembly.Module(fs.readFileSync(wasmPath)) });
`);
console.log(`Patched ${loaderPath}`);
