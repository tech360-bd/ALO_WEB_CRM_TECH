#!/usr/bin/env node
/**
 * ALO Education — narrow drift normaliser for MySQL LOB expression defaults.
 *
 *   node scripts/ci/filter-lob-default-drift.mjs <drift.sql> [schema.prisma]
 *
 * WHY THIS EXISTS
 * ---------------
 * MySQL cannot give a BLOB/TEXT/JSON column a literal default; since 8.0.13 it
 * accepts an *expression* default instead, which Prisma writes as:
 *
 *     `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'')
 *
 * MySQL stores that expression in its own normalised form. When
 * `prisma migrate diff --from-migrations --to-schema-datamodel` compares the
 * shadow database against schema.prisma, the round-tripped representation does
 * not match textually, so Prisma emits a no-op re-assertion:
 *
 *     ALTER TABLE `AgentAuditLog` MODIFY `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'');
 *
 * That is the single known false positive. Everything else is real drift.
 *
 * WHAT THIS DOES *NOT* DO
 * -----------------------
 * It does not ignore tables, columns, all MODIFY statements, indexes, or
 * anything else, and it never downgrades drift to a warning. A statement is
 * suppressed ONLY when every one of its MODIFY clauses is proven to re-assert
 * what schema.prisma already declares:
 *
 *   - the column's Prisma field carries exactly the same
 *     `@default(dbgenerated("(_utf8mb4'...')"))` expression, AND
 *   - nullability in the ALTER matches the field's optionality, AND
 *   - the SQL type matches the field's `@db.*` attribute.
 *
 * Anything that fails any of those checks — including a nullability change or a
 * type change that happens to mention a LOB default — remains fatal.
 *
 * Exit 0: no real drift (benign re-assertions are reported and suppressed).
 * Exit 1: real drift remains; the offending statements are printed.
 */
import { readFileSync } from 'node:fs';

const LOB_TYPES = new Set(['LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT', 'TEXT', 'JSON', 'LONGBLOB', 'MEDIUMBLOB', 'TINYBLOB', 'BLOB']);

/** Prisma `@db.X` attribute -> MySQL column type. */
const DB_ATTR_TO_SQL = {
  LongText: 'LONGTEXT',
  MediumText: 'MEDIUMTEXT',
  TinyText: 'TINYTEXT',
  Text: 'TEXT',
  Json: 'JSON',
  LongBlob: 'LONGBLOB',
  MediumBlob: 'MEDIUMBLOB',
  TinyBlob: 'TINYBLOB',
  Blob: 'BLOB',
};

/**
 * Parse schema.prisma into: tableName -> columnName -> field descriptor.
 * Handles `@@map`, `@map`, optionality and `@default(dbgenerated("..."))`.
 */
export function parseSchema(schemaText) {
  const tables = new Map();
  for (const m of schemaText.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const [, modelName, body] = m;
    const mapMatch = body.match(/@@map\(\s*"([^"]+)"\s*\)/);
    const tableName = mapMatch ? mapMatch[1] : modelName;
    const columns = new Map();
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
      if (!fieldMatch) continue;
      const [, fieldName, , isList, optional, rest] = fieldMatch;
      if (isList) continue;
      const colMap = rest.match(/@map\(\s*"([^"]+)"\s*\)/);
      const dbAttr = rest.match(/@db\.(\w+)/);
      const dbgen = rest.match(/@default\(\s*dbgenerated\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*\)/);
      columns.set(colMap ? colMap[1] : fieldName, {
        optional: Boolean(optional),
        sqlType: dbAttr ? DB_ATTR_TO_SQL[dbAttr[1]] ?? null : null,
        dbgenerated: dbgen ? dbgen[1].replace(/\\"/g, '"') : null,
      });
    }
    tables.set(tableName, columns);
  }
  return tables;
}

/** Split a SQL script into statements, dropping comment-only content. */
export function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((l) => !/^\s*--/.test(l))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Decide whether one `ALTER TABLE ... MODIFY ...` statement is a known-benign
 * re-assertion of a LOB expression default already declared in schema.prisma.
 */
export function classifyStatement(statement, tables) {
  const head = statement.match(/^ALTER TABLE\s+`(\w+)`\s+([\s\S]+)$/i);
  if (!head) return { benign: false, reason: 'not an ALTER TABLE statement' };
  const [, table, clausesText] = head;

  const columns = tables.get(table);
  if (!columns) return { benign: false, reason: `table \`${table}\` not found in schema.prisma` };

  // Every clause must be a MODIFY. A single ADD/DROP/CHANGE makes it real drift.
  const clauses = clausesText
    .split(/,\s*(?=MODIFY\b)/i)
    .map((c) => c.trim())
    .filter(Boolean);
  if (clauses.length === 0) return { benign: false, reason: 'no clauses parsed' };

  for (const clause of clauses) {
    const m = clause.match(/^MODIFY\s+`(\w+)`\s+(\w+)\s*(NOT NULL|NULL)?\s*DEFAULT\s+\((_utf8mb4'(?:[^']|'')*')\)$/i);
    if (!m) return { benign: false, reason: `clause is not a pure LOB expression-default re-assertion: ${clause}` };

    const [, column, sqlType, nullability, expr] = m;
    if (!LOB_TYPES.has(sqlType.toUpperCase())) {
      return { benign: false, reason: `\`${column}\` is ${sqlType}, not a BLOB/TEXT/JSON type` };
    }

    const field = columns.get(column);
    if (!field) return { benign: false, reason: `column \`${table}\`.\`${column}\` not found in schema.prisma` };

    const wanted = `(${expr})`;
    if (field.dbgenerated !== wanted) {
      return {
        benign: false,
        reason: `\`${table}\`.\`${column}\`: schema.prisma default is ${field.dbgenerated ?? '<none>'}, ALTER asserts ${wanted}`,
      };
    }
    const alterNotNull = (nullability ?? '').toUpperCase() === 'NOT NULL';
    if (alterNotNull === field.optional) {
      return {
        benign: false,
        reason: `\`${table}\`.\`${column}\`: nullability change (schema optional=${field.optional}, ALTER says ${nullability ?? 'unspecified'})`,
      };
    }
    if (field.sqlType && field.sqlType !== sqlType.toUpperCase()) {
      return {
        benign: false,
        reason: `\`${table}\`.\`${column}\`: type change (schema @db => ${field.sqlType}, ALTER says ${sqlType.toUpperCase()})`,
      };
    }
  }
  return { benign: true, reason: 'LOB expression default already declared identically in schema.prisma' };
}

export function analyse(driftSql, schemaText) {
  const tables = parseSchema(schemaText);
  const statements = splitStatements(driftSql);
  const benign = [];
  const real = [];
  for (const statement of statements) {
    const verdict = classifyStatement(statement, tables);
    (verdict.benign ? benign : real).push({ statement, reason: verdict.reason });
  }
  return { benign, real, total: statements.length };
}

// ── CLI ──
const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
  const [driftPath, schemaPath = 'prisma/schema.prisma'] = process.argv.slice(2);
  if (!driftPath) {
    console.error('usage: filter-lob-default-drift.mjs <drift.sql> [schema.prisma]');
    process.exit(2);
  }
  const { benign, real, total } = analyse(readFileSync(driftPath, 'utf8'), readFileSync(schemaPath, 'utf8'));

  if (benign.length > 0) {
    console.log(
      `Suppressed ${benign.length} known MySQL LOB expression-default re-assertion(s) ` +
        '(round-trip representation difference; schema.prisma already declares the identical default).',
    );
    for (const b of benign.slice(0, 5)) console.log(`  · ${b.statement.slice(0, 140)}`);
    if (benign.length > 5) console.log(`  · ...and ${benign.length - 5} more`);
  }

  if (real.length > 0) {
    console.error(`::error::Migration chain does NOT reproduce schema.prisma — ${real.length} of ${total} drift statement(s) are real.`);
    for (const r of real.slice(0, 10)) {
      console.error(`  ✖ ${r.reason}`);
      console.error(`    ${r.statement.slice(0, 300)}`);
    }
    process.exit(1);
  }

  console.log(`✓ No real drift (${total} statement(s) examined, all benign).`);
}
