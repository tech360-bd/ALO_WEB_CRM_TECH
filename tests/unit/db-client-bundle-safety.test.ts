import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Regression guard for the production build.
 *
 * `src/lib/db.ts` is imported by server components, server actions and route
 * handlers across the app, and is therefore transitively reachable from
 * modules that webpack also compiles for the browser target. A *static*
 * `node:` builtin import in this file makes the browser compiler fail the
 * whole production build with:
 *
 *   UnhandledSchemeError: Reading from "node:module" is not handled by plugins
 *
 * That is exactly how CI run 37062551841 failed. The offline-verification
 * branch must therefore reach Node builtins through a runtime lookup that the
 * bundler cannot see (`process.getBuiltinModule`), never through an import
 * statement.
 */
const source = readFileSync(new URL('../../src/lib/db.ts', import.meta.url), 'utf8');

describe('src/lib/db.ts bundler safety', () => {
  it('declares no static import of a node: builtin', () => {
    const offenders = [...source.matchAll(/^\s*import\s[^\n]*?from\s*['"](node:[^'"]+)['"]/gm)].map(
      (m) => m[1],
    );
    expect(offenders).toEqual([]);
  });

  it('declares no bare `require(...)` of a node: builtin', () => {
    const offenders = [...source.matchAll(/\brequire\(\s*['"](node:[^'"]+)['"]\s*\)/g)].map((m) => m[1]);
    expect(offenders).toEqual([]);
  });

  it('reaches the verification-only require through process.getBuiltinModule', () => {
    expect(source).toContain("getBuiltinModule?.('module')");
  });

  it('still gates the SQLite verification adapter behind ALO_DB_DRIVER', () => {
    expect(source).toContain("process.env.ALO_DB_DRIVER === 'sqlite'");
    expect(source).toContain('@prisma/adapter-libsql');
  });

  it('still exports the shared MySQL-backed client as `db`', () => {
    expect(source).toMatch(/export const db\b/);
    expect(source).toContain('new PrismaClient(');
  });
});
