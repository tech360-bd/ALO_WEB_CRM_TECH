/**
 * CLI runner for the read-only Jan 2027 … Jan 2028 intake coverage report.
 *
 * Run with tsx, matching the repo's other TypeScript scripts:
 *   npx tsx scripts/backfill-intake-window.ts                 # all active courses
 *   npx tsx scripts/backfill-intake-window.ts --limit 500
 *   npx tsx scripts/backfill-intake-window.ts --course <courseId>
 *
 * `--dry-run` remains accepted for backward compatibility, but this command is
 * always read-only. Missing months are never generated or treated as availability.
 */
import { PrismaClient } from '@prisma/client';
import { backfillIntakeWindow } from '../src/lib/course-finder/intake-window-backfill';
import { INTAKE_WINDOW_LABEL, INTAKE_WINDOW_MONTHS } from '../src/lib/course-finder/intake-window';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const courseIndex = args.indexOf('--course');
  const rawLimit = limitIndex >= 0 ? args[limitIndex + 1] : undefined;
  if (limitIndex >= 0 && (!rawLimit || !/^\d+$/.test(rawLimit))) {
    throw new Error('--limit must be followed by an integer from 0 to 10000.');
  }
  const limit = rawLimit === undefined ? 0 : Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 10_000) {
    throw new Error('--limit must be an integer from 0 to 10000.');
  }
  const rawCourseId = courseIndex >= 0 ? args[courseIndex + 1] : undefined;
  if (courseIndex >= 0 && (!rawCourseId || rawCourseId.startsWith('--') || !rawCourseId.trim() || rawCourseId.trim().length > 191)) {
    throw new Error('--course must be followed by a non-empty courseId of at most 191 characters.');
  }
  const courseId = rawCourseId || '';

  const prisma = new PrismaClient();
  console.log(`Read-only intake coverage report ${dryRun ? '(--dry-run requested) ' : ''}— ${INTAKE_WINDOW_LABEL} (${INTAKE_WINDOW_MONTHS.length} months)`);

  try {
    const report = await backfillIntakeWindow(prisma, { dryRun, limit, ...(courseId ? { courseId } : {}), log: console.log });
    console.log('\nResult:');
    for (const [key, value] of Object.entries(report)) console.log(`  ${key}: ${value}`);
    if (report.skippedNoUniversity > 0) {
      console.log(`\n${report.skippedNoUniversity} active course(s) lack a university link. This read-only report leaves those records unchanged.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
