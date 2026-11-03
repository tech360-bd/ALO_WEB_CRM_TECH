#!/usr/bin/env node
/**
 * Apply database/seed_alo_whatsapp_numbers.sql to the existing MySQL database.
 *
 *   node scripts/seed-alo-whatsapp-numbers.mjs --check   # validate SQL only
 *   node scripts/seed-alo-whatsapp-numbers.mjs           # apply idempotent upsert
 *
 * The script never prints DATABASE_URL, passwords or tokens. It only prints
 * counts. Provider credentials stay in the protected environment and Meta
 * identifiers are configured through the Super Admin number registry UI/API.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SQL_PATH = path.join(ROOT, 'database', 'seed_alo_whatsapp_numbers.sql');
const sql = readFileSync(SQL_PATH, 'utf8');

const rows = [...sql.matchAll(/^\s*\('(alo-wa-\d{11})',\s*'(0\d{10})',\s*'(8801\d{9})'/gm)];
const CODE = sql.replace(/--[^\n]*/g, '');
const ON_DUPLICATE = /ON DUPLICATE KEY UPDATE([\s\S]*)$/i.exec(CODE)?.[1] || '';

function validateSql() {
  const problems = [];
  if (rows.length !== 20) problems.push(`expected 20 records, found ${rows.length}`);
  if (new Set(rows.map((row) => row[2])).size !== rows.length) problems.push('duplicate phoneNumber in seed');
  if (new Set(rows.map((row) => row[3])).size !== rows.length) problems.push('duplicate normalizedPhone in seed');
  if (!/ON DUPLICATE KEY UPDATE/i.test(sql)) problems.push('seed is not idempotent');
  for (const column of ['metaPhoneNumberId', 'metaBusinessAccountId', 'connectionStatus', 'employeeOwnerId', 'branch', 'department', 'isDefaultSender', 'isComplaintSender', 'isFollowUpSender', 'isSupport247']) {
    if (new RegExp(`\`${column}\`\\s*=`, 'i').test(ON_DUPLICATE)) problems.push(`upsert would overwrite ${column}`);
  }
  if (/access[_-]?token|bearer|secret|password/i.test(CODE)) problems.push('seed contains credential-like text');
  if (!/^\s*\('alo-wa-01805020100'.*?'disconnected'/m.test(sql)) problems.push('main row is not disconnected');
  return problems;
}

const problems = validateSql();
if (problems.length) {
  console.error('Seed validation failed:');
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}
if (process.argv.includes('--check')) {
  console.log(`Seed validation PASS: ${rows.length} requested records, idempotent, all inserted disconnected.`);
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL || '';
if (!/^mysql:\/\//.test(databaseUrl)) {
  console.error('DATABASE_URL must be a mysql:// URL. Set it in the protected environment (never in source).');
  process.exit(2);
}

let parsed;
try { parsed = new URL(databaseUrl); } catch {
  console.error('DATABASE_URL could not be parsed.');
  process.exit(2);
}

const mysql = await import('mysql2/promise');
const connection = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port || 3306),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ''),
  multipleStatements: false,
  ssl: process.env.DATABASE_SSL === 'true' ? {} : undefined,
});

try {
  await connection.beginTransaction();
  await connection.query(sql);
  const [countRows] = await connection.query(
    'SELECT COUNT(*) AS total, SUM(connectionStatus = "connected") AS connected FROM `WhatsAppOfficialNumber` WHERE `phoneNumber` BETWEEN ? AND ?',
    ['01805020100', '01805020119'],
  );
  await connection.commit();
  const summary = Array.isArray(countRows) ? countRows[0] : {};
  console.log(`Number registry seed applied. Requested range present: ${summary.total ?? 0}; connected: ${summary.connected ?? 0}.`);
  console.log('Connection status reflects verified provider state only; no ownership or Meta connectivity was assumed.');
} catch (error) {
  await connection.rollback().catch(() => {});
  console.error('Seed failed and was rolled back:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
} finally {
  await connection.end().catch(() => {});
}
