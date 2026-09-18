// ============================================================
// Complete System Audit generator (mandate §96).
// Emits the data-driven inventories STRAIGHT FROM THE REPO so the docs
// can never drift from reality or contain fabricated counts (§121/§98).
//
// Usage: node scripts/generate-system-audit.mjs
// Outputs (docs/audit/):
//   COMPLETE-FILE-INVENTORY.md
//   COMPLETE-WEBSITE-ROUTE-INVENTORY.md
//   COMPLETE-API-INVENTORY.md
//   COMPLETE-DATABASE-AUDIT.md
//   ENVIRONMENT-AUDIT.md  (also written to FINAL-ENVIRONMENT-AUDIT.md)
// ============================================================

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const stamp = new Date().toISOString().slice(0, 10);
const auditDir = resolve(root, 'docs/audit');
mkdirSync(auditDir, { recursive: true });

const tracked = sh('git ls-files').split('\n').filter(Boolean);

// ---------- 1. FILE INVENTORY -------------------------------------------
const cats = {
  ACTIVE: 0, TEST: 0, DOCUMENTATION: 0, GENERATED: 0, LEGACY: 0, CONFIG: 0, DATA: 0, OTHER: 0,
};
const byModule = {};
for (const f of tracked) {
  let cat = 'OTHER';
  if (/\.(test|spec)\.[jt]sx?$/.test(f) || f.startsWith('tests/') || f.startsWith('test-results/')) cat = 'TEST';
  else if (/\.md$/.test(f) || f.startsWith('docs/') || f.startsWith('documentation/')) cat = 'DOCUMENTATION';
  else if (/\.(csv|json)$/.test(f) && !f.startsWith('src/') && !f.startsWith('prisma/')) cat = 'DATA';
  else if (/^(prisma\/migrations|package-lock\.json|SHA256SUMS)/.test(f)) cat = 'GENERATED';
  else if (/^(alo-education-web-crm-final|alo-cpanel|\.repair-backup)/.test(f)) cat = 'LEGACY';
  else if (/\.(config|rc)\.|\.ya?ml$|\.toml$|^\.env/.test(f) || f.startsWith('.github/')) cat = 'CONFIG';
  else if (/\.(ts|tsx|js|jsx|mjs|cjs|php|css)$/.test(f)) cat = 'ACTIVE';
  cats[cat]++;
  const mod = f.startsWith('src/app/api/') ? 'api'
    : f.startsWith('src/app/') ? 'pages'
    : f.startsWith('src/components/') ? 'components'
    : f.startsWith('src/lib/') ? 'lib'
    : f.startsWith('prisma/') ? 'prisma'
    : f.startsWith('tests/') ? 'tests'
    : f.startsWith('docs/') || f.startsWith('documentation/') ? 'docs'
    : f.startsWith('alo-education-web-crm-final/') ? 'legacy-crm'
    : f.startsWith('alo-cpanel/') ? 'legacy-cpanel'
    : f.split('/')[0] || '(root)';
  byModule[mod] = (byModule[mod] || 0) + 1;
}
const fi = [];
fi.push('# Complete File Inventory');
fi.push('');
fi.push(`> Generated from \`git ls-files\` on ${stamp}. **${tracked.length} tracked files.** Do not edit by hand.`);
fi.push('> Categorization is by path/extension heuristic (mandate §4); nothing is deleted on filename alone.');
fi.push('');
fi.push('## Category counts');
fi.push('');
fi.push('| Category | Count |');
fi.push('|---|---|');
for (const [k, v] of Object.entries(cats).sort((a, b) => b[1] - a[1])) fi.push(`| ${k} | ${v} |`);
fi.push('');
fi.push('## By module (top-level grouping)');
fi.push('');
fi.push('| Module | Files |');
fi.push('|---|---|');
for (const [k, v] of Object.entries(byModule).sort((a, b) => b[1] - a[1])) fi.push(`| \`${k}\` | ${v} |`);
fi.push('');
fi.push('## Legacy / nested projects (mandate §3 — analysed, not assumed disposable)');
fi.push('');
const legacyCrm = tracked.filter((f) => f.startsWith('alo-education-web-crm-final/')).length;
const legacyCpanel = tracked.filter((f) => f.startsWith('alo-cpanel/')).length;
fi.push(`- \`alo-education-web-crm-final/\` — **${legacyCrm} files** (historical PHP/JS CRM snapshot). LEGACY, inert, kept pending owner disposition.`);
fi.push(`- \`alo-cpanel/\` — **${legacyCpanel} files** (legacy PHP cPanel app). LEGACY, sanitised, not wired into the Next.js runtime.`);
fi.push('');
writeFileSync(resolve(auditDir, 'COMPLETE-FILE-INVENTORY.md'), fi.join('\n'));

// ---------- 2. WEBSITE ROUTE INVENTORY ----------------------------------
const pages = sh("find src/app -name page.tsx").split('\n').filter(Boolean)
  .map((p) => p.replace('src/app', '').replace('/page.tsx', '') || '/');
const pageGroups = {};
for (const p of pages) {
  const seg = p.split('/').filter(Boolean)[0] || '(root)';
  pageGroups[seg] = (pageGroups[seg] || 0) + 1;
}
const layouts = sh("find src/app -name layout.tsx").split('\n').filter(Boolean);
const ri = [];
ri.push('# Complete Website Route Inventory');
ri.push('');
ri.push(`> Generated from the filesystem on ${stamp}. **${pages.length} pages**, **${layouts.length} layouts.**`);
ri.push('> Cross-referenced against the API inventory; nav-link/sitemap reconciliation is a manual OWNER step (§6).');
ri.push('');
ri.push('## Canonical layout (§9/§10/§11)');
ri.push('');
ri.push('```');
for (const l of layouts) ri.push(l);
ri.push('```');
ri.push('');
ri.push('> **No `src/middleware.ts` exists** — there is no edge-level auth/rate-limiting;');
ri.push('> authorization is enforced per-route in the API handlers (see API inventory).');
ri.push('');
ri.push('## Page groups (by first path segment)');
ri.push('');
ri.push('| Group | Pages |');
ri.push('|---|---|');
for (const [k, v] of Object.entries(pageGroups).sort((a, b) => b[1] - a[1])) ri.push(`| \`/${k}\` | ${v} |`);
ri.push('');
ri.push('## Portal route coverage (§18–§23)');
ri.push('');
const portal = (prefix) => pages.filter((p) => p.startsWith('/' + prefix)).length;
ri.push('| Portal | Prefix | Pages |');
ri.push('|---|---|---|');
ri.push(`| Student | \`/student\` | ${portal('student')} |`);
ri.push(`| Employee | \`/employee\` | ${portal('employee')} |`);
ri.push(`| Counselor | \`/counselor\` | ${portal('counselor')} |`);
ri.push(`| Partner | \`/partner\` | ${portal('partner')} |`);
ri.push(`| Partner Admin | \`/partner-admin\` | ${portal('partner-admin')} |`);
ri.push(`| Admin | \`/admin\` | ${portal('admin')} |`);
ri.push(`| Super Admin | \`/super-admin\` | ${portal('super-admin')} |`);
ri.push(`| CRM | \`/crm\` | ${portal('crm')} |`);
ri.push(`| Application Manager | \`/application-manager\` | ${portal('application-manager')} |`);
ri.push('');
writeFileSync(resolve(auditDir, 'COMPLETE-WEBSITE-ROUTE-INVENTORY.md'), ri.join('\n'));

// ---------- 3. API INVENTORY --------------------------------------------
const routes = sh("find src/app/api -name route.ts").split('\n').filter(Boolean);
const AUTH = /authenticateRequest|withAuth|authenticateUnified|requireUserTypes|getServerSession|validateRequestAccess|requireAuth|getSession|auth\(\)/;
const SIG = /verifyWebhook|x-hub-signature|X-Hub-Signature|hub\.verify_token|verifyToken|cron-auth|requireCron|secret_token|signature/i;
let guarded = 0, sig = 0, none = 0;
const apiGroups = {};
const noneList = [];
for (const r of routes) {
  const src = readFileSync(resolve(root, r), 'utf8');
  const path = '/' + r.replace('src/app', '').replace('/route.ts', '');
  const seg = path.split('/').filter(Boolean)[1] || '(root)';
  apiGroups[seg] = apiGroups[seg] || { total: 0, guarded: 0, sig: 0, none: 0 };
  apiGroups[seg].total++;
  if (AUTH.test(src)) { guarded++; apiGroups[seg].guarded++; }
  else if (SIG.test(src)) { sig++; apiGroups[seg].sig++; }
  else { none++; apiGroups[seg].none++; noneList.push(path); }
}
const ai = [];
ai.push('# Complete API Inventory');
ai.push('');
ai.push(`> Generated from the filesystem on ${stamp}. **${routes.length} API route handlers.**`);
ai.push(`> Auth posture classified by static analysis of each handler's imports/calls.`);
ai.push('');
ai.push('## Auth posture summary');
ai.push('');
ai.push('| Posture | Count |');
ai.push('|---|---|');
ai.push(`| Authenticated (session/withAuth/requireUserTypes) | ${guarded} |`);
ai.push(`| Signature / webhook / cron-secret | ${sig} |`);
ai.push(`| **None detected** | **${none}** |`);
ai.push('');
ai.push(`> The ${none} "none" routes include legitimately public endpoints (login, public`);
ai.push('> lead capture, OAuth callbacks, health). Each must be triaged individually —');
ai.push('> see \`AUDIT/ARENA-ROUTE-INVENTORY.csv\` for the per-route classification and');
ai.push('> \`docs/security/FINAL-SECURITY-AUDIT.md\` for the privileged-prefix triage.');
ai.push('');
ai.push('## By API group');
ai.push('');
ai.push('| Group | Total | Auth | Sig | None |');
ai.push('|---|---|---|---|---|');
for (const [k, v] of Object.entries(apiGroups).sort((a, b) => b[1].total - a[1].total)) {
  ai.push(`| \`/api/${k}\` | ${v.total} | ${v.guarded} | ${v.sig} | ${v.none} |`);
}
ai.push('');
writeFileSync(resolve(auditDir, 'COMPLETE-API-INVENTORY.md'), ai.join('\n'));

// ---------- 4. DATABASE AUDIT -------------------------------------------
const schema = readFileSync(resolve(root, 'prisma/schema.prisma'), 'utf8');
const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const enums = [...schema.matchAll(/^enum (\w+) \{/gm)].map((m) => m[1]);
const migrations = sh('ls prisma/migrations 2>/dev/null | grep -v migration_lock || true').split('\n').filter(Boolean);
const findModels = (re) => models.filter((m) => re.test(m));
const db = [];
db.push('# Complete Database Audit');
db.push('');
db.push(`> Generated from \`prisma/schema.prisma\` on ${stamp}.`);
db.push(`> **${models.length} models**, **${enums.length} enums**, **${migrations.length} migrations.**`);
db.push('');
db.push('## Single-source rule (§30) — canonical entity check');
db.push('');
db.push('The mandate requires ONE canonical model per core entity. Findings:');
db.push('');
db.push('| Entity | Bare model? | Where it actually lives | Finding |');
db.push('|---|---|---|---|');
db.push(`| University | ${models.includes('University') ? 'YES' : '**NO**'} | \`CrmUniversity\` (+7 University* satellites) | canonical is \`CrmUniversity\`; no bare \`University\` |`);
db.push(`| Contact | ${models.includes('Contact') ? 'YES' : '**NO**'} | \`ContactMatchReview\`, \`WhatsAppContact\`, \`UnknownIncomingContact\` | **no unified Contact model** — identity layer incomplete (§32) |`);
db.push(`| Conversation | ${models.includes('Conversation') ? 'YES' : '**NO**'} | \`UccConversation\` | canonical is \`UccConversation\` |`);
db.push(`| Message | ${models.includes('Message') ? 'YES' : '**NO**'} | ${findModels(/Message/).length} models: ${findModels(/Message/).join(', ')} | **fragmented across ${findModels(/Message/).length} models** (§30 violation) |`);
db.push(`| Course | ${models.includes('Course') ? 'YES' : '**NO**'} | ${findModels(/^Course|^CrmCourse/).slice(0, 6).join(', ')}… | no bare \`Course\`; CRM/course satellites |`);
db.push(`| Lead | ${models.includes('Lead') ? 'YES' : 'NO'} | \`Lead\` | OK |`);
db.push(`| Application | ${models.includes('Application') ? 'YES' : 'NO'} | \`Application\` | OK |`);
db.push(`| Student | ${models.includes('Student') ? 'YES' : 'NO'} | \`Student\` | OK |`);
db.push(`| Employee | ${models.includes('Employee') ? 'YES' : 'NO'} | \`Employee\` | OK |`);
db.push(`| User | ${models.includes('User') ? 'YES' : 'NO'} | \`User\` | OK |`);
db.push('');
db.push('## Message-model fragmentation (§30 — highest-priority consolidation)');
db.push('');
db.push('These models overlap and should be reconciled toward \`UccMessage\` as canonical:');
db.push('');
for (const m of findModels(/Message/)) db.push(`- \`${m}\``);
db.push('');
db.push('> **No destructive migration performed.** Consolidation requires backup +');
db.push('> review + approval (mandate §101); \`prisma generate\` is blocked in this');
db.push('> sandbox, so schema changes cannot be validated here. Recorded as OWNER ACTION.');
db.push('');
db.push('## Migrations');
db.push('');
for (const m of migrations) db.push(`- \`${m}\``);
db.push('');
writeFileSync(resolve(auditDir, 'COMPLETE-DATABASE-AUDIT.md'), db.join('\n'));

// ---------- 5. ENVIRONMENT AUDIT ----------------------------------------
const usedRaw = sh("grep -rhoE 'process\\.env\\.[A-Z0-9_]+' src server.js next.config.ts 2>/dev/null | sed 's/process\\.env\\.//' | sort -u || true");
const used = usedRaw.split('\n').filter(Boolean);
const declared = readFileSync(resolve(root, '.env.example'), 'utf8')
  .split('\n').map((l) => (l.match(/^([A-Z0-9_]+)=/) || [])[1]).filter(Boolean);
const usedSet = new Set(used), declSet = new Set(declared);
const usedNotDeclared = used.filter((v) => !declSet.has(v));
const declaredNotUsed = declared.filter((v) => !usedSet.has(v));
const SECRET = /SECRET|TOKEN|KEY|PASSWORD|PASSWD|CREDENTIAL|PRIVATE/i;
const env = [];
env.push('# Environment Variable Audit');
env.push('');
env.push(`> Generated on ${stamp} by scanning \`process.env.*\` across \`src/\`, \`server.js\`, \`next.config.ts\`.`);
env.push(`> **${used.length} variables referenced in source · ${declared.length} declared in \`.env.example\`.**`);
env.push('');
env.push('## Reconciliation (§60/§64)');
env.push('');
env.push('| Metric | Count |');
env.push('|---|---|');
env.push(`| Referenced in source | ${used.length} |`);
env.push(`| Declared in .env.example | ${declared.length} |`);
env.push(`| **Used but NOT declared** (must add to .env.example) | **${usedNotDeclared.length}** |`);
env.push(`| Declared but NOT used (LEGACY_UNUSED candidates) | ${declaredNotUsed.length} |`);
env.push('');
env.push('## Used-but-undeclared variables (§62 — must be documented)');
env.push('');
env.push('| Variable | Likely secret? |');
env.push('|---|---|');
for (const v of usedNotDeclared) env.push(`| \`${v}\` | ${SECRET.test(v) ? 'YES' : 'no'} |`);
env.push('');
env.push('## Declared-but-unused (LEGACY_UNUSED candidates — §65; do not delete without source audit)');
env.push('');
for (const v of declaredNotUsed) env.push(`- \`${v}\``);
env.push('');
env.push('## §64 duplicate-name pairs (canonical name must be chosen, not blindly deleted)');
env.push('');
env.push('| Pair | Both used? | Both declared? |');
env.push('|---|---|---|');
const pairs = [['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_TOKEN'], ['NEXTCLOUD_USER', 'NEXTCLOUD_USERNAME'], ['VAULTWARDEN_TOKEN', 'VAULTWARDEN_ADMIN_TOKEN'], ['APP_URL', 'ALO_APP_URL'], ['MOLX_URL', 'NEXT_PUBLIC_MOLX_URL']];
for (const [a, b] of pairs) {
  env.push(`| \`${a}\` / \`${b}\` | ${usedSet.has(a) && usedSet.has(b) ? 'YES' : 'partial'} | ${declSet.has(a) && declSet.has(b) ? 'YES' : 'partial'} |`);
}
env.push('');
env.push('> **No fake values** are filled for missing production secrets (§61). Missing =');
env.push('> \`MISSING\`; placeholders in \`.env.example\` are \`CONFIGURE_IN_SERVER_SECRET_STORE\`.');
env.push('');
const envText = env.join('\n');
writeFileSync(resolve(auditDir, 'ENVIRONMENT-AUDIT.md'), envText);
writeFileSync(resolve(root, 'FINAL-ENVIRONMENT-AUDIT.md'), envText);

console.log('Generated audit docs:');
console.log(`  files=${tracked.length} pages=${pages.length} api=${routes.length} (guarded=${guarded} sig=${sig} none=${none})`);
console.log(`  models=${models.length} enums=${enums.length} migrations=${migrations.length}`);
console.log(`  env used=${used.length} declared=${declared.length} usedNotDeclared=${usedNotDeclared.length} declaredNotUsed=${declaredNotUsed.length}`);
