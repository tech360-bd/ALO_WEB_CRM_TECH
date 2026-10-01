import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const dirs: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'alo-standalone-test-'));
  dirs.push(root);
  mkdirSync(join(root, 'scripts'));
  cpSync('scripts/verify-standalone.mjs', join(root, 'scripts/verify-standalone.mjs'));
  return root;
}
function file(root: string, relative: string) {
  const p = join(root, relative);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, 'test fixture');
}
function verify(root: string) {
  return spawnSync(process.execPath, [join(root, 'scripts/verify-standalone.mjs')], { encoding: 'utf8' });
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
describe('Standalone artifact verifier', () => {
  it('rejects missing server', () => {
    const r = verify(fixture());
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('server.js');
  });
  it('rejects server-only deployment', () => {
    const root = fixture(); file(root, '.next/standalone/server.js');
    expect(verify(root).stderr).toContain('.next/static');
  });
  it('rejects empty static assets', () => {
    const root = fixture(); file(root, '.next/standalone/server.js');
    mkdirSync(join(root, '.next/standalone/.next/static'), { recursive: true });
    expect(verify(root).status).not.toBe(0);
  });
  it('requires copied public assets when source public exists', () => {
    const root = fixture(); file(root, '.next/standalone/server.js');
    file(root, '.next/standalone/.next/static/test.js'); file(root, 'public/logo.svg');
    expect(verify(root).stderr).toContain('standalone/public');
  });
  it('accepts required nonempty directories without executing fixture code', () => {
    const root = fixture(); file(root, '.next/standalone/server.js');
    file(root, '.next/standalone/.next/static/test.js'); file(root, 'public/logo.svg');
    file(root, '.next/standalone/public/logo.svg');
    expect(verify(root).status).toBe(0);
  });
});
