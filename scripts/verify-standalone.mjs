import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { assertNoPublicUploads } from './lib/public-upload-guard.mjs';
const root = resolve(import.meta.dirname, '..');
assertNoPublicUploads(join(root, 'public'));
assertNoPublicUploads(join(root, '.next/standalone/public'));
for (const [relative, directory] of [
  ['.next/standalone/server.js', false],
  ['.next/standalone/.next/static', true],
  ...(existsSync(join(root, 'public')) ? [['.next/standalone/public', true]] : []),
]) {
  const p = join(root, relative);
  if (!existsSync(p) || (directory ? !lstatSync(p).isDirectory() || !readdirSync(p).length : !lstatSync(p).isFile() || !lstatSync(p).size)) {
    throw new Error(`Standalone verification failed: missing or empty ${relative}`);
  }
}
const buildId = join(root, '.next/standalone/.next/BUILD_ID');
if (!existsSync(buildId) || !readFileSync(buildId, 'utf8').trim()) {
  throw new Error('Standalone verification failed: missing or empty BUILD_ID');
}
for (const relative of ['routes-manifest.json', 'prerender-manifest.json', 'required-server-files.json', 'server/pages-manifest.json', 'server/app-paths-manifest.json']) {
  try {
    const manifest = JSON.parse(readFileSync(join(root, '.next/standalone/.next', relative), 'utf8'));
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('expected an object');
  } catch {
    throw new Error(`Standalone verification failed: missing, empty or invalid ${relative}`);
  }
}
console.log('Standalone server, build ID, runtime manifests, static assets and public directory verified');
