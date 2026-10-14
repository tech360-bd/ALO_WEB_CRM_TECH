import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkFindings } from '../scripts/ci/check-secret-findings.mjs';

const fixture = Buffer.from('public upstream dummy fixture');
const digest = createHash('sha256').update(fixture).digest('hex');
const allowlist = [{ path: 'vendor/sample.js', sha256: digest }];

test('suppresses only an exact reviewed upstream file', () => {
  assert.deepEqual(checkFindings('vendor/sample.js:11:dummy content\n', allowlist, () => fixture), {
    findings: [], suppressed: 1,
  });
});

test('changed contents in an allowlisted file fail closed', () => {
  assert.deepEqual(checkFindings('vendor/sample.js:11:sensitive content\n', allowlist, () => Buffer.from('changed')), {
    findings: ['vendor/sample.js:11'], suppressed: 0,
  });
});

test('other files are never excluded, including docs, tests and other vendor files', () => {
  const paths = ['docs/guide.md', 'tests/sample.ts', 'vendor/other.js'];
  const input = paths.map(path => `${path}:1:sensitive content`).join('\n');
  assert.deepEqual(checkFindings(input, allowlist), { findings: paths.map(path => `${path}:1`), suppressed: 0 });
});

test('missing allowlisted file and malformed output fail closed', () => {
  assert.throws(() => checkFindings('vendor/sample.js:11:content', allowlist, () => { throw new Error('missing'); }));
  assert.throws(() => checkFindings('malformed sensitive output', allowlist));
});

test('CLI returns a failure and never prints a matched value', () => {
  const sensitive = 'sensitive-' + 'value-for-output-test';
  const result = spawnSync(process.execPath, ['scripts/ci/check-secret-findings.mjs'], {
    input: `docs/guide.md:8:${sensitive}\n`, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /docs\/guide.md:8/);
  assert.ok(!(result.stdout + result.stderr).includes(sensitive));
});

test('CLI malformed-input error never echoes input', () => {
  const sensitive = 'sensitive malformed scanner text';
  const result = spawnSync(process.execPath, ['scripts/ci/check-secret-findings.mjs'], { input: sensitive, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(!(result.stdout + result.stderr).includes(sensitive));
});


function withScanRepository(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'alo-credential-gate-'));
  try {
    mkdirSync(join(dir, 'scripts/ci'), { recursive: true });
    for (const file of ['scan-credentials.sh', 'check-secret-findings.mjs']) {
      copyFileSync(resolve('scripts/ci', file), join(dir, 'scripts/ci', file));
    }
    writeFileSync(join(dir, 'scripts/ci/secret-scan-allowlist.json'), '[]');
    const initialized = spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' });
    assert.equal(initialized.status, 0);
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('full tracked-file gate scans docs/tests/vendor, fails and redacts credential-shaped strings', () => {
  withScanRepository(dir => {
    const marker = 'ghp_' + 'a'.repeat(36); // constructed synthetic token, never a real credential
    for (const path of ['docs/guide.md', 'tests/fixture.ts', 'vendor/unknown.js']) {
      mkdirSync(join(dir, path.split('/')[0]), { recursive: true });
      writeFileSync(join(dir, path), marker + '\n');
    }
    assert.equal(spawnSync('git', ['add', '.'], { cwd: dir }).status, 0);
    const result = spawnSync('bash', ['scripts/ci/scan-credentials.sh'], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 1);
    for (const path of ['docs/guide.md:1', 'tests/fixture.ts:1', 'vendor/unknown.js:1']) {
      assert.ok(result.stderr.includes(path));
    }
    assert.ok(!(result.stdout + result.stderr).includes(marker));
  });
});

test('full tracked-file gate succeeds with no findings', () => {
  withScanRepository(dir => {
    writeFileSync(join(dir, 'safe.txt'), 'Safe repository content\n');
    assert.equal(spawnSync('git', ['add', 'safe.txt'], { cwd: dir }).status, 0);
    const result = spawnSync('bash', ['scripts/ci/scan-credentials.sh'], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /No unreviewed/);
  });
});

test('git scan errors are not treated as no matches', () => {
  withScanRepository(dir => {
    mkdirSync(join(dir, 'fake-bin'));
    writeFileSync(join(dir, 'fake-bin/git'), '#!/bin/sh\nexit 2\n', { mode: 0o700 });
    const result = spawnSync('/bin/bash', ['scripts/ci/scan-credentials.sh'], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: join(dir, 'fake-bin') + ':' + process.env.PATH },
    });
    assert.equal(result.status, 2);
    assert.match(result.stdout, /refusing to pass the gate/);
  });
});
