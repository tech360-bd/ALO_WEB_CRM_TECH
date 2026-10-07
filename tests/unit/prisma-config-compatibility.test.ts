import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const configRequire = createRequire(require.resolve('@prisma/config'));
const { deepmerge } = configRequire('deepmerge-ts');

describe('scoped Prisma config merge dependency upgrade', () => {
  it('preserves standard nested object, array and undefined merge behavior', () => {
    expect(deepmerge({ a: { b: 1 }, arr: [1], keep: 'value' }, { a: { c: 2 }, arr: [2], keep: undefined }))
      .toEqual({ a: { b: 1, c: 2 }, arr: [1, 2], keep: 'value' });
  });

  it('handles a recursive object graph without stack exhaustion', () => {
    const a: Record<string, unknown> = { value: 1 };
    a.self = a;
    expect(() => deepmerge(a, { extra: true })).not.toThrow();
  });

  it('loads a real Prisma config file through c12 and its configured merger', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'alo-prisma-config-'));
    try {
      writeFileSync(join(dir, 'prisma.config.ts'), 'export default { schema: "prisma/schema.prisma" };');
      const { loadConfigFromFile } = require('@prisma/config');
      const result = await loadConfigFromFile({ configRoot: dir });
      expect(result.error).toBeUndefined();
      expect(result.config.schema).toBe(join(dir, 'prisma/schema.prisma'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('loads the project schema and seed command without production credentials', async () => {
    const { loadConfigFromFile } = require('@prisma/config');
    const result = await loadConfigFromFile({ configRoot: process.cwd() });
    expect(result.error).toBeUndefined();
    expect(result.config.schema).toBe(join(process.cwd(), 'prisma/schema.prisma'));
    expect(result.config.migrations.seed).toBe('tsx prisma/seed-complete.ts');
    expect(result.config.deprecatedPackageJson).toBeNull();
  });
});
