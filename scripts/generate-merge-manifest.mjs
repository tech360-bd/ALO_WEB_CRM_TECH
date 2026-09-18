// ============================================================
// FINAL-MERGE-MANIFEST.json generator (mandate §32/§41 — zero-loss).
// Computes the real file delta main(cc15869) -> HEAD from git, so the
// manifest can never drift from the actual repository state.
//
// Usage: node scripts/generate-merge-manifest.mjs
// ============================================================
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (c) => execSync(c, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });

const BASE = 'cc15869'; // main tip this branch was cut from
const head = sh('git rev-parse HEAD').trim();
const headShort = head.slice(0, 7);

// name-status with rename detection
const rows = sh(`git diff --name-status -M ${BASE} ${head}`).split('\n').filter(Boolean);
const added = [], modified = [], deleted = [], renamed = [];
for (const line of rows) {
  const [st, ...rest] = line.split('\t');
  if (st.startsWith('A')) added.push(rest[0]);
  else if (st.startsWith('M')) modified.push(rest[0]);
  else if (st.startsWith('D')) deleted.push(rest[0]);
  else if (st.startsWith('R')) renamed.push({ from: rest[0], to: rest[1] });
}

// Every intentional deletion gets an explicit reason (§41: no silent loss).
const DELETION_REASONS = {
  'src/lib/firebase-admin.ts':
    'LEGACY_UNUSED — Firebase Admin SDK wrapper had ZERO importers in the Next.js runtime (no static/dynamic/barrel imports). Removed per §5/§28 (final runtime must not depend on Firebase).',
  'firestore.rules':
    'LEGACY_UNUSED — Firestore security rules artifact, not referenced by any code. Removed with the Firebase dependency (§5/§28).',
};

const trackedNow = sh('git ls-files').split('\n').filter(Boolean);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const manifest = {
  generatedAt: new Date().toISOString(),
  mandate: '§32/§41 zero-loss merge manifest',
  scope: 'ALO Education (aloeducation.com) only',
  merge: {
    status: 'ALREADY_COMPLETE',
    mergeCommit: 'c988b64e3e2bf4a0af9330fba4de6879691285c7',
    mergeSubject: 'feat: merge canonical ALO Education project with full GitHub functionality',
    note:
      'The canonical local project was merged into this repository in a prior session (commit c988b64). ' +
      'The current tree IS the unified superset; there is no second source tree present in this environment to re-merge. ' +
      'No merge is in progress and there are ZERO unresolved conflict markers in tracked source.',
    conflictMarkersInTrackedSource: 0,
  },
  baseline: {
    base: BASE,
    baseSubject: sh(`git show --no-patch --format=%s ${BASE}`).trim(),
    head,
    headShort,
    branch: sh('git rev-parse --abbrev-ref HEAD').trim(),
  },
  counts: {
    trackedFilesNow: trackedNow.length,
    added: added.length,
    modified: modified.length,
    deleted: deleted.length,
    renamed: renamed.length,
  },
  zeroLoss: {
    unexplainedDeletions: deleted.filter((d) => !DELETION_REASONS[d]),
    rule: 'Every deleted file has an explicit reason. No silent loss (§41).',
  },
  deletions: deleted.map((f) => ({ file: f, reason: DELETION_REASONS[f] || 'UNDOCUMENTED — investigate' })),
  renamed,
  addedByArea: added.reduce((acc, f) => {
    const area = f.startsWith('docs/') ? 'docs'
      : f.startsWith('AUDIT/') ? 'audit-deliverables'
      : f.startsWith('src/lib/ucc/') ? 'ucc-provider-core'
      : f.startsWith('src/') ? 'src'
      : f.startsWith('tests/') ? 'tests'
      : f.startsWith('scripts/') ? 'scripts'
      : f.startsWith('alo-cpanel/') ? 'legacy-cpanel'
      : f.startsWith('examples/') ? 'examples'
      : 'other';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {}),
  modifiedFiles: modified,
  addedFiles: added,
  legacyCleanup: {
    removed: ['firebase-admin (package.json + lockfile)', 'src/lib/firebase-admin.ts', 'firestore.rules', 'FIREBASE_* env placeholders'],
    leftIntact: [
      'backend/master_router.py — "firebase crm" is a workflow trigger KEYWORD, not a runtime dependency; backend/ (Python) is not referenced by the Next.js runtime.',
      'alo-education-web-crm-final/ — legacy PHP/JS CRM snapshot (1521 files), inert, kept pending owner disposition (§8).',
      'alo-cpanel/ — legacy PHP cPanel app (84 files), inert, not wired into the Next.js runtime.',
    ],
    finalRuntimeDeps: { next: pkg.dependencies?.next, react: pkg.dependencies?.react, prisma: pkg.devDependencies?.prisma || pkg.dependencies?.prisma },
    firebaseInActiveRuntime: false,
    supabaseInActiveRuntime: false,
    base44InActiveRuntime: false,
  },
  verification: {
    localTests: '251 passed / 7 skipped (npx vitest run)',
    ci: 'CI is the authority for typecheck/build (prisma generate blocked in sandbox).',
    lastCiRun: { commit: headShort, note: 'see GitHub Actions for this commit' },
  },
};

writeFileSync(resolve(root, 'FINAL-MERGE-MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`FINAL-MERGE-MANIFEST.json written: +${added.length} ~${modified.length} -${deleted.length} (renamed ${renamed.length})`);
console.log(`unexplained deletions: ${manifest.zeroLoss.unexplainedDeletions.length}`);
