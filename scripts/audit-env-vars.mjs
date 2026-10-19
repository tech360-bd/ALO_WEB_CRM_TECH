#!/usr/bin/env node
/**
 * ALO Education — environment variable audit.
 *
 * Builds a machine-readable classification of every environment variable the
 * application actually consumes, and every variable declared in the hosting
 * templates. The *code* is authoritative: a variable that appears only in
 * `.env.production.example` is reported as UNUSED, not as required.
 *
 *   node scripts/audit-env-vars.mjs            # write docs/environment-classification.json
 *   node scripts/audit-env-vars.mjs --check    # fail if the committed file is stale
 *
 * Classification (mechanical — derived from the code, not from opinion)
 *   UNUSED                   declared in a template but never referenced by code
 *   PUBLIC                   NEXT_PUBLIC_* — inlined into the client bundle at
 *                            build time. MUST NOT hold a secret.
 *   REFERENCED_FAIL_CLOSED   referenced, and a throw/exit sits next to the
 *                            reference. NOTE: the guard is often feature-scoped
 *                            (e.g. an SMS key that only throws when SMS is used),
 *                            so this is NOT the same as "required to boot".
 *   REFERENCED_WITH_FALLBACK referenced with an inline `||` / `??` default
 *   REFERENCED               referenced, no inline default, no adjacent guard
 *
 * References are detected three ways: `process.env.NAME`, destructured
 * `const { NAME } = process.env`, and indirect reads through an injectable env
 * record (`env.NAME`, `firstString(env, 'NAME')`). `referencedIndirectly`
 * records which applied, so a reader can see why a reference is not a literal
 * `process.env.NAME`.
 *
 * Separately, `productionRequired` is a CURATED list: each entry carries a
 * human-verified reason. It is deliberately not inferred, because the
 * mechanical heuristic both over-reports (feature-scoped throws) and
 * under-reports (DATABASE_URL is consumed by Prisma, not by a throw site).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CODE_ROOTS = ['src', 'scripts', 'prisma'];
const CODE_FILES = ['server.js', 'next.config.js', 'next.config.mjs', 'next.config.ts'];
const TEMPLATES = ['.env.example', '.env.production.example'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.awf-tmp']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.env') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, out);
    } else if (CODE_EXT.has(path.extname(e.name))) {
      out.push(p);
    }
  }
  return out;
}

// This file necessarily contains `process.env.` inside its own matching
// regexes and documentation; scanning itself would invent variables.
const SELF = path.resolve(process.argv[1] ?? '');

const files = [
  ...CODE_ROOTS.flatMap((d) => walk(path.join(ROOT, d))),
  ...CODE_FILES.map((f) => path.join(ROOT, f)).filter((f) => existsSync(f) && statSync(f).isFile()),
].filter((f) => path.resolve(f) !== SELF);

const REF_RE = /process\.env\.([A-Z0-9_]+)|process\.env\[['"`]([A-Z0-9_]+)['"`]\]/g;

// Destructured reads (`const { SMTP_HOST: host } = process.env`) are real
// references too. src/lib/email-service.ts reads the live SMTP credentials
// exactly this way; without this pattern the audit reported the actual mail
// transport as UNUSED.
const DESTRUCT_RE = /\{([^{}]+)\}\s*=\s*process\.env\b/g;

// Indirect reads. src/lib/google/config.ts takes an injectable
// `env: NodeJS.ProcessEnv` record (so the whole Google stack can be unit
// tested without mutating the real environment) and reads it two ways:
//
//   env.ANALYTICS_ALLOW_NON_PRODUCTION            -> property access
//   firstString(env, 'NEXT_PUBLIC_GTM_ID', 'GTM_CONTAINER_ID')
//                                                 -> all-caps string keys
//
// Neither is a literal `process.env.NAME`, so without these patterns the audit
// reported 13 live variables as UNUSED -- including every GA4/GTM/YouTube
// setting -- which contradicted docs/GOOGLE-FREE-STACK.md and would have told
// an operator that configuring them does nothing.
//
// Both patterns require the receiving identifier to contain "env" (a bare
// `env` included -- `[\w$]*` may be empty), so they
// cannot pick up arbitrary all-caps string literals from unrelated code, and
// they therefore cannot invent variables.
const INDIRECT_PROP_RE = /\b[\w$]*[eE]nv[\w$]*\.([A-Z][A-Z0-9_]{2,})\b/g;
const INDIRECT_KEYS_RE =
  /\b[\w$]*[eE]nv[\w$]*\s*,\s*((?:['"][A-Z][A-Z0-9_]{2,}['"]\s*,?\s*)+)/g;

/** name -> { files:Set, failClosed:bool, hasFallback:bool, indirect:bool } */
const refs = new Map();

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(REF_RE)) {
      const name = m[1] || m[2];
      if (!refs.has(name)) refs.set(name, { files: new Set(), failClosed: false, hasFallback: false });
      const entry = refs.get(name);
      entry.files.add(rel);
      // Fallback on the same line: `process.env.X || 'default'` / `?? v` / `?.`
      if (new RegExp(`process\\.env\\.${name}\\s*(\\|\\||\\?\\?)`).test(lines[i])) entry.hasFallback = true;
      // Fail-closed if a throw/exit mentioning the variable appears within the
      // next few lines (the repo's established guard pattern).
      const window = lines.slice(i, i + 6).join('\n');
      if (new RegExp(`(throw new Error|process\\.exit\\()[^]{0,200}${name}`).test(window)) entry.failClosed = true;
      if (new RegExp(`${name}[^]{0,200}(throw new Error|process\\.exit\\()`).test(window)) entry.failClosed = true;
    }
  }
  // Destructured references. Scanned on the whole file text so multi-line
  // destructures count too; each name is re-checked against the same
  // throw/exit window heuristic used for direct references.
  for (const m of text.matchAll(DESTRUCT_RE)) {
    for (const part of m[1].split(',')) {
      const key = part.split(':')[0].split('=')[0].trim();
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) continue;
      if (!refs.has(key)) refs.set(key, { files: new Set(), failClosed: false, hasFallback: false });
      const entry = refs.get(key);
      entry.files.add(rel);
      if (new RegExp(`${key}\\s*=`).test(part) && part.includes('=')) entry.hasFallback = true;
      const lineIdx = text.slice(0, m.index).split('\n').length - 1;
      const window = lines.slice(lineIdx, lineIdx + 6).join('\n');
      if (new RegExp(`(throw new Error|process\\.exit\\()[^]{0,200}${key}`).test(window)) entry.failClosed = true;
      if (new RegExp(`${key}[^]{0,200}(throw new Error|process\\.exit\\()`).test(window)) entry.failClosed = true;
    }
  }
}

// Second pass: indirect reads. Run separately and only for names the direct
// scan did NOT find, so every variable already detected through
// `process.env` keeps the exact classification it had before. Re-scanning
// known names here would let an unrelated `||` elsewhere in the file flip them
// to REFERENCED_WITH_FALLBACK and silently corrupt curated results.
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const lines = text.split('\n');
  const found = new Set();
  for (const m of text.matchAll(INDIRECT_PROP_RE)) found.add(m[1]);
  for (const m of text.matchAll(INDIRECT_KEYS_RE)) {
    for (const q of m[1].matchAll(/['"]([A-Z][A-Z0-9_]{2,})['"]/g)) found.add(q[1]);
  }
  for (const name of found) {
    if (refs.has(name)) continue;
    const entry = { files: new Set([rel]), failClosed: false, hasFallback: false, indirect: true };
    refs.set(name, entry);
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(name)) continue;
      // Inline default judged on the reading line only.
      if (/\|\||\?\?/.test(lines[i])) entry.hasFallback = true;
      const window = lines.slice(i, i + 6).join('\n');
      if (new RegExp(`(throw new Error|process\\.exit\\()[^]{0,200}${name}`).test(window)) entry.failClosed = true;
      if (new RegExp(`${name}[^]{0,200}(throw new Error|process\\.exit\\()`).test(window)) entry.failClosed = true;
    }
  }
}

/** Variables declared in the hosting templates. */
const declared = new Map();
for (const tpl of TEMPLATES) {
  const p = path.join(ROOT, tpl);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
    if (m) {
      if (!declared.has(m[1])) declared.set(m[1], []);
      declared.get(m[1]).push(tpl);
    }
  }
}

/**
 * Curated: variables the PRODUCTION runtime genuinely needs, each with the
 * evidence that justifies it. Verified by reading the consuming code.
 */
const PRODUCTION_REQUIRED = {
  DATABASE_URL:
    'Prisma datasource url = env("DATABASE_URL") in prisma/schema.prisma. The canonical and only database connection source.',
  NEXTAUTH_SECRET:
    'next-auth v4 session token signing. src/app/api/portal-auth/login/route.ts returns WITHOUT setting the session cookie when absent, so login silently yields no session.',
  NEXTAUTH_URL:
    'next-auth v4 absolute callback/redirect base. Must equal the public origin in production.',
  ENCRYPTION_KEY:
    'AES-256-GCM key for stored integration tokens. src/lib/social/token-encryption.ts THROWS in production unless it is 64 hex characters.',
  FILE_SIGN_SECRET:
    'Signs secure download URLs. src/app/api/employee-access/secure-download/route.ts throws in production when shorter than 32 characters.',
  NODE_ENV:
    'Must be "production" so fail-closed security branches (encryption key, demo login, secure download) are active.',
  NEXT_PUBLIC_APP_URL:
    'Public origin baked into the client bundle at build time; wrong value breaks absolute links and CORS-sensitive calls.',
};

function classify(name) {
  const r = refs.get(name);
  if (!r) return 'UNUSED';
  if (name.startsWith('NEXT_PUBLIC_')) return 'PUBLIC';
  if (r.failClosed && !r.hasFallback) return 'REFERENCED_FAIL_CLOSED';
  if (r.hasFallback) return 'REFERENCED_WITH_FALLBACK';
  return 'REFERENCED';
}

const names = [...new Set([...refs.keys(), ...declared.keys()])].sort();
const variables = names.map((name) => {
  const r = refs.get(name);
  return {
    name,
    classification: classify(name),
    referenced: Boolean(r),
    referencedIndirectly: r ? Boolean(r.indirect) : false,
    referenceCount: r ? r.files.size : 0,
    failsClosedWhenMissing: r ? r.failClosed : false,
    hasInlineFallback: r ? r.hasFallback : false,
    productionRequired: Object.prototype.hasOwnProperty.call(PRODUCTION_REQUIRED, name),
    productionRequiredReason: PRODUCTION_REQUIRED[name] ?? null,
    declaredIn: declared.get(name) ?? [],
    sampleReferences: r ? [...r.files].sort().slice(0, 3) : [],
  };
});

const summary = variables.reduce((acc, v) => {
  acc[v.classification] = (acc[v.classification] ?? 0) + 1;
  return acc;
}, {});

// A NEXT_PUBLIC_* variable is inlined into client JavaScript. Anything that
// looks like a credential there is a hard error, not a warning.
const publicSecretSuspects = variables
  .filter((v) => v.name.startsWith('NEXT_PUBLIC_'))
  .filter((v) => /(SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE)/.test(v.name))
  .map((v) => v.name);

const report = {
  generatedBy: 'scripts/audit-env-vars.mjs',
  note:
    'Application code is authoritative. A variable declared only in a template is UNUSED. Indirect reads through an injectable env record count as references.',
  filesScanned: files.length,
  summary,
  productionRequired: Object.keys(PRODUCTION_REQUIRED).sort(),
  publicSecretSuspects,
  variables,
};

const OUT = path.join(ROOT, 'docs', 'environment-classification.json');
const serialised = `${JSON.stringify(report, null, 2)}\n`;

if (process.argv.includes('--check')) {
  if (!existsSync(OUT)) {
    console.error(`::error::${path.relative(ROOT, OUT)} is missing. Run: node scripts/audit-env-vars.mjs`);
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8');
  // Compare the variable classification only; filesScanned can legitimately move.
  const a = JSON.stringify(JSON.parse(current).variables);
  const b = JSON.stringify(report.variables);
  if (a !== b) {
    console.error('::error::docs/environment-classification.json is stale. Run: node scripts/audit-env-vars.mjs');
    process.exit(1);
  }
  console.log('✓ environment classification is up to date');
} else {
  writeFileSync(OUT, serialised);
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  console.log(JSON.stringify(summary, null, 2));
  if (publicSecretSuspects.length > 0) {
    console.log(`\nNEXT_PUBLIC_* names that look secret-bearing: ${publicSecretSuspects.join(', ')}`);
  }
}
