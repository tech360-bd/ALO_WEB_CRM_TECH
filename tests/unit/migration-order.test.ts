// Migration-chain integrity and schema-drift guard.
//
// History: the legacy migration chain (preserved in prisma/legacy-migrations-20261001/)
// could never be applied to a fresh database — its first migration ALTERed tables
// before creation, contained 13 duplicate ADD COLUMNs, and omitted 76 models and
// 404 scalar columns that exist in prisma/schema.prisma. The chain was re-baselined
// on 2026-10-01 with a generated `0_init`.
//
// These tests statically prove the ACTIVE chain stays applicable in order and
// reproduces every scalar column of the schema, so `prisma migrate deploy` on a
// fresh MySQL database cannot silently drift from the Prisma client expectations.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const migrationsDir = join(repoRoot, 'prisma', 'migrations');
const schemaPath = join(repoRoot, 'prisma', 'schema.prisma');

type SqlState = Map<string, Set<string>>; // table -> columns

function migrationDirs(): string[] {
  return readdirSync(migrationsDir)
    .filter((d) => existsSync(join(migrationsDir, d, 'migration.sql')))
    .sort();
}

function applySql(state: SqlState, sql: string, dir: string, violations: string[]): void {
  // `CREATE TABLE IF NOT EXISTS` is valid MySQL and is used by the additive
  // reconciliation migrations, which intentionally re-declare tables that may
  // already exist on databases shaped by an earlier `prisma db push`.
  for (const m of sql.matchAll(/CREATE TABLE (IF NOT EXISTS )?`(\w+)` \(([\s\S]*?)\n\)/g)) {
    const idempotent = Boolean(m[1]);
    const table = m[2];
    if (state.has(table) && !idempotent) violations.push(`${dir}: CREATE TABLE ${table} duplicates an earlier CREATE`);
    const cols = new Set<string>(state.get(table) ?? []);
    for (const line of m[3].split('\n')) {
      const cm = line.match(/^\s*`(\w+)`\s+/);
      if (cm && !/(PRIMARY KEY|UNIQUE INDEX|INDEX|FOREIGN KEY|CONSTRAINT)/.test(line)) cols.add(cm[1]);
    }
    state.set(table, cols);
  }
  // Scan each complete ALTER TABLE statement, not just a leading run of ADD
  // clauses: MySQL allows MODIFY/INDEX/other clauses before ADD COLUMN, and the
  // schema simulator must still account for every added scalar column.
  for (const m of sql.matchAll(/ALTER TABLE `(\w+)`([\s\S]*?);/g)) {
    const table = m[1];
    const additions = [...m[2].matchAll(/\bADD\s+COLUMN\s+`(\w+)`/g)];
    if (!additions.length) continue;
    if (!state.has(table)) { violations.push(`${dir}: ALTER TABLE ${table} before it exists`); continue; }
    for (const cm of additions) {
      const col = cm[1];
      if (state.get(table)!.has(col)) violations.push(`${dir}: ADD COLUMN ${table}.${col} duplicates an existing column`);
      else state.get(table)!.add(col);
    }
  }
  for (const m of sql.matchAll(/DROP TABLE (?:IF EXISTS )?`(\w+)`/g)) state.delete(m[1]);
  for (const m of sql.matchAll(/REFERENCES `(\w+)`\s*\(/g)) {
    if (!state.has(m[1])) violations.push(`${dir}: FOREIGN KEY references ${m[1]} before it exists`);
  }
}

function simulateChain(): { state: SqlState; violations: string[]; dirs: string[] } {
  const state: SqlState = new Map();
  const violations: string[] = [];
  const dirs = migrationDirs();
  for (const dir of dirs) {
    applySql(state, readFileSync(join(migrationsDir, dir, 'migration.sql'), 'utf8'), dir, violations);
  }
  return { state, violations, dirs };
}

function schemaScalarColumns(): Map<string, Set<string>> {
  const schema = readFileSync(schemaPath, 'utf8');
  const result = new Map<string, Set<string>>();
  for (const m of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
    const [, modelName, body] = m;
    const mapMatch = body.match(/@@map\("(\w+)"\)/);
    const table = mapMatch ? mapMatch[1] : modelName;
    const cols = new Set<string>();
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('@@') || trimmed.startsWith('//')) continue;
      const fm = trimmed.match(/^(\w+)\s+(\S+)/);
      if (!fm) continue;
      const [, fieldName, fieldType] = fm;
      if (fieldType.startsWith('[')) continue; // relation list
      if (trimmed.includes('@relation')) continue;
      const base = fieldType.replace(/[\]?]/g, '');
      if (/^[A-Z]/.test(base) && !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt'].includes(base)) continue; // model-typed relation
      cols.add(fieldName);
    }
    result.set(table, cols);
  }
  return result;
}

describe('prisma migration chain (re-baselined 2026-10-01)', () => {
  it('starts from the generated 0_init baseline', () => {
    const dirs = migrationDirs();
    expect(dirs.length).toBeGreaterThan(0);
    expect(dirs[0]).toBe('0_init');
    // The legacy chain must stay out of the active directory.
    expect(existsSync(join(repoRoot, 'prisma', 'legacy-migrations-20261001'))).toBe(true);
  });

  it('parses single- and multi-column ADD COLUMN statements once while still rejecting duplicates', () => {
    const state: SqlState = new Map([['User', new Set(['id'])], ['Document', new Set(['id'])]]);
    const violations: string[] = [];
    applySql(state, 'ALTER TABLE `User`\n  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false;\nALTER TABLE `Document`\n  ADD COLUMN `mimeType` VARCHAR(191) NULL,\n  ADD COLUMN `fileHash` VARCHAR(191) NULL;', 'parser-fixture', violations);
    expect(violations).toEqual([]);
    expect(state.get('User')?.has('emailVerified')).toBe(true);
    expect(state.get('Document')).toEqual(new Set(['id', 'mimeType', 'fileHash']));

    const mixedAlterViolations: string[] = [];
    applySql(state, 'ALTER TABLE `User`\n  MODIFY COLUMN `id` VARCHAR(191) NOT NULL,\n  ADD COLUMN `role` VARCHAR(191) NULL;', 'parser-mixed-fixture', mixedAlterViolations);
    expect(mixedAlterViolations).toEqual([]);
    expect(state.get('User')?.has('role')).toBe(true);

    const duplicateViolations: string[] = [];
    applySql(state, 'ALTER TABLE `User`\n  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false;', 'parser-duplicate-fixture', duplicateViolations);
    expect(duplicateViolations).toContain('parser-duplicate-fixture: ADD COLUMN User.emailVerified duplicates an existing column');
  });

  it('applies every ALTER TABLE only after the target exists, with no duplicate columns', () => {
    const { violations } = simulateChain();
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('creates every schema table and scalar column (no silent drift)', () => {
    const { state } = simulateChain();
    const schemaTables = schemaScalarColumns();
    const missingTables: string[] = [];
    const missingColumns: string[] = [];
    for (const [table, cols] of schemaTables) {
      const produced = state.get(table);
      if (!produced) { missingTables.push(table); continue; }
      for (const col of cols) if (!produced.has(col)) missingColumns.push(`${table}.${col}`);
    }
    expect(missingTables).toEqual([]);
    expect(missingColumns).toEqual([]);
  });

  it('keeps history value and evidence URL fields as TEXT in Prisma and the migration', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    const migration = readFileSync(join(migrationsDir, '20261007010000_university_monitoring_history', 'migration.sql'), 'utf8');
    const newline = String.fromCharCode(10);

    for (const table of ['UniversityHistory', 'CourseHistory', 'ScholarshipHistory']) {
      const modelText = schema.split('model ' + table + ' {')[1];
      const modelBody = modelText?.split(newline + '}')[0];
      const tableText = migration.split('CREATE TABLE IF NOT EXISTS `' + table + '` (')[1];
      const tableBody = tableText?.split(newline + ')')[0];
      expect(modelBody, `${table} Prisma model`).toBeDefined();
      expect(tableBody, `${table} migration table`).toBeDefined();

      for (const column of ['oldValue', 'newValue']) {
        const field = modelBody?.split(newline).find((line) => line.trimStart().startsWith(column + ' '));
        expect(field, `${table}.${column}`).toContain('@db.Text');
        expect(tableBody).toContain('`' + column + '` TEXT NULL');
      }

      const sourceUrl = modelBody?.split(newline).find((line) => line.trimStart().startsWith('sourceUrl '));
      expect(sourceUrl, `${table}.sourceUrl`).toContain('@db.Text');
      expect(tableBody).toContain('`sourceUrl` TEXT NOT NULL');
    }
  });

  it('stores the monitoring job description as TEXT for long operator guidance', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    const modelText = schema.split('model MonitoringJob {')[1];
    const modelBody = modelText?.split(String.fromCharCode(10) + '}')[0];
    const description = modelBody?.split(String.fromCharCode(10)).find((line) => line.trimStart().startsWith('description '));
    const migration = readFileSync(join(migrationsDir, '20261008020000_monitoring_job_description_text', 'migration.sql'), 'utf8');

    expect(description).toContain('@db.Text');
    expect(migration).toContain('ALTER TABLE `MonitoringJob` MODIFY `description` TEXT NULL;');
  });

  it('stores complete conflict evidence in long text while preserving its default', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    const modelText = schema.split('model DataConflict {')[1];
    const modelBody = modelText?.split(String.fromCharCode(10) + '}')[0];
    const field = modelBody?.split(String.fromCharCode(10)).find((line) => line.trimStart().startsWith('conflictingValues '));
    const migration = readFileSync(join(migrationsDir, '20261008030000_data_conflict_values_longtext', 'migration.sql'), 'utf8');

    expect(field).toContain('@db.LongText');
    expect(migration).toContain("MODIFY `conflictingValues` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]')");
  });

  it('0_init is unedited Prisma-generated SQL (regenerated header intact)', () => {
    const init = readFileSync(join(migrationsDir, '0_init', 'migration.sql'), 'utf8');
    expect(init).toContain('prisma migrate diff --from-empty --to-schema-datamodel');
    // Deterministic spot checks that the baseline covers families the legacy
    // chain never created (76 models were missing before the re-baseline).
    // ApplicationCasI20Coe maps to application_cas_i20_coe and CourseIntake
    // maps to course_intakes via @@map.
    for (const table of ['WhatsAppContact', 'EmployeeLeaveBalance', 'application_cas_i20_coe', 'course_intakes', 'VideoProject', 'english_tests', 'EmployeeHR']) {
      expect(stateHasTable(table), `table ${table}`).toBe(true);
    }
  });
});

function stateHasTable(table: string): boolean {
  return simulateChain().state.has(table);
}
