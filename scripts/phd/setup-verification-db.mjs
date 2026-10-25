#!/usr/bin/env node
/**
 * UK PhD Proposal Builder — offline verification database.
 *
 * Production runs on MySQL (prisma/schema.prisma). This script prepares a real
 * SQLite database from the *same* schema so the PhD module's service layer can
 * be exercised against actual rows, constraints and foreign keys in an
 * environment where no MySQL server is reachable.
 *
 * It is a verification harness only: it never changes the production
 * datasource and never runs during a Next.js build.
 *
 * Usage:
 *   node scripts/phd/setup-verification-db.mjs [--fresh]
 *
 * Environment:
 *   PHD_TEST_DB   override the database file (default .phd-tmp/phd-test.db)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fresh = process.argv.includes('--fresh');
const dbFile = process.env.PHD_TEST_DB || path.join(root, '.phd-tmp', 'phd-test.db');
const mirrorSchema = path.join(root, 'prisma', 'verification-mirror', 'schema.sqlite.prisma');

const env = { ...process.env, DATABASE_URL: `file:${dbFile}` };

// Local sandboxes may block binaries.prisma.sh; the repository already vendors
// matching engines for the AI Workforce harness. Reuse them when present.
const vendored = path.join(root, 'imports', 'alo-education-full', 'node_modules', '@prisma', 'engines');
if (existsSync(vendored)) {
  env.PRISMA_SCHEMA_ENGINE_BINARY ??= path.join(vendored, 'schema-engine-debian-openssl-3.0.x');
  env.PRISMA_QUERY_ENGINE_LIBRARY ??= path.join(vendored, 'libquery_engine-debian-openssl-3.0.x.so.node');
}

function run(command, args, label) {
  process.stdout.write(`\n▶ ${label}\n`);
  execFileSync(command, args, { cwd: root, env, stdio: 'inherit' });
}

mkdirSync(path.dirname(dbFile), { recursive: true });
if (fresh && existsSync(dbFile)) {
  rmSync(dbFile, { force: true });
  process.stdout.write(`Removed ${path.relative(root, dbFile)}\n`);
}

run(process.execPath, ['scripts/ai-workforce/mirror-schema.mjs', 'prisma/schema.prisma', 'prisma/verification-mirror/schema.sqlite.prisma'], 'Mirroring Prisma schema to SQLite');

// Always regenerate: the mirror schema changes whenever a model/field changes,
// and a stale verification client silently tests the wrong data model.
run('npx', ['prisma', 'generate', '--schema', mirrorSchema], 'Generating SQLite verification client');

// The repository forbids destructive Prisma flags in any script (see
// tests/unit/critical-safety-remediation.test.ts). A verification database holds
// no production data, so an incompatible schema is resolved by recreating the
// throwaway file rather than by accepting data loss in place.
try {
  run('npx', ['prisma', 'db', 'push', '--schema', mirrorSchema, '--skip-generate'], 'Applying schema to the verification database');
} catch (error) {
  if (existsSync(dbFile)) {
    rmSync(dbFile, { force: true });
    process.stdout.write(`\nThe existing verification database did not match the schema; recreated ${path.relative(root, dbFile)} (disposable, contains no production data).\n`);
    run('npx', ['prisma', 'db', 'push', '--schema', mirrorSchema, '--skip-generate'], 'Applying schema to the recreated verification database');
  } else {
    throw error;
  }
}

process.stdout.write(`\nVerification database ready: ${path.relative(root, dbFile)}\n`);

if (process.argv[1] && process.argv[1].endsWith('setup-verification-db.mjs')) {
  // Executed directly: report the model count so a silent mirror regression is visible.
  const schema = execFileSync(process.execPath, ['-e', `
    const { readFileSync } = require('node:fs');
    const text = readFileSync(${JSON.stringify(mirrorSchema)}, 'utf8');
    const models = (text.match(/^model\\s+\\w+\\s*\\{/gm) || []).length;
    const phd = (text.match(/^model\\s+Phd\\w*\\s*\\{/gm) || []).length;
    console.log('Models: ' + models + ' (PhD: ' + phd + ')');
  `], { cwd: root, env, encoding: 'utf8' });
  process.stdout.write(schema);
}
