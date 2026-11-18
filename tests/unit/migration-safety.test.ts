/**
 * Migration safety — every migration in prisma/migrations must be additive-only
 * for pre-existing tables, or explicitly listed as intentionally destructive.
 *
 * Spec §19/§25: reversible migrations, never drop columns/tables silently, never
 * replace Student IDs. This test cannot prove a restore works (no database is
 * reachable from CI), but it pins the one failure mode we can detect statically:
 * a migration that destroys or rewrites data.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'prisma', 'migrations');

function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

/**
 * Statements that destroy or rewrite data, checked AFTER SQL comments are
 * removed (all matches in historical migrations were comments or commented-out
 * rollbacks). CREATE/ADD/INDEX changes are fine: `DROP INDEX` is not data loss
 * and is allowed; dropping a UNIQUE constraint to re-add it is a schema-shape
 * change, not a data change, and is handled by the reviewed-list below.
 */
const DESTRUCTIVE = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bRENAME\s+TABLE\b/i,
  /\bRENAME\s+COLUMN\b/i,
  /\bALTER\s+TABLE\b[^;]*?\bDROP\s+(COLUMN|CONSTRAINT)\b/is,
];

/**
 * Migrations that were reviewed and intentionally alter or remove structures.
 * Every entry needs a human-readable reason. New destructive migrations fail the
 * test and must be justified here — never added silently.
 */
const REVIEWED_DESTRUCTIVE: Record<string, string> = {
  // Example (keep empty unless an owner approves a destructive migration):
  // '20261101000000_example': 'Owner-approved rename; old column kept for one release.',
};

function migrationSql(): Array<{ dir: string; sql: string }> {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = entry.name;
      try {
        return { dir, sql: readFileSync(join(migrationsDir, dir, 'migration.sql'), 'utf8') };
      } catch {
        return { dir, sql: '' };
      }
    });
}

describe('migration safety (spec §19, §25)', () => {
  const migrations = migrationSql();

  it('finds migrations to check', () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('no migration destroys or rewrites data without an explicit reviewed reason', () => {
    const offenders: string[] = [];
    for (const { dir, sql } of migrations) {
      if (dir in REVIEWED_DESTRUCTIVE) continue;
      if (!sql) continue;
      const executable = stripComments(sql);
      for (const pattern of DESTRUCTIVE) {
        if (pattern.test(executable)) {
          offenders.push(`${dir} matches ${String(pattern)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the contact registry migration only creates new tables and never touches existing ones', () => {
    const target = migrations.find((m) => m.dir === '20261117000000_contact_phones_merge_history');
    expect(target).toBeDefined();
    const sql = stripComments(target!.sql);
    expect(sql).toMatch(/CREATE TABLE\s+`ContactPhone`/);
    expect(sql).toMatch(/CREATE TABLE\s+`ContactMergeHistory`/);
    expect(sql).not.toMatch(/ALTER\s+TABLE/i);
    expect(sql).not.toMatch(/DROP/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
    expect(sql).not.toMatch(/UPDATE\s+\w+\s+SET/i);
  });

  it('no migration rewrites Student ID values', () => {
    const offenders = migrations.filter(({ sql }) =>
      /UPDATE\s+[`\w]+\s+SET\s+[^;]*studentId\s*=/i.test(sql) || /UPDATE\s+[`\w]+\s+SET\s+[^;]*student_id\s*=/i.test(sql),
    );
    expect(offenders.map((m) => m.dir)).toEqual([]);
  });
});
