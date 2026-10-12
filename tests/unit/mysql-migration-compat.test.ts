/**
 * MySQL 8.4 compatibility guard for the Prisma migration chain.
 *
 * Why this exists: `prisma migrate deploy` on a FRESH MySQL 8 database failed in
 * CI because 20261002010000_reconciliation_missing_tables declared literal
 * defaults on LONGTEXT/TEXT columns:
 *
 *     `oldValue` LONGTEXT NOT NULL DEFAULT '{}'
 *
 * MySQL rejects that with ERROR 1101 "BLOB, TEXT, GEOMETRY or JSON column can't
 * have a default value". Only *expression* defaults (MySQL 8.0.13+) are legal:
 *
 *     `oldValue` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}')
 *
 * The failure was invisible on databases that already had the tables, because
 * every statement is `CREATE TABLE IF NOT EXISTS` and MySQL skips definition
 * processing when the table exists — so it only ever broke fresh databases.
 *
 * These tests are static (no database required) and run on every push.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');
const LOB = '(?:LONGTEXT|MEDIUMTEXT|TINYTEXT|TEXT|JSON|LONGBLOB|MEDIUMBLOB|TINYBLOB|BLOB)';

function migrationFiles(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, file: path.join(MIGRATIONS_DIR, e.name, 'migration.sql') }))
    .filter((m) => existsSync(m.file))
    .map((m) => ({ name: m.name, sql: readFileSync(m.file, 'utf8') }));
}

const migrations = migrationFiles();

describe('MySQL migration chain', () => {
  it('has migrations to check', () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('declares no literal default on a BLOB/TEXT/JSON column (MySQL error 1101)', () => {
    // A legal default is either `DEFAULT (expr)` or `DEFAULT NULL`.
    const offenders: string[] = [];
    const re = new RegExp('`(\\w+)`\\s+' + LOB + '(?:\\s+NOT NULL|\\s+NULL)?\\s+DEFAULT\\s+(?!\\()(?!NULL)(\\S+)', 'g');
    for (const { name, sql } of migrations) {
      for (const m of sql.matchAll(re)) offenders.push(`${name}: \`${m[1]}\` DEFAULT ${m[2]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('uses the Prisma-native expression-default representation for LOB defaults', () => {
    // Prisma emits `DEFAULT (_utf8mb4'...')`. Staying byte-identical to what
    // Prisma generates is what keeps `migrate diff` empty in the CI drift check.
    const bad: string[] = [];
    const re = new RegExp('`(\\w+)`\\s+' + LOB + '(?:\\s+NOT NULL|\\s+NULL)?\\s+DEFAULT\\s+\\(([^)]*)\\)', 'g');
    for (const { name, sql } of migrations) {
      for (const m of sql.matchAll(re)) {
        if (!m[2].startsWith('_utf8mb4') && !/^CURRENT_TIMESTAMP/i.test(m[2])) {
          bad.push(`${name}: \`${m[1]}\` DEFAULT (${m[2]})`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('never indexes a BLOB/TEXT column without a prefix length (MySQL error 1170)', () => {
    const offenders: string[] = [];
    for (const { name, sql } of migrations) {
      for (const tm of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? `(\w+)` \(([\s\S]*?)\n\)/g)) {
        const [, table, body] = tm;
        const lobCols = new Set([...body.matchAll(new RegExp('`(\\w+)`\\s+' + LOB + '\\b', 'g'))].map((m) => m[1]));
        if (lobCols.size === 0) continue;
        for (const im of body.matchAll(/(?:UNIQUE )?INDEX `\w+`\(([^)]*(?:\(\d+\))?[^)]*)\)/g)) {
          for (const cm of im[1].matchAll(/`(\w+)`(\(\d+\))?/g)) {
            if (lobCols.has(cm[1]) && !cm[2]) offenders.push(`${name}.${table}.${cm[1]}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps every CREATE TABLE in the reconciliation migration idempotent', () => {
    // It must stay a no-op on databases already shaped by `prisma db push`.
    const recon = migrations.find((m) => m.name.includes('reconciliation_missing_tables'));
    expect(recon, 'reconciliation migration should exist').toBeTruthy();
    const creates = [...recon!.sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? `(\w+)`/g)];
    expect(creates.length).toBeGreaterThan(0);
    const nonIdempotent = creates.filter((m) => !m[0].includes('IF NOT EXISTS')).map((m) => m[1]);
    expect(nonIdempotent).toEqual([]);
  });

  it('keeps the reconciliation migration additive only (no destructive statements)', () => {
    const recon = migrations.find((m) => m.name.includes('reconciliation_missing_tables'))!;
    const destructive = /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|RENAME\s+TABLE)\b/gi;
    expect(recon.sql.match(destructive) ?? []).toEqual([]);
  });

  it('declares no estimated row size over the InnoDB 65535-byte limit', () => {
    const offenders: string[] = [];
    for (const { name, sql } of migrations) {
      for (const tm of sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? `(\w+)` \(([\s\S]*?)\n\)/g)) {
        const [, table, body] = tm;
        let bytes = 0;
        for (const vm of body.matchAll(/`\w+`\s+VARCHAR\((\d+)\)/g)) bytes += Number(vm[1]) * 4 + 2;
        bytes += [...body.matchAll(new RegExp('`\\w+`\\s+' + LOB + '\\b', 'g'))].length * 20;
        if (bytes > 65535) offenders.push(`${name}.${table}: ~${bytes} bytes`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
