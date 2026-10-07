#!/usr/bin/env node
// ============================================================================
// ALO Education — dependency security audit (CI gate)
//
// Runs `npm audit --audit-level=high` semantics with a surgical, fail-closed
// waiver mechanism. Plain `npm audit` has no per-advisory ignore, so this
// parser:
//   1. collects every advisory object in the audit tree,
//   2. waives ONLY advisories explicitly listed below (by advisory id + url),
//   3. recomputes the transitive "effective vulnerable package" set
//      (dict-via = direct advisory; string-via = inherits from that package),
//   4. exits 1 if ANY remaining high/critical advisory survives.
//
// Waiver policy — GHSA-vfj7-8cjw-p6xm (braces ≤3.0.3, id 1240992):
//   braces@3.0.3 is the LATEST published release; the advisory (published
//   2026-10-03) covers every existing 3.0.x, so no upgrade path exists yet.
//   Exposure is confined to dev-tooling glob parsing (eslint-config-next →
//   fast-glob → micromatch → braces): an exploit requires an
//   attacker-controlled glob PATTERN, and every pattern in this repository's
//   lint/test config is static and repo-controlled. Zero production impact.
//   REVISIT: drop the waiver when braces ships a patched release — any other
//   high/critical advisory (including a NEW one against braces) still fails.
// ============================================================================
import { execFileSync } from 'node:child_process';

const WAIVED_ADVISORIES = new Map([
  [1240992, {
    packageName: 'braces',
    url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
    severity: 'high',
    affectedRange: '<=3.0.3',
  }],
]);

function isNarrowlyWaived(packageName, advisory) {
  const waiver = WAIVED_ADVISORIES.get(advisory.source);
  return Boolean(
    waiver &&
    packageName === waiver.packageName &&
    advisory.url === waiver.url &&
    advisory.severity === waiver.severity &&
    advisory.range === waiver.affectedRange,
  );
}

const WAIVED_ADVISORY_IDS = new Set([
  1240992, // GHSA-vfj7-8cjw-p6xm — see waiver policy above
]);

function runAudit() {
  try {
    const out = execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch (error) {
    // npm audit exits non-zero when vulnerabilities exist — the JSON is on stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

const audit = runAudit();
const vulnerabilities = audit.vulnerabilities ?? {};

// Pass 1: collect advisory objects per package, honoring the waiver.
const waivedSeen = new Set();
const directFindings = new Map(); // pkg -> remaining advisory objects
for (const [pkg, info] of Object.entries(vulnerabilities)) {
  const vias = Array.isArray(info.via) ? info.via : [];
  const remaining = [];
  for (const via of vias) {
    if (typeof via === 'object' && via !== null) {
      if (isNarrowlyWaived(pkg, via)) {
      if (WAIVED_ADVISORY_IDS.has(via.source)) {
        waivedSeen.add(via.source);
        continue; // waived
      }
      remaining.push(via);
    }
  }
  directFindings.set(pkg, remaining);
}

// Pass 2: fixpoint — a package is effective if it has a remaining direct
// advisory or inherits one via a string reference to an effective package.
const effective = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    if (effective.has(pkg)) continue;
    if (info.severity !== 'high' && info.severity !== 'critical') continue;
    if ((directFindings.get(pkg) ?? []).length > 0) {
      effective.add(pkg);
      changed = true;
      continue;
    }
    for (const via of info.via ?? []) {
      if (typeof via === 'string' && effective.has(via)) {
        effective.add(pkg);
        changed = true;
        break;
      }
    }
  }
}

if (waivedSeen.size > 0) {
  console.log(
    `⚠ waived advisories (see scripts/ci/npm-security-audit.mjs): ` +
      [...waivedSeen].map((id) => `#${id}`).join(', '),
  );
}

if (effective.size > 0) {
  console.error(`✗ dependency audit FAILED — ${effective.size} effective high/critical vulnerability chain(s):`);
  for (const pkg of [...effective].sort()) {
    const info = vulnerabilities[pkg];
    const heads = (directFindings.get(pkg) ?? [])
      .map((via) => `${via.url ?? via.source} (${via.severity}, range ${via.range})`)
      .join('; ');
    console.error(`  - ${pkg} [${info.severity}]${heads ? ` — ${heads}` : ' (transitive)'}`);
  }
  process.exit(1);
}

console.log('✓ dependency audit passed (0 effective high/critical advisories)');
