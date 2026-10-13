/**
 * Critical safety remediation (2026-10-12), before the Course Finder commit.
 *  Fix 1: deployment never authorises data loss or hides seed failures.
 *  Fix 2: the AI Command Center cannot edit or push the Prisma schema over HTTP.
 *  Fix 3: public/ does not publish unsupported verification totals.
 *  Fix 4: synthetic generators write only to explicit non-production directories.
 * Static scans and mocked route calls only: no database, no network, no Prisma client.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const ROOT = path.resolve(__dirname, '..', '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.includes(path.extname(name).toLowerCase())) out.push(full);
  }
  return out;
}
const rel = (abs: string) => path.relative(ROOT, abs);
/** Child-process env for spawnSync (type-only helper: the repo's ProcessEnv typing requires NODE_ENV). */
const childEnv = (env: Record<string, string | undefined>) => env as unknown as NodeJS.ProcessEnv;
/** Source without comments, so guidance text in comments is not mistaken for executable commands. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*(\/\/|#)/.test(l)).join('\n');

const m = vi.hoisted(() => ({
  auth: { current: null as any },
  exec: vi.fn((..._args: any[]) => {
    const cb = _args[_args.length - 1];
    if (typeof cb === 'function') cb(null, 'stdout', '');
  }),
}));

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: vi.fn(async () => m.auth.current),
}));
vi.mock('child_process', async (orig) => {
  const actual: any = await orig();
  return { ...actual, default: { ...actual, exec: m.exec }, exec: m.exec };
});

// ---------------------------------------------------------------- Fix 1
describe('Fix 1: deployment database safety', () => {
  const deployFiles = ['deploy.sh', 'alo-education-web-crm-final/deploy.sh'];
  const automation = [
    ...deployFiles,
    ...walk(path.join(ROOT, '.github/workflows'), ['.yml', '.yaml']).map(rel),
    ...walk(path.join(ROOT, 'scripts'), ['.sh', '.mjs', '.js', '.ts', '.py']).map(rel),
    ...walk(path.join(ROOT, 'alo-education-web-crm-final/scripts'), ['.sh', '.mjs', '.js', '.ts', '.py']).map(rel),
    ...walk(path.join(ROOT, 'src/app/api'), ['.ts', '.tsx']).map(rel),
  ];

  it('no deploy script, workflow, repo script or API route runs --accept-data-loss, migrate reset or force-reset', () => {
    const offenders = automation.filter((f) => /--accept-data-loss|migrate\s+reset|--force-reset/.test(code(read(f))));
    expect(offenders).toEqual([]);
  });

  it('no seed command has its failure hidden with || true', () => {
    const offenders = automation.filter((f) => /(seed|db:seed|prisma\/seed)[^\n]*\|\|\s*true/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('package.json scripts never combine a deploy/start/build step with data loss or seeding', () => {
    const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>;
    for (const [name, cmd] of Object.entries(scripts)) {
      expect(cmd, name).not.toMatch(/--accept-data-loss/);
      if (/deploy|start|build|postinstall|prestart|prebuild/.test(name)) {
        expect(cmd, name).not.toMatch(/db push|migrate reset|seed/);
      }
    }
  });

  it.each(deployFiles)('%s is a quarantined stub that exits non-zero without touching the database', (f) => {
    const res = spawnSync('bash', [path.join(ROOT, f)], { cwd: ROOT, encoding: 'utf8', env: childEnv({ PATH: process.env.PATH ?? '' }) });
    expect(res.status).not.toBe(0);
    expect(code(read(f))).not.toMatch(/prisma\s+(db\s+push|migrate|db\s+seed)|npm run (db:|seed)/);
  });
});

// ---------------------------------------------------------------- Fix 2
describe('Fix 2: AI Command Center schema mutation is disabled', () => {
  const ROUTE = 'src/app/api/admin/ai-command-center/route.ts';
  const post = (body: unknown) =>
    new NextRequest('http://localhost/api/admin/ai-command-center', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  const load = () => import('@/app/api/admin/ai-command-center/route');

  beforeEach(() => { m.exec.mockClear(); });
  afterEach(() => { m.auth.current = null; });

  const admin = { userId: 'admin-1', userType: 'admin', roles: ['ADMIN'] };
  const superAdmin = { userId: 'super-1', userType: 'admin', roles: ['SUPER_ADMIN'] };
  const staff = { userId: 'staff-1', userType: 'employee', roles: ['COUNSELOR'] };

  it.each([
    ['ordinary admin', admin],
    ['Super Admin', superAdmin],
  ])('%s gets 503 for approve-plan and rollback, and nothing is executed', async (_label, who) => {
    m.auth.current = who;
    const { POST } = await load();
    for (const action of ['approve-plan', 'rollback']) {
      const res = await POST(post({ action, plan: { prismaSchemaDiff: 'model X { id String @id }' }, planId: 'p1' }));
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json).toMatchObject({ success: false, code: 'SCHEMA_MUTATION_DISABLED' });
    }
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('a non-admin is refused with 403 before anything runs', async () => {
    m.auth.current = staff;
    const { POST } = await load();
    const res = await POST(post({ action: 'approve-plan' }));
    expect(res.status).toBe(403);
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('an unauthenticated caller gets the auth response and nothing runs', async () => {
    m.auth.current = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { POST } = await load();
    const res = await POST(post({ action: 'rollback' }));
    expect(res.status).toBe(401);
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('generate-plan is preview-only and reports that applying is disabled', async () => {
    m.auth.current = superAdmin;
    const { POST } = await load();
    const res = await POST(post({ action: 'generate-plan', command: 'add a source column to the lead table' }));
    const json = await res.json();
    expect(JSON.stringify(json)).toMatch(/applyDisabled/);
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('unknown or alternate schema actions never run a command', async () => {
    m.auth.current = superAdmin;
    const { POST } = await load();
    for (const action of ['db-push', 'apply-schema', 'migrate', 'push-schema', 'approve', undefined]) {
      await POST(post({ action, command: 'npx prisma db push --accept-data-loss' }));
    }
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('exports only GET and POST (no PUT/PATCH/DELETE alternate entry points)', async () => {
    const mod: Record<string, unknown> = await load();
    for (const verb of ['PUT', 'PATCH', 'DELETE']) expect(mod[verb]).toBeUndefined();
  });

  it('route source cannot write files or push the schema', () => {
    const src = read(ROUTE);
    expect(src).not.toMatch(/from ['"](node:)?fs['"]|require\(['"](node:)?fs['"]\)/);
    expect(src).not.toMatch(/writeFileSync|writeFile\(|copyFileSync/);
    expect(code(src)).not.toMatch(/db push|accept-data-loss|prisma generate|migrate (dev|reset)/);
    expect(code(src)).not.toMatch(/execAsync\([^)]*prisma/);
  });

  it('no API route writes prisma/schema.prisma or pushes the schema', () => {
    const offenders = walk(path.join(ROOT, 'src/app/api'), ['.ts', '.tsx'])
      .filter((f) => {
        const src = code(readFileSync(f, 'utf8'));
        const writesFiles = /writeFileSync|writeFile\(|copyFileSync|renameSync/.test(src);
        return /prisma\s+db\s+push/.test(src) || (writesFiles && /schema\.prisma/.test(src));
      })
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('the admin UI no longer calls approve-plan or rollback', () => {
    const ui = read('src/components/admin/AICommandingCenter.tsx');
    expect(ui).not.toMatch(/action:\s*['"](approve-plan|rollback)['"]/);
  });
});

// ---------------------------------------------------------------- Fix 3
describe('Fix 3: no unsupported verification totals in public/', () => {
  const MOVED = [
    'ALO_DATA_COLLECTION_REPORT.md', 'ALO_FINAL_MASTER_DATA_REPORT.md', 'ALO_IMPORT_REPORT.md',
    'UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md', 'INITIAL-LAUNCH-DATA-REPORT.md', 'COUNTRY-UNIVERSITY-COURSE-COVERAGE-REPORT.md',
    'FINAL-AUDIT-REPORT.md', 'PRODUCTION-DELIVERY-REPORT.md',
  ];
  const HIST = 'AUDIT/historical-catalogue-reports-2026-10-12';

  it.each(MOVED)('%s is gone from public/docs and preserved, labelled, under AUDIT/', (name) => {
    expect(existsSync(path.join(ROOT, 'public/docs', name))).toBe(false);
    const kept = read(`${HIST}/${name}`);
    expect(kept.startsWith('> **HISTORICAL / UNVERIFIED')).toBe(true);
    expect(read(`${HIST}/README.md`)).toContain(`\`${name}\``);
  });

  const publicDirs = ['public', 'alo-education-web-crm-final/public', 'deploy-build/public'];
  const textFiles = publicDirs.flatMap((d) => walk(path.join(ROOT, d), ['.md', '.txt', '.html', '.json', '.csv', '.xml', '.js', '.svg']));

  it('public text files contain no catalogue totals or "verified" counts', () => {
    const patterns = [
      /\b\d[\d,]*\+?\s*(verified|source-verified)\s+(universit|course|institution|record)/i,
      /verified institutions|verified seed count|source-verified/i,
      /\b\d[\d,]*\+?\s*(universities|courses|institutions|scholarships)\b/i,
    ];
    const hits: string[] = [];
    for (const f of textFiles) {
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/removed unverifiable/i.test(line)) return; // changelog lines that record a claim's removal
        if (patterns.some((p) => p.test(line))) hits.push(`${rel(f)}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });

  it('live UI copy edited in this remediation carries no catalogue-size or verified-directory claims', () => {
    const files = [
      'src/components/website/HomepagePart1.tsx', 'src/components/website/HomepagePart2.tsx',
      'src/components/student/StudentCourseFinder.tsx', 'src/components/auth/RegisterPage.tsx',
      'src/lib/services-data.ts', 'src/lib/marketing-kit/email-sequences.ts',
      'src/components/course-finder/course-finder-enhanced.tsx', 'src/components/website/ServiceDetailHub.tsx',
    ];
    for (const f of files) {
      expect(read(f), f).not.toMatch(/(thousands|hundreds) of (courses|programmes)|verified directory|\d[\d,]*\+\s*(verified )?(courses|universities)/i);
    }
  });
});

// ---------------------------------------------------------------- Fix 4
describe('Fix 4: synthetic generators fail closed', () => {
  const cleanEnv = () => {
    const env: Record<string, string> = { PATH: process.env.PATH ?? '' };
    return env;
  };

  it('the JS guard accepts only fixtures/synthetic-catalogue or staging/synthetic', async () => {
    const g: any = await import('../../scripts/lib/synthetic-output-guard.mjs');
    const ok = (dir: string, extra: Record<string, string> = {}) => g.resolveSyntheticOutputDir({ ALO_SYNTHETIC_OUTPUT_DIR: dir, ...extra }, ROOT);
    expect(ok('fixtures/synthetic-catalogue/run-1')).toBe(path.join(ROOT, 'fixtures/synthetic-catalogue/run-1'));
    expect(ok('staging/synthetic')).toBe(path.join(ROOT, 'staging/synthetic'));
    for (const bad of ['', '.', 'src', 'data', 'public', 'prisma', 'docs/import-templates', 'fixtures', 'fixtures/synthetic-catalogue/../../src', '/tmp/x', 'staging/synthetic-evil']) {
      expect(() => ok(bad), bad).toThrow(g.SyntheticOutputRefused);
    }
    expect(() => ok('staging/synthetic/x', { NODE_ENV: 'production' })).toThrow(/production/);
    const out = ok('staging/synthetic/x');
    expect(() => g.syntheticOutputPath(out, '../../../src/lib/a.ts')).toThrow(g.SyntheticOutputRefused);
    expect(() => g.syntheticOutputPath(out, '/etc/passwd')).toThrow(g.SyntheticOutputRefused);
    expect(g.syntheticOutputPath(out, 'docs/import-templates/a.csv')).toBe(path.join(out, 'docs/import-templates/a.csv'));
  });

  const python = spawnSync('python3', ['--version']).status === 0;
  const pyGuarded = ['regenerate_csvs_every_month.py', 'enhance_gcu_london.py', 'generate_csv.py'];
  const pyDisabled = ['generate_full_dataset.py', 'generate_missing_universities_and_intakes.py', 'add_courses.py', 'add_universities.py'];

  it.runIf(python).each(pyGuarded)('%s refuses without, or with an unsafe, ALO_SYNTHETIC_OUTPUT_DIR', (f) => {
    for (const extra of [{}, { ALO_SYNTHETIC_OUTPUT_DIR: '.' }, { ALO_SYNTHETIC_OUTPUT_DIR: 'docs/import-templates' }, { ALO_SYNTHETIC_OUTPUT_DIR: 'staging/synthetic/t', NODE_ENV: 'production' }]) {
      const res = spawnSync('python3', ['-B', path.join(ROOT, 'scripts', f)], { cwd: ROOT, encoding: 'utf8', env: childEnv({ ...cleanEnv(), ...extra }) });
      expect(res.status, JSON.stringify(extra)).toBe(1);
      expect(res.stderr).toMatch(/REFUSED/);
    }
  });

  it.runIf(python).each(pyDisabled)('%s is permanently disabled, even with a valid output dir', (f) => {
    const res = spawnSync('python3', ['-B', path.join(ROOT, 'scripts', f)], { cwd: ROOT, encoding: 'utf8', env: childEnv({ ...cleanEnv(), ALO_SYNTHETIC_OUTPUT_DIR: 'staging/synthetic/t' }) });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/DISABLED/);
  });

  it('generate-canonical-templates.mjs refuses to write docs/import-templates', () => {
    for (const extra of [{}, { ALO_SYNTHETIC_OUTPUT_DIR: 'docs/import-templates' }]) {
      const res = spawnSync(process.execPath, [path.join(ROOT, 'scripts/generate-canonical-templates.mjs')], { cwd: ROOT, encoding: 'utf8', env: childEnv({ ...cleanEnv(), ...extra }) });
      expect(res.status).toBe(1);
      expect(res.stderr).toMatch(/REFUSED/);
    }
  });

  it.each(['alo-education-web-crm-final/scripts/generate-canonical-templates.mjs'])('archived copy %s is disabled', (f) => {
    const res = spawnSync(process.execPath, [path.join(ROOT, f)], { cwd: ROOT, encoding: 'utf8', env: childEnv(cleanEnv()) });
    expect(res.status).toBe(1);
  });

  const tsGuarded = ['generate-master-reports.ts', 'run-real-data-audit.ts', 'run-2027-intake-discovery.ts', 'build-complete-canonical-csvs.ts', 'generate-canonical-templates.mjs'];
  it.each(tsGuarded)('%s routes every write through the guard (static)', (f) => {
    const src = read(`scripts/${f}`);
    expect(src).toMatch(/requireSyntheticOutputDir\(/);
    expect(src).not.toMatch(/path\.join\(__dirname,\s*'\.\.(\/|')/);
    expect(src).not.toMatch(/=\s*'docs\/import-templates'/);
    expect(src).not.toMatch(/cwd:\s*path\.join\(__dirname/);
    // guard runs before the Prisma client is created
    const guardAt = src.search(/requireSyntheticOutputDir\(/);
    const prismaAt = src.search(/new PrismaClient\(/);
    if (prismaAt >= 0) expect(guardAt).toBeLessThan(prismaAt);
  });

  it.each([
    'scripts/run-production-real-collection.ts',
    'scripts/generate-final-packages.ts',
    'alo-education-web-crm-final/scripts/build-complete-canonical-csvs.ts',
    'alo-education-web-crm-final/scripts/generate-canonical-templates.mjs',
  ])('%s exits before any database or file work (static)', (f) => {
    const src = read(f);
    // A disabled script may refuse with process.exit(1) or a top-level throw
    // (scripts/run-real-data-audit.ts uses the same throw pattern).
    const guards = [src.search(/process\.exit\(1\)/), src.search(/^throw new Error\(/m)].filter((n) => n >= 0);
    const exitAt = guards.length ? Math.min(...guards) : -1;
    expect(exitAt).toBeGreaterThan(-1);
    for (const danger of [/new PrismaClient\(/, /updateMany\(/, /writeFileSync\(/, /execSync\(/, /mkdirSync\(/]) {
      const at = src.search(danger);
      if (at >= 0) expect(exitAt, String(danger)).toBeLessThan(at);
    }
  });

  it('no Python generator hard-codes the repository or a /home/z production path for output', () => {
    for (const f of pyGuarded) {
      const src = read(`scripts/${f}`);
      expect(src, f).not.toMatch(/^ROOT\s*=\s*pathlib\.Path\("\/home\//m);
      expect(src, f).not.toMatch(/^outpath\s*=\s*'\/home\//m);
    }
    for (const f of pyDisabled) {
      const src = read(`scripts/${f}`);
      const stopAt = src.search(/^refuse_permanently\(/m);
      expect(stopAt, f).toBeGreaterThan(-1);
      for (const danger of [/^ROOT\s*=/m, /open\(/, /\.write_text\(/]) {
        const at = src.search(danger);
        if (at >= 0) expect(stopAt, `${f} ${danger}`).toBeLessThan(at);
      }
    }
  });

  it('import-history.tsx is labelled demo-only and has no silent sample-data fallback', () => {
    const src = read('src/components/course-finder/import-history.tsx');
    expect(src).toMatch(/DEMO-ONLY COMPONENT/);
    expect(src).toMatch(/IMPORT_HISTORY_IS_DEMO = true/);
    expect(src).not.toMatch(/setBatches\((MOCK|DEMO)_/);
  });
});
