import path from 'node:path';

/**
 * Containment guard for synthetic (generated/templated) catalogue datasets.
 *
 * The legacy CSV sets (universities.csv, courses.csv, course_intakes.csv,
 * tuition_fees.csv, campuses.csv, supervisors.csv, ...) are not verified
 * catalogue data; supervisors.csv contains invented people and e-mail
 * addresses. See AUDIT/course-finder-2026-10-12/SYNTHETIC-CATALOGUE-ARCHIVE.md.
 *
 * Rules:
 *  - Synthetic data is read ONLY from the non-production fixture archive
 *    (SYNTHETIC_CATALOGUE_DIR), never from the repository root or any other
 *    production data path. There is no fallback to the old root paths.
 *  - It is read only when a developer explicitly opts in
 *    (ALO_ALLOW_SYNTHETIC_AGENT_DATA=1) AND NODE_ENV is not "production".
 *    In production the flag is ignored.
 *  - In every other case callers receive `null` and must behave as if the
 *    file does not exist (empty data).
 */
export const SYNTHETIC_CATALOGUE_DIR = 'fixtures/synthetic-catalogue';

export function syntheticAgentDataAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ALO_ALLOW_SYNTHETIC_AGENT_DATA === '1' && env.NODE_ENV !== 'production';
}

/**
 * Absolute path of a synthetic fixture file, or null when synthetic data is
 * not allowed. Only plain file names are accepted (no directories, no
 * traversal), so a caller cannot point this at a production path.
 */
export function syntheticFixturePath(
  fileName: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string | null {
  if (!syntheticAgentDataAllowed(env)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(csv|json)$/.test(fileName) || fileName.includes('..')) return null;
  return path.resolve(cwd, SYNTHETIC_CATALOGUE_DIR, fileName);
}
