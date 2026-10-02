// ============================================================
// Reconciliation-migration generator
//
// Purpose: the historical migration folder only contains CREATE TABLE
// statements for 404 of the 480 schema models — the remaining tables were
// shaped directly with `prisma db push` (the documented Hostinger flow, see
// worklog clean-install gates). That leaves `prisma migrate deploy` incomplete
// on a fresh database. This script generates an ADDITIVE, IDEMPOTENT
// reconciliation migration (CREATE TABLE IF NOT EXISTS, all indexes and
// foreign keys inline) so that:
//   • existing production databases (already shaped by db push) no-op safely
//   • fresh databases provisioned with `prisma migrate deploy` become complete
//
// Conventions mirror Prisma's own MySQL DDL exactly (see the init migration):
// VARCHAR(191) strings, DATETIME(3), inline UNIQUE INDEX/INDEX, inline
// FOREIGN KEY, ENGINE=InnoDB utf8mb4_unicode_ci.
//
// Usage: node scripts/generate-reconciliation-migration.mjs
// Review the output before committing — never run blindly.
// ============================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCHEMA = readFileSync(join(ROOT, 'prisma/schema.prisma'), 'utf8');

// ── 1. Parse models ──────────────────────────────────────────
function parseSchema(schema) {
  const models = [];
  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m;
  while ((m = modelRe.exec(schema))) {
    const name = m[1];
    const body = m[2];
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    const table = mapMatch ? mapMatch[1] : name;

    const fields = [];
    const lines = body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//') && !l.startsWith('@@'));
    for (const line of lines) {
      const fm = line.match(/^(\w+)\s+([\w\[\]?]+)(\?)?\s*(.*)$/);
      if (!fm) continue;
      const [, fname, ftype, optQ, rest] = fm;
      if (['id', 'unique', 'index', 'relation', 'default', 'map', 'db', 'ignore', 'updatedAt', 'createdAt'].includes(fname) && !rest) continue;
      if (/^(String|Int|BigInt|Float|Decimal|Boolean|DateTime|Json|Bytes)\b/.test(ftype) === false && !/^[A-Z]\w*$/.test(ftype.replace('[]', ''))) continue;
      if (/^@@/.test(line)) continue;
      const field = {
        name: fname,
        type: ftype,
        optional: Boolean(optQ) || ftype.endsWith('?') || ftype.endsWith('[]'),
        isList: ftype.endsWith('[]'),
        isRelation: /^[A-Z]/.test(ftype) && !['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes'].includes(ftype),
        id: /\s@id\b/.test(rest),
        unique: /\s@unique\b/.test(rest),
        default: rest.match(/@default\(([^)]*(?:\([^)]*\))?[^]*)\)\s*$/)?.[1] ?? rest.match(/@default\((.+)\)/)?.[1],
        dbType: rest.match(/@db\.(\w+)/)?.[1],
        relation: rest.match(/@relation\(([^)]*)\)/)?.[1],
        updatedAt: /@updatedAt/.test(rest),
        raw: rest,
      };
      fields.push(field);
    }

    const blockAttrs = {
      unique: [...body.matchAll(/@@unique\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/g)].map((x) => ({ fields: x[1].split(',').map((s) => s.trim()), name: x[2] })),
      index: [...body.matchAll(/@@index\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/g)].map((x) => ({ fields: x[1].split(',').map((s) => s.trim()), name: x[2] })),
    };
    models.push({ name, table, fields, ...blockAttrs });
  }
  return models;
}

// ── 2. Determine which tables the migrations already create ──
function tablesInMigrations() {
  const tables = new Set();
  const migDir = join(ROOT, 'prisma/migrations');
  for (const dir of readdirSync(migDir)) {
    // never count reconciliation migrations themselves (idempotent re-runs)
    if (/reconciliation/i.test(dir)) continue;
    try {
      const sql = readFileSync(join(migDir, dir, 'migration.sql'), 'utf8');
      for (const t of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/gi)) tables.add(t[1]);
    } catch {
      /* not a migration dir */
    }
  }
  return tables;
}

// ── 3. Prisma type → MySQL DDL ───────────────────────────────
function sqlType(f) {
  const base = f.type.replace('[]', '').replace('?', '');
  if (f.isList) return 'JSON';
  switch (base) {
    case 'String': {
      if (f.dbType === 'Text') return 'TEXT';
      if (f.dbType === 'LongText') return 'LONGTEXT';
      if (f.dbType === 'MediumText') return 'MEDIUMTEXT';
      if (f.dbType === 'VarChar') return 'VARCHAR(191)';
      const varCharN = f.dbType?.match(/VarChar\((\d+)\)/);
      if (varCharN) return `VARCHAR(${varCharN[1]})`;
      return 'VARCHAR(191)';
    }
    case 'Int': return 'INTEGER';
    case 'BigInt': return 'BIGINT';
    case 'Float': return 'DOUBLE';
    case 'Boolean': return 'BOOLEAN';
    case 'DateTime': return 'DATETIME(3)';
    case 'Json': return 'JSON';
    case 'Decimal': {
      const dec = f.raw.match(/@db\.Decimal\((\d+),\s*(\d+)\)/);
      return dec ? `DECIMAL(${dec[1]}, ${dec[2]})` : 'DECIMAL(65, 30)';
    }
    default: return 'VARCHAR(191)'; // relation scalar (FK) fields are String by convention here
  }
}

function sqlDefault(f) {
  if (f.default === undefined) return null;
  const d = f.default.trim();
  if (d === 'autoincrement()') return 'AUTO_INCREMENT';
  if (/^cuid\\(\\)$/.test(d) || /^uuid\\(\\)$/.test(d)) return null; // client-generated
  if (d === 'now()') return 'CURRENT_TIMESTAMP(3)';
  if (d === 'dbgenerated()') {
    // MySQL rejects DEFAULT values on TEXT/LONGTEXT/JSON/GEOMETRY.
    // Prisma uses dbgenerated(...) in the schema for portable server defaults,
    // but the reconciliation migration is intentionally additive and must
    // apply cleanly on MySQL 8+. Omit these defaults for LOB-like columns.
    return null;
  }
  if (/^-?\\d+(\\.\\d+)?$/.test(d)) return d;
  if (d === 'true') return 'true';
  if (d === 'false') return 'false';
  if (/^".*"$/.test(d)) return `'${d.slice(1, -1).replace(/'/g, "''")}'`; // string literal -> single-quoted SQL
  return null; // expressions (enum lists etc.) — client-side
}

function mysqlAllowsDefault(type) {
  return !/^(TEXT|TINYTEXT|MEDIUMTEXT|LONGTEXT|JSON|GEOMETRY)$/.test(type);
}

function fkAction(rel, kind) {
  const onDelete = rel.match(/onDelete:\s*(\w+)/)?.[1];
  const onUpdate = rel.match(/onUpdate:\s*(\w+)/)?.[1];
  const map = { Cascade: 'CASCADE', SetNull: 'SET NULL', Restrict: 'RESTRICT', NoAction: 'NO ACTION', SetDefault: 'SET DEFAULT' };
  if (kind === 'delete') return map[onDelete] ?? 'NO ACTION';
  return map[onUpdate] ?? 'CASCADE';
}

// ── 4. Generate ──────────────────────────────────────────────
const models = parseSchema(SCHEMA);
const existing = tablesInMigrations();
const byName = new Map(models.map((m) => [m.name, m]));
const missing = models.filter((m) => !existing.has(m.table));

console.log(`schema models: ${models.length} | tables already in migrations: ${existing.size} | missing: ${missing.length}`);

// Topological-ish ordering: emit referenced tables first (best effort; cycles handled below)
const emitted = new Set(existing);
const ordered = [];
const deferred = [];
const pending = [...missing];
while (pending.length) {
  let progress = false;
  for (let i = 0; i < pending.length; i++) {
    const model = pending[i];
    const deps = model.fields
      .filter((f) => f.isRelation && !f.isList)
      .map((f) => byName.get(f.type.replace('?', ''))?.table)
      .filter((t) => t && !emitted.has(t));
    if (deps.length === 0) {
      ordered.push(model);
      emitted.add(model.table);
      pending.splice(i, 1);
      progress = true;
      break;
    }
  }
  if (!progress) {
    // cycle: pop one and defer its unresolved FKs
    const model = pending.shift();
    deferred.push(model);
    emitted.add(model.table);
  }
}

function tableDDL(model) {
  const cols = [];
  const keys = [];
  const fks = [];
  const deferredFks = [];
  for (const f of model.fields) {
    if (f.isRelation && f.isList) continue; // back-relation: no column
    const type = sqlType(f);
    const dflt = sqlDefault(f);
    let col = '    `' + f.name + '` ' + type;
    if (!f.optional) col += ' NOT NULL';
    if (dflt !== null && dflt !== 'AUTO_INCREMENT' && mysqlAllowsDefault(type)) col += ' DEFAULT ' + dflt;
    if (dflt === 'AUTO_INCREMENT') col += ' AUTO_INCREMENT';
    cols.push(col);
    if (f.id) keys.push('    PRIMARY KEY (`' + f.name + '`)');
    if (f.unique && !f.id) keys.push('    UNIQUE INDEX `' + model.table + '_' + f.name + '_key`(`' + f.name + '`)');
    if (f.isRelation) {
      const targetModel = byName.get(f.type.replace('?', ''));
      if (!targetModel) continue;
      // The FK lives on the side that declares fields: [...]; without it this
      // is the back-relation side and has no column here.
      const localCols = f.relation?.match(/fields:\s*\[([^\]]+)\]/)?.[1]?.split(',').map((x) => x.trim());
      if (!localCols || localCols.length === 0) continue;
      // sanity: every local FK column must exist as a scalar field on this model
      const scalarNames = new Set(model.fields.filter((x) => !x.isRelation || (x.relation && /fields:/.test(x.relation))).map((x) => x.name));
      const allPresent = localCols.every((c) => scalarNames.has(c) || model.fields.some((x) => x.name === c));
      if (!allPresent) {
        deferredNotes.push(`-- NOTE (FK local column missing on ${model.table}.${f.name}: ${localCols.join(',')} — constraint skipped)`);
        continue;
      }
      const refs = f.relation?.match(/references:\s*\[([^\]]+)\]/)?.[1]?.split(',').map((x) => x.trim());
      const targetField = refs?.[0] ?? 'id';
      for (const localCol of localCols) {
        const fk = {
          name: `${model.table}_${localCol}_fkey`,
          col: localCol,
          targetTable: targetModel.table,
          targetCol: targetField,
          onDelete: fkAction(f.relation ?? '', 'delete'),
          onUpdate: fkAction(f.relation ?? '', 'update'),
        };
        if (existing.has(fk.targetTable) || emitted.has(fk.targetTable)) {
          if (targetModel.table !== model.table) fks.push(fk); // self-relations deferred
          else deferredFks.push(fk);
        } else {
          deferredFks.push(fk);
        }
      }
    }
  }
  for (const u of model.unique) {
    const colsU = u.fields.map((c) => '`' + c + '`').join(', ');
    const name = u.name || `${model.table}_${u.fields.join('_')}_key`;
    keys.push('    UNIQUE INDEX `' + name + '`(' + colsU + ')');
  }
  for (const idx of model.index) {
    const colsI = idx.fields.map((c) => '`' + c + '`').join(', ');
    const name = idx.name || `${model.table}_${idx.fields.join('_')}_idx`;
    keys.push('    INDEX `' + name + '`(' + colsI + ')');
  }
  const fkLines = fks.map(
    (fk) => '    FOREIGN KEY (`' + fk.col + '`) REFERENCES `' + fk.targetTable + '`(`' + fk.targetCol + '`) ON DELETE ' + fk.onDelete + ' ON UPDATE ' + fk.onUpdate
  );
  const body = [...cols, ...keys, ...fkLines].join(',\n');
  return { ddl: `CREATE TABLE IF NOT EXISTS \`${model.table}\` (\n${body}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`, deferredFks };
}

const statements = [];
const deferredNotes = [];
for (const model of [...ordered, ...deferred]) {
  const { ddl, deferredFks } = tableDDL(model);
  statements.push('-- CreateTable\n' + ddl);
  for (const fk of deferredFks) {
    deferredNotes.push(
      `-- NOTE (circular/self/unresolved FK, intentionally NOT emitted for idempotency): ${model.table}.${fk.col} -> ${fk.targetTable}.${fk.targetCol}`
    );
  }
}

const header = `-- ============================================================================
-- RECONCILIATION MIGRATION (schema vs migration-history drift)
--
-- The historical migrations create ${existing.size} of ${models.length} schema tables; the
-- remaining ${missing.length} tables were applied historically via \`prisma db push\`
-- (the documented Hostinger flow). This migration makes \`prisma migrate deploy\`
-- complete on fresh databases while staying a NO-OP on databases already
-- shaped by db push: every statement is CREATE TABLE IF NOT EXISTS, carrying every
-- indexes and foreign keys INLINE (no standalone CREATE INDEX / ALTER, which
-- would fail on existing databases).
--
-- Generated by scripts/generate-reconciliation-migration.mjs — review before
-- applying. Additive only: no deletes, no renames, no data changes.
-- ============================================================================
`;

const sql = header + '\n' + statements.join('\n\n') + '\n' + (deferredNotes.length ? '\n' + deferredNotes.join('\n') + '\n' : '');
writeFileSync('/tmp/reconciliation-migration.sql', sql);
console.log(`generated ${statements.length} CREATE TABLE IF NOT EXISTS statements`);
if (deferredNotes.length) console.log(`deferred FK notes: ${deferredNotes.length}`);
