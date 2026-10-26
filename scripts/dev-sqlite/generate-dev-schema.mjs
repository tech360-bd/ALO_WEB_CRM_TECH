#!/usr/bin/env node
/**
 * Generates prisma/schema.dev.prisma — a SQLite-compatible copy of the
 * production MySQL schema, for running the platform in sandboxes / local dev
 * environments that cannot reach a MySQL server or binaries.prisma.sh.
 *
 * The production schema (prisma/schema.prisma) is NOT modified.
 *
 * Transformations applied:
 *   - datasource provider: mysql -> sqlite
 *   - strip every @db.* native-type attribute (SQLite has no native types on
 *     the scalar level that Prisma needs here: Text/LongText/VarChar)
 *   - rewrite MySQL-only `@default(dbgenerated("(_utf8mb4'X')"))` string
 *     literals into plain Prisma `@default("X")`
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

// ---------------------------------------------------------------------------
// 1. Safety: refuse to transform constructs this script does not understand.
// ---------------------------------------------------------------------------
const unsupported = s.match(/@@fulltext|relationMode|\bDecimal\b|\bBytes\b/g);
if (unsupported && unsupported.length > 0) {
  console.error('Refusing to generate dev schema — unhandled MySQL-specific constructs found:');
  console.error([...new Set(unsupported)].join('\n'));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Rewrite MySQL `dbgenerated` string-literal defaults.
//    `@default(dbgenerated("(_utf8mb4'[]')"))`  ->  `@default("[]")`
//    The inner literal may itself contain escaped double quotes, which are
//    already valid inside a Prisma string, so they pass through untouched.
// ---------------------------------------------------------------------------
let converted = 0;
s = s.replace(
  /@default\(dbgenerated\("\(_\w+'((?:[^'\\]|\\.)*)'\)"\)\)/g,
  (_m, inner) => {
    converted += 1;
    return `@default("${inner}")`;
  },
);

// Any dbgenerated we could not rewrite is a hard stop rather than a silent
// wrong default.
const leftover = s.match(/dbgenerated\(/g);
if (leftover) {
  console.error(
    `Refusing to generate dev schema — ${leftover.length} dbgenerated() default(s) could not be translated. ` +
      'Extend the rewrite above for the new form.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Provider, binaryTargets, native types, preview features.
// ---------------------------------------------------------------------------
s = s.replace(/provider = "mysql"/, 'provider = "sqlite"');
s = s.replace(/^\s*binaryTargets\s*=\s*\[[^\]]*\]\s*$/m, '');
s = s.replace(/generator client \{/, 'generator client {\n  previewFeatures = ["driverAdapters", "queryCompiler"]');
s = s.replace(/[ \t]+@db\.[A-Za-z]+(\([^)]*\))?/g, '');

const header = `/// GENERATED FILE — do not edit by hand.
/// Produced by scripts/dev-sqlite/generate-dev-schema.mjs from prisma/schema.prisma.
/// SQLite development copy of the production MySQL schema.

`;
writeFileSync(out, header + s);
console.log(`Wrote ${out} (${s.length} bytes); translated ${converted} dbgenerated() defaults.`);
