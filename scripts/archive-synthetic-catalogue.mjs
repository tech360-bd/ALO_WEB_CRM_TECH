#!/usr/bin/env node
/**
 * Synthetic catalogue archive: classify tracked catalogue datasets and (only
 * when explicitly asked) relocate the synthetic ones into the non-production
 * fixture archive with `git mv`.
 *
 *   node scripts/archive-synthetic-catalogue.mjs              # dry run: print the plan, change nothing
 *   node scripts/archive-synthetic-catalogue.mjs --manifest   # also write the manifest JSON (AUDIT/)
 *   node scripts/archive-synthetic-catalogue.mjs --apply      # git mv the synthetic files (needs approval)
 *
 * Rules:
 *  - Never deletes anything. `--apply` only renames tracked files with
 *    `git mv` into fixtures/synthetic-catalogue/<original path>, which keeps
 *    history and is reversible (`git mv` back, or `git restore --staged`).
 *  - Refuses to run `--apply` when any file to be moved has uncommitted
 *    changes, or when a destination already exists.
 *  - Project inventories, audit evidence, official-source research evidence,
 *    header-only templates and the documented import template are KEPT.
 *
 * Why not move during review: the synthetic set is ~600 MB of tracked CSV/JSON.
 * As an uncommitted working-tree change it would be a ~1.2 GB delete+add
 * patch; as a committed `git mv` it is a cheap rename. Run --apply only as
 * part of an approved commit.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const ARCHIVE_DIR = 'fixtures/synthetic-catalogue';
const MANIFEST = 'AUDIT/course-finder-2026-10-12/synthetic-catalogue-manifest.json';
const args = new Set(process.argv.slice(2));

const KEEP_RULES = [
  { re: /^AUDIT(-[\d-]+)?\//, category: 'keep_audit_evidence', reason: 'Audit evidence, not catalogue data.' },
  { re: /^delivery-evidence-[^/]+\//, category: 'keep_audit_evidence', reason: 'Delivery evidence inventory, not catalogue data.' },
  { re: /^docs\/(audit-[^/]+|verification|final-master|deployment-ownership|runtime-standard)\//, category: 'keep_project_document', reason: 'Project audit/planning document.' },
  { re: /^docs\/BRANCH-MERGE-/, category: 'keep_project_document', reason: 'Branch merge ledger.' },
  { re: /^docs\/catalogue-import\//, category: 'keep_documented_template', reason: 'Documented import template (header-only) or clearly-labelled synthetic example that the importer rejects.' },
  { re: /(^|\/)data\/official-source-audit\//, category: 'keep_research_evidence', reason: 'Official-source fetch/check evidence (real URLs and HTTP results); unverified as catalogue facts, not fabricated. Not read by any runtime code.' },
  { re: /(^|\/)(AI_AGENT_INVENTORY|API_INVENTORY|BUTTON-INVENTORY|DATABASE_MIGRATION_INVENTORY|DATABASE_MODEL_INVENTORY|DEPLOYMENT_FILE_INVENTORY|DOCUMENTATION_INVENTORY|ENVIRONMENT_VARIABLE_INVENTORY|FILE_MANIFEST|FINAL-FILE-INVENTORY|LINK-INVENTORY|PAGE_ROUTE_INVENTORY|PERMISSION_INVENTORY|PROVIDER_INTEGRATION_MATRIX|PUBLIC_ASSET_INVENTORY|ROLE_INVENTORY|ROUTE_INVENTORY|TEST_INVENTORY)\.csv$/, category: 'keep_project_inventory', reason: 'Code/project inventory, not catalogue data.' },
  { re: /^(package-lock|tsconfig|package|components)\.json$|(^|\/)agents\/|search-index\.json$|occurrences\.json$|readme-review/, category: 'keep_project_inventory', reason: 'Project file, not catalogue data.' },
];

// Catalogue datasets: CSV/JSON describing universities, courses, intakes, fees,
// requirements, scholarships, rankings, supervisors, campuses, sources or the
// verification/coverage reports generated from them.
const CATALOGUE_NAME = /(universit|course|intake|tuition|fee|requirement|english|scholarship|ranking|supervisor|campus|deadline|source|verification|coverage|missing|duplicate|dedup|conflict|import_manifest|IMPORT_MANIFEST|provenance|integrity|synthetic|master|document)/i;

function rowsOf(abs) {
  const buf = fs.readFileSync(abs);
  let n = 0;
  for (const b of buf) if (b === 10) n++;
  if (buf.length && buf[buf.length - 1] !== 10) n++;
  return { bytes: buf.length, lines: n, sha256: createHash('sha256').update(buf).digest('hex'), header: buf.subarray(0, Math.min(buf.length, 400)).toString('utf8').split(/\r?\n/)[0] };
}

function classify(rel) {
  for (const rule of KEEP_RULES) if (rule.re.test(rel)) return { category: rule.category, reason: rule.reason };
  const base = path.basename(rel);
  if (!CATALOGUE_NAME.test(base)) return { category: 'keep_unclassified', reason: 'Not recognised as a catalogue dataset; left in place for manual review.' };
  return null; // decided after reading the file
}

const tracked = execFileSync('git', ['ls-files', '-z', '--', '*.csv', '*.CSV', '*.json'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
const entries = [];
for (const rel of tracked) {
  if (rel.startsWith(`${ARCHIVE_DIR}/`)) { entries.push({ path: rel, category: 'already_archived', reason: 'Already in the fixture archive.' }); continue; }
  const isJson = rel.toLowerCase().endsWith('.json');
  let c = classify(rel);
  if (isJson && !c) {
    // Only the known catalogue master JSON files are catalogue datasets.
    if (!/ALO_UNIVERSITY_COURSE_MASTER(_VERIFIED)?\.json$/.test(rel)) continue;
  } else if (isJson) continue;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { entries.push({ path: rel, category: 'missing_in_worktree', reason: 'Tracked but absent from the working tree; not touched.' }); continue; }
  const info = rowsOf(abs);
  if (!c) {
    if (!isJson && info.lines <= 1) c = { category: 'keep_header_only_template', reason: 'Header row only; contains no records.' };
    else c = { category: 'synthetic_catalogue', reason: isJson ? 'Generated catalogue master JSON (labelled VERIFIED; not verifiable).' : 'Generated/templated catalogue dataset or a report derived from one; zero verifiable records (see UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md).' };
  }
  entries.push({ path: rel, ...c, bytes: info.bytes, lines: info.lines, sha256: info.sha256, header: info.header.slice(0, 200), ...(c.category === 'synthetic_catalogue' ? { destination: `${ARCHIVE_DIR}/${rel}` } : {}) });
}

const toMove = entries.filter((e) => e.category === 'synthetic_catalogue');
const summary = {};
for (const e of entries) {
  summary[e.category] ??= { files: 0, bytes: 0 };
  summary[e.category].files++;
  summary[e.category].bytes += e.bytes ?? 0;
}

console.log(`Tracked CSV + catalogue JSON examined: ${entries.length}`);
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(28)} ${String(v.files).padStart(4)} files  ${(v.bytes / 1048576).toFixed(1)} MB`);

if (args.has('--manifest')) {
  const out = {
    generatedAt: new Date().toISOString(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    archiveDir: ARCHIVE_DIR,
    note: 'Classification is by path, name and header. synthetic_catalogue files are moved by --apply; everything else stays in place.',
    summary,
    entries,
  };
  fs.writeFileSync(path.join(ROOT, MANIFEST), `${JSON.stringify(out, null, 1)}\n`);
  console.log(`Manifest written: ${MANIFEST}`);
}

if (!args.has('--apply')) {
  console.log(`Dry run: ${toMove.length} file(s) would be moved into ${ARCHIVE_DIR}/ with git mv. Nothing was changed.`);
  process.exit(0);
}

// ---- --apply ----------------------------------------------------------------
const dirty = execFileSync('git', ['status', '--porcelain', '-z', '--', ...toMove.map((e) => e.path)], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
if (dirty.length) {
  console.error(`Refusing: ${dirty.length} file(s) to be moved have uncommitted changes.`);
  process.exit(1);
}
const clash = toMove.filter((e) => fs.existsSync(path.join(ROOT, e.destination)));
if (clash.length) {
  console.error(`Refusing: ${clash.length} destination(s) already exist, e.g. ${clash[0].destination}`);
  process.exit(1);
}
for (const e of toMove) {
  fs.mkdirSync(path.dirname(path.join(ROOT, e.destination)), { recursive: true });
  execFileSync('git', ['mv', '--', e.path, e.destination], { cwd: ROOT });
}
console.log(`Moved ${toMove.length} file(s) into ${ARCHIVE_DIR}/ with git mv. Review with: git status --short | head`);
