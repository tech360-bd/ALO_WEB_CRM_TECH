import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const [relative, directory] of [
  ['.next/standalone/server.js', false],
  ['.next/standalone/.next/static', true],
  ...(existsSync(join(root, 'public')) ? [['.next/standalone/public', true]] : []),
]) {
  const p = join(root, relative);
  if (!existsSync(p) || (directory ? !lstatSync(p).isDirectory() || !readdirSync(p).length : !lstatSync(p).isFile())) {
    throw new Error(`Standalone verification failed: missing or empty ${relative}`);
  }
}
console.log('Standalone server, static assets and public directory verified');
