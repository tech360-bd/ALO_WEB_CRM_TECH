import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migration = readFileSync(
  path.join(root, 'prisma/migrations/20261025120000_phd_proposal_builder/migration.sql'),
  'utf8',
);
const sopMigration = readFileSync(
  path.join(root, 'prisma/migrations/20261026120000_phd_sop_builder/migration.sql'),
  'utf8',
);
/** Both Phd migrations, treated as one additive module for coverage purposes. */
const moduleMigration = `${migration}\n${sopMigration}`;
const schema = readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');

function modelNames(): string[] {
  return [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);
}

function tableNames(sql: string): string[] {
  return [...sql.matchAll(/CREATE TABLE `(\w+)`/g)].map((match) => match[1]);
}

function tableBlock(table: string): string {
  const start = migration.indexOf(`CREATE TABLE \`${table}\``);
  expect(start, `${table} table missing`).toBeGreaterThanOrEqual(0);
  return migration.slice(start, migration.indexOf(';', start));
}

describe('PhD migration is additive and complete', () => {
  const phdModels = modelNames().filter((name) => name.startsWith('Phd'));
  const tables = tableNames(moduleMigration);
  const baseTables = tableNames(migration);
  const sopTables = tableNames(sopMigration);

  it('creates one table per Phd model and nothing else', () => {
    // 47 core module tables (2026-10-25) + 4 statement-of-purpose tables (2026-10-26).
    expect(baseTables).toHaveLength(47);
    expect(sopTables).toEqual(['PhdStatementOfPurpose', 'PhdSopSection', 'PhdSopVersion', 'PhdSopReview']);
    expect(phdModels).toHaveLength(51);
    expect(tables).toHaveLength(51);
    expect(new Set(tables)).toEqual(new Set(phdModels));
    expect(tables.every((table) => table.startsWith('Phd'))).toBe(true);
  });

  it('keeps the statement migration additive', () => {
    expect(sopMigration).not.toMatch(/DROP TABLE/);
    expect(sopMigration).not.toMatch(/TRUNCATE/);
    expect(sopMigration).not.toMatch(/DELETE FROM/);
    expect(sopMigration).not.toMatch(/ALTER TABLE `User`/);
    expect(sopMigration).toContain('additive module migration');
  });

  it('never creates or destroys the existing User table', () => {
    expect(migration).not.toMatch(/CREATE TABLE `User`/);
    expect(migration).not.toMatch(/DROP TABLE/);
    expect(migration).not.toMatch(/TRUNCATE/);
    expect(migration).not.toMatch(/DELETE FROM/);
    expect(migration).not.toMatch(/ALTER TABLE `User`/);
  });

  it('gives every table a primary key', () => {
    const blocks = moduleMigration.split('CREATE TABLE').slice(1);
    expect(blocks).toHaveLength(51);
    for (const block of blocks) {
      expect(block).toContain('PRIMARY KEY (');
    }
  });

  it('enforces the compound uniqueness the service layer relies on', () => {
    const expectUnique = (table: string, columns: string[]) => {
      const block = tableBlock(table);
      const tuple = `(${columns.map((column) => `\`${column}\``).join(', ')})`;
      expect(block.includes('UNIQUE INDEX') && block.includes(tuple), `${table} unique on ${columns.join(', ')}`).toBe(true);
    };
    expectUnique('PhdProposalSection', ['proposalId', 'sectionKey']);
    expectUnique('PhdTopicEvaluation', ['topicId', 'criterion']);
    expectUnique('PhdApplication', ['projectId', 'universityId', 'programmeId']);
    expectUnique('PhdSupervisorMatch', ['projectId', 'supervisorId']);
    expectUnique('PhdCommissionPage', ['documentId', 'pageNumber']);
    expectUnique('PhdFundingEligibility', ['opportunityId', 'criterion']);
    expectUnique('PhdDocumentRequirement', ['programmeId', 'documentType']);
    expectUnique('PhdTuitionFee', ['universityId', 'programmeId', 'academicYear', 'studentStatus', 'feeBasis']);
    expectUnique('PhdUniversity', ['registerId']);
    expectUnique('PhdUniversity', ['officialDomain']);
    expectUnique('PhdSupervisor', ['dedupeKey']);
    expectUnique('PhdFundingOpportunity', ['dedupeKey']);
    expectUnique('PhdLiteratureSource', ['dedupeKey']);
  });

  it('stores money as integer minor units, never floating point', () => {
    const moneyColumns = [...moduleMigration.matchAll(/`(\w*[Aa]mount\w*|\w*Stipend\w*|\w*Minor)`\s+(DECIMAL|FLOAT|DOUBLE|REAL)/g)];
    expect(moneyColumns).toEqual([]);
    expect(migration).not.toContain('DECIMAL(');
    expect(schema).not.toContain('Decimal');
  });

  it('uses only Phd foreign keys, plus the four User ownership columns', () => {
    const foreignKeys = [...moduleMigration.matchAll(/ALTER TABLE `(\w+)` ADD CONSTRAINT `(\w+)` FOREIGN KEY \(`(\w+)`\) REFERENCES `(\w+)`/g)];
    expect(foreignKeys.length).toBeGreaterThan(60);
    const nonPhdTargets = foreignKeys.filter((entry) => !entry[4].startsWith('Phd'));
    expect(nonPhdTargets.map((entry) => entry[4])).toEqual(['User', 'User', 'User', 'User']);
    const referencing = nonPhdTargets.map((entry) => entry[1]).sort();
    expect(referencing).toEqual(['PhdDocument', 'PhdNotification', 'PhdProfile', 'PhdProject']);
  });

  it('documents its provenance and target dialect', () => {
    expect(migration).toContain('additive and Phd-only');
    expect(migration).toContain('MySQL 8');
    expect(migration).toContain('integer');
  });
});
