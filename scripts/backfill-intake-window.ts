/**
 * CLI runner for the intake window backfill (Jan 2027 … Jan 2028 on every course).
 *
 * Run with tsx, matching the repo's other TypeScript scripts:
 *   npx tsx scripts/backfill-intake-window.ts                 # all active courses
 *   npx tsx scripts/backfill-intake-window.ts --dry-run       # report only
 *   npx tsx scripts/backfill-intake-window.ts --limit 500
 *   npx tsx scripts/backfill-intake-window.ts --course <courseId>
 *
 * The logic lives in src/lib/course-finder/intake-window-backfill.ts so the admin
 * API and this CLI can never drift. Verified rows are never overwritten; generated
 * rows carry no fees or deadlines and are marked SCHEDULED, not VERIFIED.
 */
import { PrismaClient } from '@prisma/client';
import { backfillIntakeWindow } from '../src/lib/course-finder/intake-window-backfill';
import { INTAKE_WINDOW_LABEL, INTAKE_WINDOW_MONTHS } from '../src/lib/course-finder/intake-window';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const courseIndex = args.indexOf('--course');
  const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) || 0 : 0;
  const courseId = courseIndex >= 0 ? args[courseIndex + 1] || '' : '';

  const prisma = new PrismaClient();
  console.log(`Intake window backfill ${dryRun ? '(dry run) ' : ''}— ${INTAKE_WINDOW_LABEL} (${INTAKE_WINDOW_MONTHS.length} months)`);

  try {
    const report = await backfillIntakeWindow(prisma, { dryRun, limit, courseId, log: console.log });
    console.log('\nResult:');
    for (const [key, value] of Object.entries(report)) console.log(`  ${key}: ${value}`);
    if (report.failed > 0) {
      console.log('\nSome rows failed — see the log above. Re-running is safe: verified rows are never touched.');
    }
    if (report.skippedNoUniversity > 0) {
      console.log(`\n${report.skippedNoUniversity} course(s) have no university link. Fix those records first — the spec forbids orphan courses.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
