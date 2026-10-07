#!/usr/bin/env node
/**
 * ALO AI Workforce — verification-mirror schema generator.
 *
 * Production runs on MySQL (prisma/schema.prisma is untouched and remains the
 * single source of truth). The offline acceptance harness needs a real,
 * executable relational database so that every §37 "perform action → query the
 * database → verify the record" gate is proved against actual rows rather than
 * mocks.
 *
 * This script derives a byte-for-byte equivalent SQLite mirror of the SAME
 * schema (same models, same fields, same relations) by applying only the
 * mechanical dialect differences:
 *   - datasource provider mysql -> sqlite
 *   - MySQL native string types (@db.Text/@db.LongText/@db.VarChar) dropped
 *   - MySQL `dbgenerated("(_utf8mb4'…')")` defaults -> plain literal defaults
 *   - Json -> String (SQLite has no native JSON column in Prisma)
 *
 * No model, field, relation, unique constraint or index is added or removed,
 * so a passing acceptance run exercises the production data model.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function mirrorSchema(source, { clientOutput } = {}) {
  let out = source;

  // 1. datasource
  out = out.replace(/datasource\s+db\s*\{[\s\S]*?\}/m, (block) =>
    block
      .replace(/provider\s*=\s*"mysql"/, 'provider = "sqlite"')
      .replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = env("DATABASE_URL")')
  );

  // 2. generator — SQLite mirror is always generated without engines because
  //    the harness connects through a driver adapter. Emit the full block the
  //    verification harness requires: custom output, queryCompiler +
  //    driverAdapters preview features and engineType "client". Regeneration
  //    must reproduce the committed mirror, not silently degrade it.
  out = out.replace(/generator\s+client\s*\{[\s\S]*?\}/m, () => {
    const lines = [
      'generator client {',
      '  provider = "prisma-client-js"',
      `  output   = "${clientOutput ?? '../../node_modules/.prisma-sqlite/client'}"`,
      '  previewFeatures = ["queryCompiler", "driverAdapters"]',
      '  engineType      = "client"',
      '}',
    ];
    return lines.join('\n');
  });

  // 3. MySQL-only native type attributes
  out = out.replace(/\s+@db\.(LongText|MediumText|TinyText|Text)\b/g, '');
  out = out.replace(/\s+@db\.VarChar\(\d+\)/g, '');
  out = out.replace(/\s+@db\.Char\(\d+\)/g, '');

  // 4. dbgenerated MySQL literal defaults -> portable literals.
  // Reduce the Prisma source-string escapes in the captured value first
  // (\" is the file-level escape of "), then re-escape for the Prisma string
  // being written. Without the reduction, quoted defaults such as
  // (_utf8mb4'[\"SUPER_ADMIN\"]') were mirrored with doubled backslashes,
  // changing the default value the mirror actually stores.
  out = out.replace(/dbgenerated\("\(_utf8mb4'([\s\S]*?)'\)"\)/g, (_m, value) =>
    `"${value.replace(/\\"/g, '"').replace(/"/g, '\\"')}"`,
  );

  // 5. Json columns -> String (Prisma SQLite has no Json scalar)
  out = out.replace(/^(\s+\w+\s+)Json(\??)(\s*)$/gm, (_m, head, optional, tail) => `${head}String${optional}${tail}`);
  out = out.replace(/^(\s+\w+\s+)Json(\s+)(@|\/\/)/gm, (_m, head, gap, rest) => `${head}String${gap}${rest}`);

  return out;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const source = process.argv[2] || 'prisma/schema.prisma';
  const target = process.argv[3] || 'prisma/verification-mirror/schema.sqlite.prisma';
  mkdirSync(path.dirname(target), { recursive: true });
  const mirrored = mirrorSchema(readFileSync(source, 'utf8'));
  writeFileSync(target, mirrored);
  const models = (mirrored.match(/^model\s+\w+\s*\{/gm) || []).length;
  console.log(`Mirrored ${models} models -> ${target}`);
}
