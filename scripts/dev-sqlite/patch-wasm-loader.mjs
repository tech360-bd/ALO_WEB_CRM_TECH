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

// Prisma renamed the bundled artifact between client versions: 6.19.x with the
// `queryCompiler` preview emits `query_compiler_bg.wasm`, older ones emit
// `query_engine_bg.wasm`. Accept either so the sandbox keeps working across
// `prisma generate` runs.
const WASM_CANDIDATES = ['query_compiler_bg.wasm', 'query_engine_bg.wasm'];
const wasmFile = WASM_CANDIDATES.find((f) => existsSync(join(clientDir, f)));

if (!wasmFile) {
  console.error(
    `No Prisma WASM artifact found (looked for ${WASM_CANDIDATES.join(', ')}) — generate the dev client first:`,
  );
  console.error('  npx prisma generate --schema prisma/schema.dev.prisma --config prisma/dev-sqlite.config.ts');
  process.exit(1);
}

writeFileSync(loaderPath, `// Patched by scripts/dev-sqlite/patch-wasm-loader.mjs for plain-Node execution.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const wasmPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ${JSON.stringify(wasmFile)});
export default Promise.resolve({ default: new WebAssembly.Module(fs.readFileSync(wasmPath)) });
`);
console.log(`Patched ${loaderPath} -> ${wasmFile}`);
