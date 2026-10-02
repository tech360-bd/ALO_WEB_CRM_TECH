#!/usr/bin/env node
/**
 * ALO AI Workforce — deterministic DDL emitter.
 *
 * Produces CREATE TABLE statements for a set of Prisma models directly from the
 * generated Prisma DMMF plus the `@@index` / `@@unique` / `@@map` block
 * attributes parsed out of the schema text.
 *
 * Two uses:
 *   --dialect mysql  : emit the production migration body for the Awf* tables.
 *   --dialect sqlite : emit the full verification-mirror schema used by the
 *                      offline acceptance harness (see run-verification.mjs).
 *
 * This exists because the Prisma schema engine binary cannot be downloaded in
 * every environment; the DDL is derived from the same DMMF Prisma Client uses,
 * so it cannot silently drift from the schema.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const out = { dialect: 'mysql', prefix: '', schema: 'prisma/schema.prisma', out: '', client: '@prisma/client' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      out[key] = value;
      i += 1;
    }
  }
  if (!['mysql', 'sqlite'].includes(out.dialect)) throw new Error('dialect must be mysql or sqlite');
  return out;
}

/** Parse @@index / @@unique / @@map / @@id from the schema text per model. */
export function parseBlockAttributes(schemaText) {
  const result = new Map();
  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match;
  while ((match = modelRe.exec(schemaText)) !== null) {
    const [, name, body] = match;
    const indexes = [];
    const uniques = [];
    // Field-level `@unique` parsed from the schema text rather than read from
    // DMMF `field.isUnique`: that flag is absent from clients generated with
    // `engineType = "client"` (query-compiler builds), which would silently
    // drop every single-column UNIQUE constraint from the emitted DDL.
    const fieldUniques = [];
    let compositeId = null;
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) continue;
      const idx = trimmed.match(/^@@index\(\[([^\]]+)\]/);
      if (idx) indexes.push(idx[1].split(',').map((f) => f.trim().split('(')[0]));
      const uniq = trimmed.match(/^@@unique\(\[([^\]]+)\]/);
      if (uniq) uniques.push(uniq[1].split(',').map((f) => f.trim()));
      const cid = trimmed.match(/^@@id\(\[([^\]]+)\]/);
      if (cid) compositeId = cid[1].split(',').map((f) => f.trim());
      if (trimmed.startsWith('@@')) continue;
      const fieldDecl = trimmed.match(/^(\w+)\s+\S+/);
      if (fieldDecl && /(^|\s)@unique(\s|\(|$)/.test(trimmed)) fieldUniques.push(fieldDecl[1]);
    }
    result.set(name, { indexes, uniques, fieldUniques, compositeId });
  }
  return result;
}

const MYSQL_TYPES = {
  String: (native) => {
    if (!native) return 'VARCHAR(191)';
    const [kind, args] = native;
    if (kind === 'Text') return 'TEXT';
    if (kind === 'LongText') return 'LONGTEXT';
    if (kind === 'MediumText') return 'MEDIUMTEXT';
    if (kind === 'VarChar') return `VARCHAR(${args?.[0] ?? 191})`;
    if (kind === 'Char') return `CHAR(${args?.[0] ?? 191})`;
    return 'VARCHAR(191)';
  },
  Int: () => 'INTEGER',
  BigInt: () => 'BIGINT',
  Float: () => 'DOUBLE',
  Decimal: () => 'DECIMAL(65,30)',
  Boolean: () => 'BOOLEAN',
  DateTime: () => 'DATETIME(3)',
  Json: () => 'JSON',
  Bytes: () => 'LONGBLOB',
};

/** MySQL 8.x does not permit defaults on TEXT/LONGTEXT/BLOB/JSON/GEOMETRY
 *  columns. Keep this rule explicit in the emitter so generated MySQL DDL cannot
 *  reproduce the reconciliation-migration failure (error 1101). */
const MYSQL_TEXT_TYPES = new Set(['TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT']);

const SQLITE_TYPES = {
  String: () => 'TEXT',
  Int: () => 'INTEGER',
  BigInt: () => 'BIGINT',
  Float: () => 'REAL',
  Decimal: () => 'DECIMAL',
  Boolean: () => 'BOOLEAN',
  DateTime: () => 'DATETIME',
  // The SQLite verification mirror declares MySQL `Json` columns as `String`,
  // so they must land on a TEXT-affinity column for the mirror Prisma Client
  // to read them back as strings.
  Json: () => 'TEXT',
  Bytes: () => 'BLOB',
};

/**
 * Guard against a degraded DMMF.
 *
 * Clients generated with `engineType = "client"` (the query-compiler build used
 * by the SQLite verification mirror) ship a *minimal* datamodel: scalar fields
 * carry only `name`/`kind`/`type`, with `isId`, `isRequired`, `isUnique`,
 * `hasDefaultValue` and `nativeType` all absent. Emitting DDL from that produces
 * tables with no primary keys, no NOT NULL and no defaults — which still
 * "applies" cleanly and only explodes later at the first upsert. Fail loudly
 * instead, and make callers point `--client` at a full-metadata client.
 */
export function assertFullDmmf(dmmf, clientPath) {
  const model = dmmf?.datamodel?.models?.find((m) => m.fields?.some((f) => f.kind === 'scalar'));
  if (!model) throw new Error(`DMMF from ${clientPath} contains no scalar fields.`);
  const field = model.fields.find((f) => f.kind === 'scalar');
  const missing = ['isRequired', 'isId', 'isUnique', 'hasDefaultValue'].filter((k) => !(k in field));
  if (missing.length > 0) {
    throw new Error(
      `DMMF from "${clientPath}" is degraded: scalar fields are missing [${missing.join(', ')}]. ` +
        'This happens with `engineType = "client"` (query-compiler) clients. ' +
        'Point --client at a client generated with the default engine type (e.g. @prisma/client).',
    );
  }
}

function literal(value, dialect) {
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return null;
}

/** Translate a Prisma default into a dialect default clause, or null. */
export function defaultClause(field, dialect) {
  if (!field.hasDefaultValue) return null;
  const def = field.default;
  if (def && typeof def === 'object' && !Array.isArray(def)) {
    if (def.name === 'now') return dialect === 'mysql' ? 'DEFAULT CURRENT_TIMESTAMP(3)' : 'DEFAULT CURRENT_TIMESTAMP';
    if (def.name === 'autoincrement') return null; // handled on the column type
    if (def.name === 'cuid' || def.name === 'uuid') return null; // generated by Prisma Client
    if (def.name === 'dbgenerated') {
      const raw = String(def.args?.[0] ?? '');
      const inner = raw.match(/_utf8mb4'([\s\S]*)'\)?$/);
      const text = inner ? inner[1] : '';
      return `DEFAULT ${literal(text, dialect)}`;
    }
    return null;
  }
  if (Array.isArray(def)) return null; // list defaults are not used in this schema
  const rendered = literal(def, dialect);
  return rendered === null ? null : `DEFAULT ${rendered}`;
}

export function emitModel(model, attrs, dialect, options = {}) {
  const relaxNotNull = options.relaxNotNull === true;
  const table = model.dbName || model.name;
  const types = dialect === 'mysql' ? MYSQL_TYPES : SQLITE_TYPES;
  const quote = dialect === 'mysql' ? (s) => `\`${s}\`` : (s) => `"${s}"`;
  const cols = [];
  const scalars = model.fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum');
  for (const field of scalars) {
    const column = field.dbName || field.name;
    const isAutoInc = field.hasDefaultValue && field.default?.name === 'autoincrement';
    let type = (types[field.type] || (() => 'TEXT'))(field.nativeType);
    if (isAutoInc) type = dialect === 'mysql' ? 'INTEGER AUTO_INCREMENT' : 'INTEGER';
    let def = defaultClause(field, dialect);
    if (def && dialect === 'mysql' && MYSQL_TEXT_TYPES.has(type)) {
      const value = def.replace(/^DEFAULT\s+/, '');
      def = `DEFAULT (_utf8mb4${value})`;
    }
    const required = field.isRequired && (!relaxNotNull || field.isId || def !== null || isAutoInc);
    const parts = [quote(column), type];
    if (required) parts.push('NOT NULL');
    else if (!field.isRequired) parts.push('NULL');
    if (def) parts.push(def);
    if (dialect === 'sqlite' && field.isId) parts.push('PRIMARY KEY');
    cols.push(`    ${parts.join(' ')}`);
  }

  const byName = new Map(scalars.map((f) => [f.name, f]));
  const singleUniqueNames = new Set([
    ...scalars.filter((f) => f.isUnique).map((f) => f.name),
    ...(attrs?.fieldUniques || []).filter((n) => byName.has(n)),
  ]);
  const singleUnique = [...singleUniqueNames].map((n) => [byName.get(n).dbName || n]);
  // De-duplicate by column tuple: a field declared `@unique` *and* repeated in
  // a single-column `@@unique([...])` would otherwise emit the same index name
  // twice, which MySQL rejects outright.
  const uniques = [];
  const seenUnique = new Set();
  for (const parts of [...singleUnique, ...(attrs?.uniques || [])]) {
    const key = parts.join('\u0000');
    if (seenUnique.has(key)) continue;
    seenUnique.add(key);
    uniques.push(parts);
  }
  const idField = model.fields.find((f) => f.isId);

  const trailing = [];
  if (dialect === 'mysql') {
    // Prisma emits index definitions inline in CREATE TABLE; MySQL has no
    // `CREATE INDEX IF NOT EXISTS`, so inline is also the only idempotent form.
    for (const parts of uniques) {
      trailing.push(`    UNIQUE INDEX \`${`${table}_${parts.join('_')}_key`.slice(0, 64)}\`(${parts.map(quote).join(', ')})`);
    }
    for (const parts of attrs?.indexes || []) {
      trailing.push(`    INDEX \`${`${table}_${parts.join('_')}_idx`.slice(0, 64)}\`(${parts.map(quote).join(', ')})`);
    }
    if (attrs?.compositeId?.length) trailing.push(`    PRIMARY KEY (${attrs.compositeId.map(quote).join(', ')})`);
    else if (idField) trailing.push(`    PRIMARY KEY (${quote(idField.dbName || idField.name)})`);
  } else if (attrs?.compositeId?.length) {
    trailing.push(`    PRIMARY KEY (${attrs.compositeId.map(quote).join(', ')})`);
  }

  const body = trailing.length ? `${cols.join(',\n')},\n\n${trailing.join(',\n')}` : cols.join(',\n');
  const statements = [];
  statements.push(
    dialect === 'mysql'
      ? `CREATE TABLE \`${table}\` (\n${body}\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      : `CREATE TABLE IF NOT EXISTS "${table}" (\n${body}\n);`
  );

  if (dialect === 'sqlite') {
    for (const parts of uniques) {
      const name = `${table}_${parts.join('_')}_key`.slice(0, 60);
      statements.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${quote(name)} ON ${quote(table)} (${parts.map(quote).join(', ')});`);
    }
    for (const parts of attrs?.indexes || []) {
      const name = `${table}_${parts.join('_')}_idx`.slice(0, 60);
      statements.push(`CREATE INDEX IF NOT EXISTS ${quote(name)} ON ${quote(table)} (${parts.map(quote).join(', ')});`);
    }
  }
  return statements.join('\n');
}

export function emitAll({ dmmf, schemaText, dialect, filter, relaxNotNull }) {
  const attrs = parseBlockAttributes(schemaText);
  const models = dmmf.datamodel.models.filter((m) => (filter ? filter(m) : true));
  const header = [
    `-- ALO AI Workforce DDL (${dialect})`,
    `-- Generated from the Prisma DMMF by scripts/ai-workforce/emit-ddl.mjs`,
    `-- Models: ${models.length}`,
    '',
  ].join('\n');
  return `${header}${models.map((m) => emitModel(m, attrs.get(m.name), dialect, { relaxNotNull })).join('\n\n')}\n`;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const args = parseArgs(process.argv.slice(2));
  const { Prisma } = require(args.client);
  assertFullDmmf(Prisma.dmmf, args.client);
  const schemaText = readFileSync(args.schema, 'utf8');
  const prefix = args.prefix;
  const sql = emitAll({
    dmmf: Prisma.dmmf,
    schemaText,
    dialect: args.dialect,
    filter: prefix ? (m) => m.name.startsWith(prefix) : undefined,
    relaxNotNull: args.dialect === 'sqlite',
  });
  if (args.out) {
    writeFileSync(args.out, sql);
    console.log(`Wrote ${args.out}`);
  } else {
    process.stdout.write(sql);
  }
}
