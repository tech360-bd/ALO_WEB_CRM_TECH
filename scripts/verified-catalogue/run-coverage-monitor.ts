#!/usr/bin/env tsx
/**
 * Run the 13-month coverage check of the ALO monitoring agent without waiting
 * for the 7-day schedule (useful for ops, CI and the weekly report).
 *
 *   npx tsx scripts/verified-catalogue/run-coverage-monitor.ts --dry-run
 *   npx tsx scripts/verified-catalogue/run-coverage-monitor.ts --apply
 *
 * The scheduled path is unchanged: /api/cron/university-monitoring owns the
 * durable 7-day cadence (MonitoringJob.nextRunAt + CAS lock) and calls the same
 * library function after each official-source cycle.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runCoverageMonitoringCycle } from '../../src/lib/verified-catalogue/monitoring';
import { createScriptPrisma } from './prisma-client';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const prisma = createScriptPrisma();
  try {
    const report = await runCoverageMonitoringCycle(prisma, { apply, actorUserId: 'cli:coverage-monitor' });
    const outDir = resolve(process.cwd(), 'reports/verified-catalogue');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, apply ? 'monitoring-report.json' : 'monitoring-report.dry-run.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      applied: apply,
      courses: report.courses,
      publishedRows: report.publishedRows,
      totals: report.totals,
      staleCourseMonths: report.staleCourseMonths.length,
      missingCourseMonths: report.missingCourseMonths.length,
      conflictsAwaitingReview: report.conflictsAwaitingReview,
      actionsTaken: report.actionsTaken,
      reportPath: `reports/verified-catalogue/${apply ? 'monitoring-report.json' : 'monitoring-report.dry-run.json'}`,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
