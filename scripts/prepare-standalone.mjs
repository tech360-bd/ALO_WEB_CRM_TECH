// Cross-platform standalone preparation script.
import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TOP_NEXT_DIR = join(ROOT, '.next');
const STANDALONE_DIR = join(TOP_NEXT_DIR, 'standalone');
const STANDALONE_NEXT_DIR = join(STANDALONE_DIR, '.next');
const STATIC_SOURCE = join(TOP_NEXT_DIR, 'static');
const PUBLIC_SOURCE = join(ROOT, 'public');
const STATIC_TARGET = join(STANDALONE_NEXT_DIR, 'static');
const PUBLIC_TARGET = join(STANDALONE_DIR, 'public');

console.log('[prepare-standalone] Preparing standalone production assets...');

mkdirSync(STANDALONE_DIR, { recursive: true });
mkdirSync(STANDALONE_NEXT_DIR, { recursive: true });

if (existsSync(STATIC_SOURCE)) {
  cpSync(STATIC_SOURCE, STATIC_TARGET, { recursive: true });
  console.log('[prepare-standalone] ✓ Copied .next/static → .next/standalone/.next/static');
}

if (existsSync(PUBLIC_SOURCE)) {
  cpSync(PUBLIC_SOURCE, PUBLIC_TARGET, { recursive: true });
  console.log('[prepare-standalone] ✓ Copied public/ → .next/standalone/public');
}

// Copy build manifests to top-level .next directory if present in standalone
if (existsSync(STANDALONE_NEXT_DIR)) {
  cpSync(STANDALONE_NEXT_DIR, TOP_NEXT_DIR, { recursive: true, preserveTimestamps: true });
  console.log('[prepare-standalone] ✓ Synchronized .next/standalone/.next → .next');
}

if (!existsSync(join(STANDALONE_DIR, 'server.js'))) {
  throw new Error('[prepare-standalone] Missing generated .next/standalone/server.js. Ensure next.config uses output: "standalone".');
}

console.log('[prepare-standalone] ✓ Verified generated .next/standalone/server.js');
console.log('[prepare-standalone] Done.');

await import('./verify-standalone.mjs');
