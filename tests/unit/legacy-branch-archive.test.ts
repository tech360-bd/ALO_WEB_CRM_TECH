import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve('imports/legacy-branch-references');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return lstatSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('legacy branch preservation without runtime activation', () => {
  it('inventories every changed path from each pinned legacy commit', () => {
    expect(manifest.runtimeEnabled).toBe(false);
    expect(manifest.baselineCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.branches.map((branch: any) => [branch.branch, branch.entries.length])).toEqual([
      ['integration/ai-builder-alo-verified-20261013', 451],
      ['integration/ai-builder-full-20261013', 739],
      ['other-ai-builder-2026-09-13', 747],
    ]);
    for (const branch of manifest.branches) {
      expect(branch.commit).toMatch(/^[a-f0-9]{40}$/);
      expect(new Set(branch.entries.map((entry: any) => entry.sourcePath)).size).toBe(branch.entries.length);
    }
  });

  it('keeps materialized references inert, non-executable and hash-verified', () => {
    const expected = new Set([join(root, 'README.md'), join(root, 'manifest.json')]);
    for (const branch of manifest.branches) {
      for (const entry of branch.entries) {
        expect(entry.sourcePath).not.toMatch(/(^\/|(^|\/)\.\.(\/|$))/);
        expect(entry.sourceBlob).toMatch(/^[a-f0-9]{40}$/);
        expect(['archived', 'existing-identical-blob', 'omitted-runtime-artifact']).toContain(entry.kind);
        if (entry.kind === 'archived') {
          const path = resolve(root, entry.archivePath);
          expect(path.startsWith(root + sep)).toBe(true);
          expect(path).toMatch(/\.(txt|asset)$/);
          const stat = lstatSync(path);
          expect(stat.isSymbolicLink()).toBe(false);
          expect(stat.mode & 0o111).toBe(0);
          const content = readFileSync(path);
          expect(createHash('sha256').update(content).digest('hex')).toBe(entry.sha256);
          for (const number of entry.redactedLines) {
            expect(content.toString('utf8').split('\n')[number - 1]).toBe('[REDACTED: potential embedded credential in legacy reference]');
          }
          expected.add(path);
        } else if (entry.kind === 'existing-identical-blob') {
          // References are to the pinned baseline, not an assertion that live
          // source must stay unchanged forever after this integration.
          expect(entry.existingPath).not.toMatch(/(^\/|(^|\/)\.\.(\/|$))/);
          expect(entry.existingPath.length).toBeGreaterThan(0);
        } else {
          expect(entry.sourcePath).toMatch(/(^storage\/|\.pid$)/);
        }
      }
    }
    expect(new Set(files(root))).toEqual(expected);
  });

  it('explicitly excludes the archive from production file tracing', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    expect(config).toContain('outputFileTracingExcludes:');
    expect(config).toContain("'*': ['./imports/legacy-branch-references/**/*']");
    expect(readFileSync('prisma/schema.prisma', 'utf8')).toMatch(/provider\s*=\s*"mysql"/);
  });
});
