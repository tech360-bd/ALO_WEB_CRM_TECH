#!/usr/bin/env node
/**
 * Applies the generated SQLite mirror DDL to the offline verification
 * database. Verification only — production uses prisma/migrations against
 * MySQL. Statements are idempotent (CREATE TABLE IF NOT EXISTS).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';

const file = process.argv[2] || '.awf-tmp/verify-schema.sql';
const url = process.argv[3] || `file:${process.cwd()}/.awf-tmp/verify.db`;

const sql = readFileSync(file, 'utf8');
const statements = sql
  .split(';\n')
  .map((statement) =>
    statement
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim()
  )
  .filter(Boolean);

const client = createClient({ url });
let applied = 0;
let failed = 0;
const errors = [];
for (const statement of statements) {
  try {
    await client.execute(statement);
    applied += 1;
  } catch (error) {
    failed += 1;
    if (errors.length < 10) errors.push(`${statement.slice(0, 90)} -> ${error.message}`);
  }
}
const tables = await client.execute("SELECT count(*) AS c FROM sqlite_master WHERE type='table'");
console.log(JSON.stringify({ statements: statements.length, applied, failed, tables: Number(tables.rows[0].c), errors }, null, 2));
process.exit(failed ? 1 : 0);
