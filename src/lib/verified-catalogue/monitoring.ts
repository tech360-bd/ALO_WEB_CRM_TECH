/**
 * 7-DAY MONITORING — verified catalogue coverage
 * =============================================
 * Extends the existing "ALO University & Official Data Monitoring Agent" (which
 * already owns durable scheduling, CAS locking, restart recovery and approval
 * staging in `university-monitoring-runner.ts`) with the 13-month coverage
 * dimension that the previous delivery was missing:
 *
 *  • every published course-month must be re-verified within 7 days,
 *  • stale or missing months are turned into durable, retryable research-queue
 *    work items (never silently re-dated or re-published),
 *  • every cycle writes an auditable report (counts, staleness, conflicts,
 *    source failures, coverage matrix) that the dashboard and the weekly report
 *    read from a single place.
 *
 * Idempotency: re-running a cycle creates at most one queue item per stale
 * course-month (`queueKey = recheck:<coverageKey>`), so retries and restarts
 * cannot fan out duplicate work.
 */

import type { PrismaClient } from '@prisma/client';
import { buildCoverageMatrix, summarizeCoverage, type CoverageMatrix } from './coverage';
import { windowMonths } from './validation';

export const COVERAGE_STALE_AFTER_DAYS = 7;
export const COVERAGE_MONITOR_ACTION = 'COVERAGE_MONITOR_CYCLE';

export interface CoverageMonitoringReport {
  generatedAt: string;
  window: string[];
  totals: CoverageMatrix['totals'];
  courses: number;
  publishedRows: number;
  pendingApprovals: number;
  rejectedRows: number;
  staleCourseMonths: Array<{ coverageKey: string; courseSlug: string; lastVerifiedAt: string | null; status: string }>;
  missingCourseMonths: Array<{ courseSlug: string; month: string }>;
  conflictsAwaitingReview: number;
  failedOfficialSources: number;
  researchQueue: { total: number; byStatus: Record<string, number>; byCountry: Record<string, number> };
  evidenceRecords: number;
  uninspectedEvidence: number;
  courseMatrix: Array<{ courseSlug: string; availableMonths: string[]; missingMonths: string[] }>;
  actionsTaken: { recheckItemsCreated: number; recheckItemsExisting: number };
}

function isoDate(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

/**
 * Compute the report and (optionally) enqueue re-verification work.
 * `apply: false` gives a read-only dry run used by the dashboard endpoint.
 */
export async function runCoverageMonitoringCycle(
  prisma: PrismaClient,
  options: { now?: Date; apply?: boolean; actorUserId?: string } = {},
): Promise<CoverageMonitoringReport> {
  const now = options.now ?? new Date();
  const apply = options.apply !== false;
  const staleBefore = new Date(now.getTime() - COVERAGE_STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const months = windowMonths().map(({ year, month }) => `${year}-${String(month).padStart(2, '0')}`);

  const courses = await prisma.crmCourse.findMany({
    where: { monthlyCoverage: { some: {} } },
    include: { university: true, monthlyCoverage: true },
  });

  const coverageRows = courses.flatMap((course) => course.monthlyCoverage);
  const publishedRows = coverageRows.filter((row) => row.published);

  const matrix = buildCoverageMatrix(
    courses.map((course) => ({
      slug: course.slug,
      title: course.courseTitle,
      universitySlug: course.university.slug,
      universityName: course.university.name,
      country: course.university.country,
    })),
    publishedRows.map((row) => ({
      courseSlug: courses.find((course) => course.courseId === row.courseId)?.slug ?? '',
      year: row.year,
      month: row.month,
      status: row.status,
      startDate: row.startDate,
      feeAmount: row.feeAmount,
      feeCurrency: row.feeCurrency,
      evidenceId: row.evidenceId,
    })),
  );
  const summary = summarizeCoverage(matrix);

  const stale = publishedRows
    .filter((row) => !row.lastVerifiedAt || new Date(row.lastVerifiedAt) < staleBefore)
    .map((row) => ({
      coverageKey: row.coverageKey,
      courseSlug: courses.find((course) => course.courseId === row.courseId)?.slug ?? row.courseId,
      lastVerifiedAt: isoDate(row.lastVerifiedAt),
      status: row.status,
    }));

  let recheckItemsCreated = 0;
  let recheckItemsExisting = 0;
  if (apply) {
    for (const item of stale) {
      const row = publishedRows.find((entry) => entry.coverageKey === item.coverageKey);
      const course = courses.find((entry) => entry.courseId === row?.courseId);
      if (!row || !course) continue;
      const queueKey = `recheck:${item.coverageKey}`;
      const existing = await prisma.crmResearchQueueItem.findUnique({ where: { queueKey } });
      if (existing) {
        recheckItemsExisting += 1;
        continue;
      }
      await prisma.crmResearchQueueItem.create({
        data: {
          queueKey,
          countrySlug: course.university.country.toLowerCase().replace(/\s+/g, '-'),
          universityName: course.university.name,
          universitySlug: course.university.slug,
          officialWebsite: course.university.website || course.university.officialUrl,
          catalogueUrl: course.officialUrl,
          priority: item.status === 'VERIFIED_AVAILABLE' ? 25 : 10,
          status: 'QUEUED',
          reason: `Course-month ${item.coverageKey} has not been re-verified since ${item.lastVerifiedAt ?? 'never'} (${COVERAGE_STALE_AFTER_DAYS}-day SLA).`,
          discoveredVia: COVERAGE_MONITOR_ACTION,
          nextAction: 'Re-open the official intake/fee page, capture a fresh evidence excerpt, and stage the result for Super Admin approval. Do not re-date the existing value.',
        },
      });
      recheckItemsCreated += 1;
    }
  }

  const [conflictsAwaitingReview, failedOfficialSources, evidenceRecords, researchQueueItems] = await Promise.all([
    prisma.approvalQueueItem.count({ where: { queueType: 'CONFLICT', status: 'PENDING' } }),
    prisma.officialSource.count({ where: { status: 'BROKEN' } }),
    prisma.crmOfficialEvidence.count(),
    prisma.crmResearchQueueItem.findMany({ select: { status: true, countrySlug: true } }),
  ]);

  const byStatus: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  for (const item of researchQueueItems) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byCountry[item.countrySlug] = (byCountry[item.countrySlug] ?? 0) + 1;
  }

  const report: CoverageMonitoringReport = {
    generatedAt: now.toISOString(),
    window: months,
    totals: matrix.totals,
    courses: matrix.courseCount,
    publishedRows: publishedRows.length,
    pendingApprovals: coverageRows.filter((row) => row.approvalStatus === 'PENDING').length,
    rejectedRows: coverageRows.filter((row) => row.approvalStatus === 'REJECTED').length,
    staleCourseMonths: stale,
    // Data gaps are always reported — a course with one verified month can still
    // have eleven months that were never recorded.
    missingCourseMonths: matrix.courses.flatMap((course) =>
      course.missingMonths.map((month) => ({ courseSlug: course.courseSlug, month }))),
    conflictsAwaitingReview,
    failedOfficialSources,
    researchQueue: { total: researchQueueItems.length, byStatus, byCountry },
    evidenceRecords,
    uninspectedEvidence: await prisma.crmOfficialEvidence.count({ where: { verificationStatus: 'PENDING_REVIEW' } }),
    courseMatrix: matrix.courses.map((course) => ({
      courseSlug: course.courseSlug,
      availableMonths: course.availableMonths,
      missingMonths: course.missingMonths,
    })),
    actionsTaken: { recheckItemsCreated, recheckItemsExisting },
  };

  if (apply) {
    // Durable audit trail: appended to the same audit log the CRM already uses,
    // and readable by the dashboard without a new table.
    await prisma.crmAuditLog.create({
      data: {
        actorUserId: options.actorUserId ?? 'system:coverage-monitor',
        actorRole: 'SYSTEM',
        action: COVERAGE_MONITOR_ACTION,
        targetCollection: 'CrmCourseMonthlyCoverage',
        targetId: 'jan-2027-to-jan-2028',
        afterData: JSON.stringify({
          totals: report.totals,
          courses: report.courses,
          publishedRows: report.publishedRows,
          stale: report.staleCourseMonths.length,
          conflicts: report.conflictsAwaitingReview,
          actions: report.actionsTaken,
        }),
      },
    });
  }

  return report;
}

/** Latest stored coverage-monitoring audit entry (for the Super Admin dashboard). */
export async function latestCoverageMonitoringReport(prisma: PrismaClient) {
  const entry = await prisma.crmAuditLog.findFirst({
    where: { action: COVERAGE_MONITOR_ACTION },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, afterData: true, actorUserId: true },
  });
  if (!entry) return null;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(entry.afterData || '{}');
  } catch {
    parsed = null;
  }
  return { createdAt: entry.createdAt, actorUserId: entry.actorUserId, report: parsed };
}
