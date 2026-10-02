/**
 * The drift normaliser must suppress ONLY the known MySQL LOB
 * expression-default round-trip difference, and must keep every other kind of
 * drift fatal. These tests are the contract that stops it quietly widening.
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain ESM script without type declarations
import { parseSchema, splitStatements, classifyStatement, analyse } from '../../scripts/ci/filter-lob-default-drift.mjs';

const SCHEMA = `
model AgentAuditLog {
  id       String @id
  before   String @default(dbgenerated("(_utf8mb4'')")) @db.LongText
  after    String @default(dbgenerated("(_utf8mb4'')")) @db.LongText
  metadata String @default(dbgenerated("(_utf8mb4'{}')")) @db.LongText
  note     String? @db.Text
  title    String @db.VarChar(191)
}

model Renamed {
  id    String @id
  value String @default(dbgenerated("(_utf8mb4'[]')")) @db.Text
  other String @map("other_col") @default(dbgenerated("(_utf8mb4'')")) @db.Text

  @@map("renamed_table")
}
`;

const tables = parseSchema(SCHEMA);

describe('schema parsing', () => {
  it('honours @@map for the table name', () => {
    expect(tables.has('renamed_table')).toBe(true);
    expect(tables.has('Renamed')).toBe(false);
  });

  it('honours @map for the column name', () => {
    expect(tables.get('renamed_table').has('other_col')).toBe(true);
  });

  it('captures the dbgenerated expression and the @db type', () => {
    const f = tables.get('AgentAuditLog').get('metadata');
    expect(f.dbgenerated).toBe("(_utf8mb4'{}')");
    expect(f.sqlType).toBe('LONGTEXT');
    expect(f.optional).toBe(false);
  });

  it('marks optional fields', () => {
    expect(tables.get('AgentAuditLog').get('note').optional).toBe(true);
  });
});

describe('benign suppression (the one allowed normalisation)', () => {
  it('suppresses a single-column re-assertion', () => {
    const s = "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'')";
    expect(classifyStatement(s, tables).benign).toBe(true);
  });

  it('suppresses a multi-column re-assertion', () => {
    const s =
      "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),\n" +
      "    MODIFY `after` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),\n" +
      "    MODIFY `metadata` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}')";
    expect(classifyStatement(s, tables).benign).toBe(true);
  });

  it('suppresses through @@map / @map indirection', () => {
    const s = "ALTER TABLE `renamed_table` MODIFY `other_col` TEXT NOT NULL DEFAULT (_utf8mb4'')";
    expect(classifyStatement(s, tables).benign).toBe(true);
  });
});

describe('real drift stays fatal', () => {
  const cases: Array<[string, string]> = [
    ['a different default value', "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'CHANGED')"],
    ['a nullability change', "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NULL DEFAULT (_utf8mb4'')"],
    ['a type change', "ALTER TABLE `AgentAuditLog` MODIFY `before` TEXT NOT NULL DEFAULT (_utf8mb4'')"],
    ['a non-LOB column', "ALTER TABLE `AgentAuditLog` MODIFY `title` VARCHAR(191) NOT NULL DEFAULT (_utf8mb4'')"],
    ['a column absent from schema.prisma', "ALTER TABLE `AgentAuditLog` MODIFY `ghost` LONGTEXT NOT NULL DEFAULT (_utf8mb4'')"],
    ['a table absent from schema.prisma', "ALTER TABLE `NoSuchTable` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'')"],
    ['a field with no dbgenerated default', "ALTER TABLE `AgentAuditLog` MODIFY `note` TEXT NOT NULL DEFAULT (_utf8mb4'')"],
    ['DROP COLUMN', 'ALTER TABLE `AgentAuditLog` DROP COLUMN `before`'],
    ['ADD COLUMN', 'ALTER TABLE `AgentAuditLog` ADD COLUMN `extra` VARCHAR(191) NOT NULL'],
    ['DROP TABLE', 'DROP TABLE `AgentAuditLog`'],
    ['CREATE INDEX', 'CREATE INDEX `idx` ON `AgentAuditLog`(`title`)'],
    ['DROP INDEX', 'DROP INDEX `idx` ON `AgentAuditLog`'],
    ['a mixed statement with one real clause', "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4''), DROP COLUMN `after`"],
    ['a literal (illegal) default', "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT ''"],
  ];

  it.each(cases)('keeps %s fatal', (_label, statement) => {
    expect(classifyStatement(statement, tables).benign).toBe(false);
  });
});

describe('analyse()', () => {
  it('reports an all-benign script as clean', () => {
    const drift = [
      '-- AlterTable',
      "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'');",
      '-- AlterTable',
      "ALTER TABLE `renamed_table` MODIFY `value` TEXT NOT NULL DEFAULT (_utf8mb4'[]');",
    ].join('\n');
    const r = analyse(drift, SCHEMA);
    expect(r.real).toEqual([]);
    expect(r.benign).toHaveLength(2);
  });

  it('surfaces a real statement hiding among benign ones', () => {
    const drift = [
      "ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'');",
      'ALTER TABLE `AgentAuditLog` DROP COLUMN `after`;',
    ].join('\n');
    const r = analyse(drift, SCHEMA);
    expect(r.benign).toHaveLength(1);
    expect(r.real).toHaveLength(1);
    expect(r.real[0].statement).toContain('DROP COLUMN');
  });

  it('treats an empty (comment-only) drift script as clean', () => {
    expect(analyse('-- nothing to do\n\n', SCHEMA)).toMatchObject({ real: [], benign: [], total: 0 });
  });

  it('ignores comments when splitting', () => {
    expect(splitStatements('-- c\nSELECT 1;\n-- d\nSELECT 2;')).toEqual(['SELECT 1', 'SELECT 2']);
  });
});
