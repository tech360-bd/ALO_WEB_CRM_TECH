#!/usr/bin/env node
// Only byte-identical, reviewed PUBLIC third-party fixtures may be suppressed.
// Never print the matched line or a credential value, including on errors.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function checkFindings(input, allowlist, readFile = readFileSync) {
  const reviewed = new Map(allowlist.map(entry => [entry.path, entry.sha256]));
  const hashes = new Map();
  const findings = [];
  let suppressed = 0;
  for (const line of input.split('\n').filter(Boolean)) {
    const match = /^([^:]+):(\d+):/.exec(line);
    if (!match) throw new Error('Malformed scanner output');
    const [, path, lineNumber] = match;
    const expected = reviewed.get(path);
    if (expected) {
      if (!hashes.has(path)) {
        hashes.set(path, createHash('sha256').update(readFile(path)).digest('hex'));
      }
      if (hashes.get(path) === expected) {
        suppressed++;
        continue;
      }
    }
    findings.push(`${path}:${lineNumber}`);
  }
  return { findings, suppressed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const allowlist = JSON.parse(readFileSync(new URL('./secret-scan-allowlist.json', import.meta.url), 'utf8'));
    const input = readFileSync(0, 'utf8');
    const { findings, suppressed } = checkFindings(input, allowlist);
    if (suppressed) console.log(`Reviewed upstream fixture matches: ${suppressed} (exact file SHA-256 verified).`);
    if (findings.length) {
      console.error('::error::Possible committed secrets (locations only; values never echoed):');
      for (const finding of findings) console.error(finding);
      console.error('::error::Real credentials must be rotated even after removal; they remain in Git history.');
      process.exitCode = 1;
    }
  } catch {
    console.error('::error::Secret finding verification failed; refusing to pass the gate.');
    process.exitCode = 1;
  }
}
