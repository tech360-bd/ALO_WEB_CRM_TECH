// Fail-closed output guard for synthetic catalogue generators (2026-10-12).
//
// The legacy generators invent universities, courses, intakes, fees and
// "verification" reports. They may only write into an explicit non-production
// directory chosen by the developer:
//
//   ALO_SYNTHETIC_OUTPUT_DIR=fixtures/synthetic-catalogue/<anything>   or
//   ALO_SYNTHETIC_OUTPUT_DIR=staging/synthetic/<anything>
//
// Anything else (unset, repository root, src/, docs/import-templates/, data/,
// public/, prisma/, absolute paths elsewhere, `..` traversal) is refused, and
// NODE_ENV=production is always refused. Output is never verified data.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ALLOWED_SYNTHETIC_ROOTS = ['fixtures/synthetic-catalogue', 'staging/synthetic'];

export class SyntheticOutputRefused extends Error {}

function within(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Resolves the generator output directory or throws SyntheticOutputRefused. */
export function resolveSyntheticOutputDir(env = process.env, repoRoot = REPO_ROOT) {
  if (String(env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new SyntheticOutputRefused('synthetic generators never run with NODE_ENV=production');
  }
  const raw = String(env.ALO_SYNTHETIC_OUTPUT_DIR || '').trim();
  if (!raw) {
    throw new SyntheticOutputRefused(
      `set ALO_SYNTHETIC_OUTPUT_DIR to a directory under ${ALLOWED_SYNTHETIC_ROOTS.join(' or ')}`,
    );
  }
  const abs = path.resolve(repoRoot, raw);
  const ok = ALLOWED_SYNTHETIC_ROOTS.some((r) => within(abs, path.join(repoRoot, r)));
  if (!ok) {
    throw new SyntheticOutputRefused(
      `refusing output directory ${raw}: only ${ALLOWED_SYNTHETIC_ROOTS.join(' or ')} (non-production) are allowed`,
    );
  }
  return abs;
}

/** Joins a relative path under the output dir; refuses absolute paths and traversal. */
export function syntheticOutputPath(outDir, relative) {
  const rel = String(relative || '');
  if (path.isAbsolute(rel)) throw new SyntheticOutputRefused(`absolute output path refused: ${rel}`);
  const target = path.resolve(outDir, rel);
  if (!within(target, outDir)) throw new SyntheticOutputRefused(`output path escapes ${outDir}: ${rel}`);
  return target;
}

/** CLI helper: returns the output dir, or prints the reason and exits 1 before any work. */
export function requireSyntheticOutputDir(scriptName, env = process.env) {
  try {
    const dir = resolveSyntheticOutputDir(env);
    console.error(`[${scriptName}] writing SYNTHETIC, UNVERIFIED output only under ${path.relative(REPO_ROOT, dir) || '.'}`);
    return dir;
  } catch (err) {
    if (err instanceof SyntheticOutputRefused) {
      console.error(`[${scriptName}] REFUSED: ${err.message}. No files were written.`);
      process.exit(1);
    }
    throw err;
  }
}
