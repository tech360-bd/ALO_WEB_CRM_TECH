import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * MySQL/InnoDB DDL limits that SQLite accepts silently.
 *
 * The verification mirror is SQLite, so a migration can pass every local test
 * and still fail on a real MySQL 8 database. That is exactly what happened on
 * the first CI run of the module: `PhdTuitionFee` had a five-column unique key
 * of `VARCHAR(191)` columns = 3 820 bytes, over the InnoDB limit of 3 072
 * bytes, and `prisma migrate deploy` aborted with error 1071 on a fresh
 * database. These tests encode the limits so the failure cannot come back.
 */

const root = process.cwd();
const migrationPaths = [
  'prisma/migrations/20261025120000_phd_proposal_builder/migration.sql',
  'prisma/migrations/20261026120000_phd_sop_builder/migration.sql',
];
const migrations = migrationPaths.map((relative) => ({
  relative,
  sql: readFileSync(path.join(root, relative), 'utf8'),
}));
const schema = readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');

/** InnoDB: maximum size of an index key, in bytes (utf8mb4 = 4 bytes per char). */
const MAX_INDEX_BYTES = 3072;
const BYTES_PER_CHAR = 4;
/** MySQL identifier limit. */
const MAX_IDENTIFIER_BYTES = 64;

const FIXED_WIDTH: Record<string, number> = {
  BIGINT: 8,
  INT: 4,
  INTEGER: 4,
  SMALLINT: 2,
  TINYINT: 1,
  MEDIUMINT: 3,
  BOOLEAN: 1,
  BIT: 1,
  DATETIME: 8,
  TIMESTAMP: 8,
  DATE: 3,
  TIME: 3,
  YEAR: 1,
  DOUBLE: 8,
  FLOAT: 4,
  DECIMAL: 16,
};
const LOB_TYPES = new Set(['TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'JSON']);

interface Table {
  name: string;
  columns: Map<string, { type: string; size: number | null }>;
  indexes: Array<{ name: string; columns: string[] }>;
}

function parseTables(sql: string): Table[] {
  const tables: Table[] = [];
  for (const match of sql.matchAll(/CREATE TABLE `(\w+)` \(([\s\S]*?)\n\)[^;]*;/g)) {
    const [, name, body] = match;
    const columns = new Map<string, { type: string; size: number | null }>();
    for (const columnMatch of body.matchAll(/^\s*`(\w+)`\s+([A-Za-z]+)(?:\((\d+)\))?/gm)) {
      columns.set(columnMatch[1], {
        type: columnMatch[2].toUpperCase(),
        size: columnMatch[3] ? Number(columnMatch[3]) : null,
      });
    }
    const indexes: Array<{ name: string; columns: string[] }> = [];
    for (const indexMatch of body.matchAll(/(?:UNIQUE )?(?:INDEX|KEY) `(\w+)`\s*\(([^)]*)\)/g)) {
      indexes.push({
        name: indexMatch[1],
        columns: [...indexMatch[2].matchAll(/`(\w+)`/g)].map((column) => column[1]),
      });
    }
    tables.push({ name, columns, indexes });
  }
  return tables;
}

function columnBytes(column: { type: string; size: number | null }): number {
  if (column.type === 'VARCHAR' || column.type === 'CHAR') {
    return (column.size ?? 255) * BYTES_PER_CHAR;
  }
  if (LOB_TYPES.has(column.type)) return Number.POSITIVE_INFINITY;
  return FIXED_WIDTH[column.type] ?? 8;
}

describe('MySQL migrations stay inside InnoDB limits', () => {
  const tables = migrations.flatMap((migration) => parseTables(migration.sql));

  it('parses every table in both module migrations', () => {
    expect(tables).toHaveLength(51);
  });

  it('never builds an index wider than 3072 bytes', () => {
    const tooWide: string[] = [];
    for (const table of tables) {
      for (const index of table.indexes) {
        const bytes = index.columns.reduce(
          (total, column) => total + columnBytes(table.columns.get(column) ?? { type: 'INT', size: null }),
          0,
        );
        if (bytes > MAX_INDEX_BYTES) tooWide.push(`${table.name}.${index.name} = ${bytes} bytes`);
      }
    }
    expect(tooWide).toEqual([]);
  });

  it('never indexes a TEXT/BLOB/JSON column without a prefix length', () => {
    const offenders: string[] = [];
    for (const table of tables) {
      for (const index of table.indexes) {
        for (const column of index.columns) {
          const definition = table.columns.get(column);
          if (definition && LOB_TYPES.has(definition.type)) {
            offenders.push(`${table.name}.${index.name}(${column})`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps every identifier within the 64-character MySQL limit', () => {
    const offenders: string[] = [];
    for (const table of tables) {
      if (table.name.length > MAX_IDENTIFIER_BYTES) offenders.push(table.name);
      for (const column of table.columns.keys()) {
        if (column.length > MAX_IDENTIFIER_BYTES) offenders.push(`${table.name}.${column}`);
      }
      for (const index of table.indexes) {
        if (index.name.length > MAX_IDENTIFIER_BYTES) offenders.push(`${table.name}.${index.name}`);
      }
    }
    for (const constraint of migrations.flatMap((migration) =>
      [...migration.sql.matchAll(/CONSTRAINT `(\w+)`/g)].map((match) => match[1]),
    )) {
      if (constraint.length > MAX_IDENTIFIER_BYTES) offenders.push(constraint);
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the tuition-fee key inside the limit by capping its columns', () => {
    const table = tables.find((candidate) => candidate.name === 'PhdTuitionFee');
    expect(table).toBeDefined();
    const unique = table!.indexes.find((index) => index.name.startsWith('PhdTuitionFee_universityId_programmeId'));
    expect(unique).toBeDefined();
    const bytes = unique!.columns.reduce(
      (total, column) => total + columnBytes(table!.columns.get(column)!),
      0,
    );
    expect(bytes).toBeLessThanOrEqual(MAX_INDEX_BYTES);
    expect(table!.columns.get('academicYear')).toEqual({ type: 'VARCHAR', size: 16 });
    expect(table!.columns.get('studentStatus')).toEqual({ type: 'VARCHAR', size: 32 });
    expect(table!.columns.get('feeBasis')).toEqual({ type: 'VARCHAR', size: 32 });
  });

  it('declares the same caps in schema.prisma so a diff produces no drift', () => {
    const model = /model PhdTuitionFee \{([\s\S]*?)\n\}/.exec(schema);
    expect(model).not.toBeNull();
    const body = model![1];
    expect(body).toMatch(/academicYear\s+String\s+@db\.VarChar\(16\)/);
    expect(body).toMatch(/studentStatus\s+String\s+@db\.VarChar\(32\)/);
    expect(body).toMatch(/feeBasis\s+String\s+@db\.VarChar\(32\)/);
  });
});
