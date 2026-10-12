#!/usr/bin/env node
/**
 * Generates prisma/schema.dev.prisma — a SQLite-compatible copy of the
 * production MySQL schema, for running the platform in sandboxes / local dev
 * environments that cannot reach a MySQL server or binaries.prisma.sh.
 *
 * The production schema (prisma/schema.prisma) is NOT modified.
 *
 * Transformations applied (verified safe for this schema on 2026-09-28):
 *   - datasource provider: mysql -> sqlite
 *   - strip @db.Text / @db.LongText native-type attributes (SQLite TEXT)
 *   - drop binaryTargets (irrelevant for the WASM query compiler)
 *   - enable previewFeatures = ["driverAdapters", "queryCompiler"] so that
 *     client generation and runtime work fully offline (WASM engines shipped
 *     inside the prisma / @prisma/client npm packages).
 *
 * Usage: node scripts/dev-sqlite/generate-dev-schema.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = resolve(root, 'prisma', 'schema.prisma');
const out = resolve(root, 'prisma', 'schema.dev.prisma');

let s = readFileSync(src, 'utf8');

// Safety: refuse to transform constructs this script does not understand.
const unsupported = s.match(/@db\.(?!Text\b|LongText\b)[A-Za-z]+|@@fulltext|dbgenerated\(|\bDecimal\b|relationMode/g);
if (unsupported && unsupported.length > 0) {
  console.error('Refusing to generate dev schema — unhandled MySQL-specific constructs found:');
  console.error([...new Set(unsupported)].join('\n'));
  process.exit(1);
}

s = s.replace(/provider = "mysql"/, 'provider = "sqlite"');
s = s.replace(/^\s*binaryTargets\s*=\s*\[[^\]]*\]\s*$/m, '');
s = s.replace(/generator client \{/, 'generator client {\n  previewFeatures = ["driverAdapters", "queryCompiler"]');
s = s.replace(/[ \t]+@db\.(Text|LongText)\b/g, '');

const header = `/// GENERATED FILE — do not edit by hand.
/// Produced by scripts/dev-sqlite/generate-dev-schema.mjs from prisma/schema.prisma.
/// SQLite development copy of the production MySQL schema.

`;
writeFileSync(out, header + s);
console.log(`Wrote ${out} (${s.length} bytes)`);
