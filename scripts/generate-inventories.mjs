#!/usr/bin/env node
// ============================================================
// Generate CSV inventories for the ALO Education ERP project.
// Outputs:
//   DATABASE-INVENTORY.csv        (Prisma models + field counts)
//   ROUTE-INVENTORY.csv           (Next.js page routes)
//   API-INVENTORY.csv             (Next.js API routes)
//   ENVIRONMENT-VARIABLE-INVENTORY.csv
//   MIGRATION-INVENTORY.csv
// ============================================================

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'remediation-work', 'inventories');
import { mkdirSync } from 'node:fs';
mkdirSync(OUT_DIR, { recursive: true });

function csvEscape(s) {
  if (s == null) return '';
  const str = String(s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function row(...cols) { return cols.map(csvEscape).join(','); }

// ── DATABASE-INVENTORY.csv ─────────────────────────────────
function buildDatabaseInventory() {
  const schemaPath = join(ROOT, 'prisma', 'schema.prisma');
  const schema = readFileSync(schemaPath, 'utf8');
  const lines = schema.split('\n');

  const models = [];
  let currentModel = null;
  let fieldCount = 0;
  let relationCount = 0;
  let lineNo = 0;

  for (const line of lines) {
    lineNo++;
    const m = line.match(/^model\s+(\w+)\s*\{/);
    if (m) {
      currentModel = { name: m[1], startLine: lineNo, fields: [], relations: [] };
      fieldCount = 0;
      relationCount = 0;
      continue;
    }
    if (currentModel && line.trim() === '}') {
      models.push({
        name: currentModel.name,
        startLine: currentModel.startLine,
        fieldCount,
        relationCount,
      });
      currentModel = null;
      continue;
    }
    if (currentModel) {
      const trimmed = line.trim();
      // Skip comments, decorators, blank lines, block headers
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;
      // Field definition (name + type)
      const fm = trimmed.match(/^(\w+)\s+(\w+)/);
      if (fm) {
        fieldCount++;
        const isRelation = /^[A-Z]/.test(fm[2]) && !['String', 'Int', 'BigInt', 'Boolean', 'DateTime', 'Json', 'Float', 'Decimal', 'Bytes'].includes(fm[2]);
        if (isRelation) relationCount++;
      }
    }
  }

  const csv = ['model_name,start_line,field_count,relation_count'];
  for (const m of models) csv.push(row(m.name, m.startLine, m.fieldCount, m.relationCount));
  writeFileSync(join(OUT_DIR, 'DATABASE-INVENTORY.csv'), csv.join('\n') + '\n');
  console.log(`DATABASE-INVENTORY.csv: ${models.length} models`);
  return models.length;
}

// ── ROUTE-INVENTORY.csv + API-INVENTORY.csv ───────────────
function buildRouteInventories() {
  const appDir = join(ROOT, 'src', 'app');
  const pages = [];
  const apis = [];

  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) {
        walk(p);
      } else if (e === 'page.tsx' || e === 'page.ts') {
        const rel = p.replace(appDir + '/', '').replace(/\/page\.tsx?$/, '');
        const url = rel === '' ? '/' : '/' + rel.replace(/\[([^\]]+)\]/g, ':$1');
        pages.push({ file: `src/app/${rel}/${e}`, url });
      } else if (e === 'route.ts' || e === 'route.tsx') {
        const rel = p.replace(appDir + '/', '').replace(/\/route\.tsx?$/, '');
        const url = rel.replace(/^api\//, '/api/').replace(/\[([^\]]+)\]/g, ':$1');
        // Detect HTTP methods
        const content = readFileSync(p, 'utf8');
        const methods = [];
        for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
          const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\s*=`);
          if (re.test(content)) methods.push(m);
        }
        // Detect auth usage
        const usesWithAuth = /withAuth\s*\(/.test(content);
        const usesAuthenticateRequest = /authenticateRequest\s*\(/.test(content);
        const auth = usesWithAuth ? 'withAuth' : (usesAuthenticateRequest ? 'authenticateRequest' : 'none');
        apis.push({ file: `src/app/${rel}/route.ts`, url, methods: methods.join('|'), auth });
      }
    }
  }
  walk(appDir);

  // Pages CSV
  const pagesCsv = ['file,url'];
  for (const p of pages) pagesCsv.push(row(p.file, p.url));
  writeFileSync(join(OUT_DIR, 'ROUTE-INVENTORY.csv'), pagesCsv.join('\n') + '\n');
  console.log(`ROUTE-INVENTORY.csv: ${pages.length} pages`);

  // APIs CSV
  const apisCsv = ['file,url,methods,auth'];
  for (const a of apis) apisCsv.push(row(a.file, a.url, a.methods, a.auth));
  writeFileSync(join(OUT_DIR, 'API-INVENTORY.csv'), apisCsv.join('\n') + '\n');
  console.log(`API-INVENTORY.csv: ${apis.length} routes`);
  return { pages: pages.length, apis: apis.length };
}

// ── ENVIRONMENT-VARIABLE-INVENTORY.csv ───────────────────
function buildEnvInventory() {
  const envExamplePath = join(ROOT, '.env.example');
  const envExample = readFileSync(envExamplePath, 'utf8');
  const rows = ['name,example_value,used_in_code'];
  const usedIn = {};

  // Scan src/ for process.env.X usage
  const srcDir = join(ROOT, 'src');
  function scanUsage(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) scanUsage(p);
      else if (/\.(ts|tsx|js|mjs)$/.test(e)) {
        const content = readFileSync(p, 'utf8');
        const matches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
        for (const m of matches) {
          const name = m[1];
          if (!usedIn[name]) usedIn[name] = [];
          usedIn[name].push(p.replace(ROOT + '/', ''));
        }
      }
    }
  }
  scanUsage(srcDir);
  // Also scan scripts/, prisma/
  for (const d of ['scripts', 'prisma']) {
    scanUsage(join(ROOT, d));
  }

  for (const line of envExample.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.substring(0, eq).trim();
    const value = trimmed.substring(eq + 1).trim();
    const usage = (usedIn[name] || []).join('; ');
    rows.push(row(name, value, usage || '(not referenced in code)'));
  }

  writeFileSync(join(OUT_DIR, 'ENVIRONMENT-VARIABLE-INVENTORY.csv'), rows.join('\n') + '\n');
  console.log(`ENVIRONMENT-VARIABLE-INVENTORY.csv: ${rows.length - 1} variables`);
}

// ── MIGRATION-INVENTORY.csv ──────────────────────────────
function buildMigrationInventory() {
  const migDir = join(ROOT, 'prisma', 'migrations');
  const rows = ['migration_id,sql_file,size_bytes,applied'];
  let entries;
  try { entries = readdirSync(migDir); } catch {
    writeFileSync(join(OUT_DIR, 'MIGRATION-INVENTORY.csv'), rows.join('\n') + '\n');
    console.log('MIGRATION-INVENTORY.csv: 0 (no migrations dir)');
    return;
  }
  for (const e of entries.sort()) {
    const p = join(migDir, e);
    const st = statSync(p);
    if (!st.isDirectory()) continue;
    const sqlPath = join(p, 'migration.sql');
    let size = 0;
    if (existsSync(sqlPath)) size = statSync(sqlPath).size;
    rows.push(row(e, 'migration.sql', size, 'pending verification'));
  }
  writeFileSync(join(OUT_DIR, 'MIGRATION-INVENTORY.csv'), rows.join('\n') + '\n');
  console.log(`MIGRATION-INVENTORY.csv: ${rows.length - 1} migrations`);
}

// ── Run all ───────────────────────────────────────────────
console.log('Generating inventories...');
buildDatabaseInventory();
buildRouteInventories();
buildEnvInventory();
buildMigrationInventory();
console.log('Done.');
