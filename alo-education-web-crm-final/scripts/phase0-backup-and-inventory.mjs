// Phase 0: Backup and Inventory
// Creates timestamped backups of critical files and generates inventory reports.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, writeFile, mkdir, readdir, stat, copyFile, access } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { execSync } from 'node:child_process';

const TS_CODE_DESCRIPTIONS = {
  TS18048: 'Value is possibly undefined',
  TS2304: 'Cannot find name',
  TS2305: 'Module has no exported member',
  TS2307: 'Cannot find module',
  TS2322: 'Type is not assignable to type',
  TS2339: 'Property does not exist on type',
  TS2345: 'Argument is not assignable to parameter',
  TS2348: 'Value is not a constructor — cannot be used as new',
  TS2352: 'Conversion of type may be a mistake',
  TS2353: 'Object literal may only specify known properties',
  TS2551: 'Property does not exist — did you mean',
  TS2554: 'Expected N arguments but got M',
  TS2559: 'No overload matches this call',
  TS2561: 'Object cannot be used as value',
  TS2367: 'Comparison appears unintentional — no overlap',
};

const ROOT = '/home/z/my-project';
const TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_DIR = join(ROOT, 'remediation-work', 'phase0-backups', TS);
const INVENTORY_DIR = join(ROOT, 'remediation-work', 'phase0-inventory');

await mkdir(BACKUP_DIR, { recursive: true });
await mkdir(INVENTORY_DIR, { recursive: true });

console.log(`[phase0] backup dir: ${BACKUP_DIR}`);
console.log(`[phase0] inventory dir: ${INVENTORY_DIR}`);

// Files to back up verbatim
const CRITICAL_FILES = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'eslint.config.mjs',
  'components.json',
  'Caddyfile',
  '.gitignore',
  'prisma/schema.prisma',
  'src/lib/auth-middleware.ts',
  'src/lib/db.ts',
  'src/lib/permissions.ts',
  'prisma/seed.ts',
  'prisma/seed-complete.ts',
  'prisma/seed-homepage.ts',
  'prisma/seed-universities.ts',
];

const backupManifest = [];
for (const f of CRITICAL_FILES) {
  const src = join(ROOT, f);
  try {
    await access(src);
    const dst = join(BACKUP_DIR, f);
    await mkdir(dirname(dst), { recursive: true });
    await copyFile(src, dst);
    const st = await stat(src);
    const hash = await sha256(src);
    backupManifest.push({ path: f, bytes: st.size, sha256: hash, backedUpTo: relative(ROOT, dst) });
    console.log(`  ✓ ${f}  (${st.size} bytes)`);
  } catch (e) {
    console.log(`  ✗ ${f}  (missing — skipped)`);
    backupManifest.push({ path: f, bytes: 0, sha256: null, backedUpTo: null, missing: true });
  }
}

// git status snapshot
let gitStatus = '';
try {
  gitStatus = execSync('git status --porcelain=v1 2>&1', { cwd: ROOT, encoding: 'utf8' });
} catch (e) {
  gitStatus = `(git status failed: ${e.message})`;
}
let gitLog = '';
try {
  gitLog = execSync('git log --oneline -10 2>&1', { cwd: ROOT, encoding: 'utf8' });
} catch (e) {
  gitLog = `(git log failed: ${e.message})`;
}
let gitBranch = '';
try {
  gitBranch = execSync('git branch --show-current 2>&1', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch (e) {
  gitBranch = `(git branch failed: ${e.message})`;
}

await writeFile(join(BACKUP_DIR, 'GIT_STATUS.txt'), `Branch: ${gitBranch}\n\n== git status ==\n${gitStatus}\n\n== git log -10 ==\n${gitLog}\n`, 'utf8');
console.log('  ✓ git status snapshot saved');

// Inventory: pages
console.log('\n[phase0] building page inventory...');
const pageInventory = await collectPages(join(ROOT, 'src', 'app'));
await writeCsv(join(INVENTORY_DIR, 'PAGE-INVENTORY.csv'),
  ['filePath', 'route', 'type'],
  pageInventory);

// Inventory: API routes
console.log('[phase0] building API route inventory...');
const apiInventory = await collectApiRoutes(join(ROOT, 'src', 'app', 'api'));
await writeCsv(join(INVENTORY_DIR, 'API-INVENTORY.csv'),
  ['filePath', 'route', 'methods'],
  apiInventory);

// Inventory: Prisma models
console.log('[phase0] building Prisma model inventory...');
const prismaInventory = await collectPrismaModels(join(ROOT, 'prisma', 'schema.prisma'));
await writeCsv(join(INVENTORY_DIR, 'PRISMA-MODEL-INVENTORY.csv'),
  ['modelName', 'kind', 'fieldCount', 'relationCount', 'indexes', 'hasCreatedAt', 'hasUpdatedAt'],
  prismaInventory);

// Inventory: scripts (in package.json)
console.log('[phase0] building npm script inventory...');
const scriptInventory = await collectScripts(join(ROOT, 'package.json'));
await writeCsv(join(INVENTORY_DIR, 'SCRIPT-INVENTORY.csv'),
  ['name', 'command', 'present', 'notes'],
  scriptInventory);

// Inventory: tests
console.log('[phase0] building test inventory...');
const testInventory = await collectTests(ROOT);
await writeCsv(join(INVENTORY_DIR, 'TEST-INVENTORY.csv'),
  ['filePath', 'framework', 'type'],
  testInventory);

// Inventory: env variables used in code
console.log('[phase0] building env-var usage inventory...');
const envInventory = await collectEnvVars(ROOT);
await writeCsv(join(INVENTORY_DIR, 'ENV-VARIABLE-INVENTORY.csv'),
  ['variable', 'usedInFiles', 'occurrences'],
  envInventory);

// Inventory: TS errors grouped by root cause
console.log('[phase0] building TS error category inventory...');
const tscLog = await readFile('<temp-tsc-baseline-log>', 'utf8').catch(() => '');
const tsErrors = parseTscErrors(tscLog);
await writeCsv(join(INVENTORY_DIR, 'TYPESCRIPT-ERROR-INVENTORY.csv'),
  ['filePath', 'line', 'col', 'code', 'message'],
  tsErrors.rows);

const tsSummary = tsErrors.byCode.map(([code, count]) => ({ code, count, description: TS_CODE_DESCRIPTIONS[code] || '' }));
await writeCsv(join(INVENTORY_DIR, 'TYPESCRIPT-ERROR-SUMMARY.csv'),
  ['code', 'count', 'description'],
  tsSummary);

const tsByFile = tsErrors.byFile.map(([file, count]) => ({ filePath: file, errorCount: count }));
await writeCsv(join(INVENTORY_DIR, 'TYPESCRIPT-ERROR-BY-FILE.csv'),
  ['filePath', 'errorCount'],
  tsByFile);

// Write Phase 0 summary
const summary = {
  timestamp: TS,
  backupDir: relative(ROOT, BACKUP_DIR),
  inventoryDir: relative(ROOT, INVENTORY_DIR),
  filesBackedUp: backupManifest.filter(b => !b.missing).length,
  filesMissing: backupManifest.filter(b => b.missing).length,
  pageCount: pageInventory.length,
  apiRouteCount: apiInventory.length,
  prismaModelCount: prismaInventory.length,
  scriptCount: scriptInventory.filter(s => s.present).length,
  testCount: testInventory.length,
  envVarCount: envInventory.length,
  tsErrorCount: tsErrors.rows.length,
  tsErrorFiles: tsErrors.byFile.length,
  gitBranch,
};

await writeFile(join(INVENTORY_DIR, 'PHASE0-SUMMARY.json'), JSON.stringify(summary, null, 2), 'utf8');

await writeFile(join(BACKUP_DIR, 'BACKUP-MANIFEST.json'), JSON.stringify(backupManifest, null, 2), 'utf8');

console.log('\n[phase0] DONE');
console.log(JSON.stringify(summary, null, 2));

// ===== helpers =====

async function sha256(filePath) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    const rs = createReadStream(filePath);
    rs.on('data', d => hash.update(d));
    rs.on('error', reject);
    rs.on('end', resolve);
  });
  return hash.digest('hex');
}

async function collectPages(appDir) {
  const rows = [];
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.name === 'page.tsx' || e.name === 'page.ts' || e.name === 'page.jsx' || e.name === 'page.js') {
        const rel = relative(join(ROOT, 'src', 'app'), full).replace(/\\/g, '/');
        const route = '/' + rel.replace(/(^|\/)page\.(tsx|ts|jsx|js)$/, '').replace(/\/+/g, '/');
        rows.push({ filePath: relative(ROOT, full), route: route === '/' ? '/' : route.replace(/\/$/, ''), type: 'page' });
      } else if (e.name === 'layout.tsx' || e.name === 'layout.ts') {
        const rel = relative(join(ROOT, 'src', 'app'), full).replace(/\\/g, '/');
        const route = '/' + rel.replace(/(^|\/)layout\.(tsx|ts)$/, '').replace(/\/+/g, '/');
        rows.push({ filePath: relative(ROOT, full), route, type: 'layout' });
      } else if (e.name === 'route.ts' || e.name === 'route.js') {
        // skip — handled by API inventory
      }
    }
  }
  await walk(appDir);
  return rows;
}

async function collectApiRoutes(apiDir) {
  const rows = [];
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.name === 'route.ts' || e.name === 'route.js') {
        const rel = relative(join(ROOT, 'src', 'app', 'api'), full).replace(/\\/g, '/');
        const route = '/api/' + rel.replace(/(^|\/)route\.(ts|js)$/, '').replace(/\/+/g, '/');
        // Find which HTTP methods are exported
        let methods = [];
        try {
          const content = await readFile(full, 'utf8');
          const m = content.match(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g);
          if (m) methods = m.map(s => s.match(/(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/)[0]).sort();
        } catch {}
        rows.push({ filePath: relative(ROOT, full), route, methods: methods.join('|') });
      }
    }
  }
  await walk(apiDir);
  return rows;
}

async function collectPrismaModels(schemaPath) {
  const content = await readFile(schemaPath, 'utf8');
  const rows = [];
  const blocks = content.match(/^(model|enum|view|generator|datasource)\s+\w+\s+\{[^}]*\}/gms) || [];
  for (const block of blocks) {
    const m = block.match(/^(model|enum|view|generator|datasource)\s+(\w+)\s+\{([\s\S]*)\}/);
    if (!m) continue;
    const kind = m[1];
    const name = m[2];
    const body = m[3];
    if (kind === 'model' || kind === 'view') {
      const fieldLines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('@@') && !l.startsWith('}'));
      const relationFields = fieldLines.filter(l => /\b\w+\s+\w+\??\s*\[\]/.test(l) || /\b\w+\s+\w+\??\s*\{/.test(l));
      const hasCreatedAt = /\bcreatedAt\b/.test(body);
      const hasUpdatedAt = /\bupdatedAt\b/.test(body);
      const indexCount = (body.match(/@@index/g) || []).length;
      rows.push({ modelName: name, kind, fieldCount: fieldLines.length, relationCount: relationFields.length, indexes: indexCount, hasCreatedAt, hasUpdatedAt });
    } else {
      rows.push({ modelName: name, kind, fieldCount: 0, relationCount: 0, indexes: 0, hasCreatedAt: false, hasUpdatedAt: false });
    }
  }
  return rows;
}

async function collectScripts(pkgPath) {
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  const required = ['dev', 'build', 'start', 'lint', 'typecheck', 'test', 'test:integration', 'test:e2e', 'db:format', 'db:validate', 'db:generate', 'db:migrate', 'db:deploy', 'db:reset', 'db:seed', 'check'];
  const rows = [];
  for (const name of required) {
    if (pkg.scripts && pkg.scripts[name]) {
      rows.push({ name, command: pkg.scripts[name], present: 'yes', notes: '' });
    } else {
      rows.push({ name, command: '', present: 'no', notes: 'MISSING — needs to be added' });
    }
  }
  // Also list any extra scripts present
  for (const [name, command] of Object.entries(pkg.scripts || {})) {
    if (!required.includes(name)) {
      rows.push({ name, command, present: 'extra', notes: 'present but not in target script set' });
    }
  }
  return rows;
}

async function collectTests(root) {
  const rows = [];
  const skipDirs = new Set(['node_modules', '.next', '.git', 'public', 'skills', 'upload', 'remediation-baseline-2026-07-27', 'remediation-work', 'download']);
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (skipDirs.has(e.name)) continue;
        await walk(join(dir, e.name));
      } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(e.name)) {
        let framework = 'unknown';
        if (/\.test\./.test(e.name)) framework = 'likely-vitest-or-jest';
        if (/\.spec\./.test(e.name)) framework = 'likely-vitest-or-jasmine';
        rows.push({ filePath: relative(root, join(dir, e.name)), framework, type: inferTestType(join(dir, e.name)) });
      }
    }
  }
  await walk(root);
  return rows;
}

function inferTestType(filePath) {
  const p = filePath.toLowerCase();
  if (p.includes('/e2e/') || p.includes('e2e.test') || p.includes('e2e.spec')) return 'e2e';
  if (p.includes('/integration/') || p.includes('integration.test') || p.includes('integration.spec')) return 'integration';
  return 'unit';
}

async function collectEnvVars(root) {
  const usage = new Map();
  const skipDirs = new Set(['node_modules', '.next', '.git', 'public', 'skills', 'upload', 'remediation-baseline-2026-07-27', 'remediation-work', 'download']);
  // Match process.env.NAME and process.env["NAME"]
  const re = /process\.env\.([A-Z][A-Z0-9_]*)\b/g;
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (skipDirs.has(e.name)) continue;
        await walk(full);
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) {
        try {
          const content = await readFile(full, 'utf8');
          let m;
          while ((m = re.exec(content)) !== null) {
            const v = m[1];
            if (!usage.has(v)) usage.set(v, { files: new Set(), count: 0 });
            usage.get(v).files.add(relative(root, full));
            usage.get(v).count++;
          }
        } catch {}
      }
    }
  }
  await walk(root);
  const rows = [];
  for (const [v, info] of usage) {
    rows.push({ variable: v, usedInFiles: [...info.files].join('|'), occurrences: info.count });
  }
  rows.sort((a, b) => a.variable.localeCompare(b.variable));
  return rows;
}

function parseTscErrors(log) {
  const rows = [];
  const byCode = new Map();
  const byFile = new Map();
  const re = /^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/gm;
  let m;
  while ((m = re.exec(log)) !== null) {
    const filePath = m[1].trim();
    if (filePath.startsWith('remediation-baseline-2026-07-27/')) continue;
    if (filePath.startsWith('remediation-work/')) continue;
    const line = parseInt(m[2], 10);
    const col = parseInt(m[3], 10);
    const code = m[4];
    const message = m[5];
    rows.push({ filePath, line, col, code, message });
    byCode.set(code, (byCode.get(code) || 0) + 1);
    byFile.set(filePath, (byFile.get(filePath) || 0) + 1);
  }
  rows.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line);
  return {
    rows,
    byCode: [...byCode.entries()].sort((a, b) => b[1] - a[1]),
    byFile: [...byFile.entries()].sort((a, b) => b[1] - a[1]),
  };
}

async function writeCsv(path, headers, rows) {
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r|]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  await writeFile(path, lines.join('\n') + '\n', 'utf8');
  console.log(`  ✓ ${relative(ROOT, path)} (${rows.length} rows)`);
}
