import { NextRequest, NextResponse } from "next/server";
import { publicCourseWhere, publicUniversityWhere } from '@/lib/public-catalog';
import { db } from "@/lib/db";
import { requireMonitoringViewer } from "@/lib/university-monitoring-auth";

// GET /api/university-monitoring/dashboard
// Returns the Super Admin monitoring dashboard summary.
// Authenticated staff read; authorization is enforced server-side below.
export async function GET(req: NextRequest) {
  // Staff-only: this endpoint exposes unapproved, unverified detected changes.
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

  const period = req.nextUrl.searchParams.get("period") || "30d";
  const since = new Date();
  if (period === "7d") since.setDate(since.getDate() - 7);
  else if (period === "30d") since.setDate(since.getDate() - 30);
  else if (period === "90d") since.setDate(since.getDate() - 90);
  else since.setFullYear(since.getFullYear() - 1);

  // 1. Job status
  const job = await db.monitoringJob.findUnique({ where: { jobId: "university-monitor-7d" } });

  // 2. Last run + next run
  const lastRun = job?.lastRunId
    ? await db.verificationRun.findUnique({ where: { id: job.lastRunId } })
    : null;
  const recentRuns = await db.verificationRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true, runId: true, status: true, startedAt: true, completedAt: true,
      universitiesChecked: true, coursesChecked: true, sourcesChecked: true,
      changesDetected: true, criticalChanges: true, failedSources: true, conflicts: true,
      aiReportSummary: true, errorMessage: true,
    },
  });

  // 3. Approval queue stats
  const [pending, approved, rejected, needsReview, recheckRequested, critical, conflicts] = await Promise.all([
    db.approvalQueueItem.count({ where: { status: "PENDING", queueType: "STANDARD" } }),
    db.dataChange.count({ where: { status: "APPROVED" } }),
    db.dataChange.count({ where: { status: "REJECTED" } }),
    db.approvalQueueItem.count({ where: { status: "PENDING", queueType: "MANUAL_REVIEW" } }),
    db.approvalQueueItem.count({ where: { status: "RECHECK_REQUESTED", queueType: "RECHECK" } }),
    db.dataChange.count({ where: { status: "PENDING", impactLevel: "CRITICAL" } }),
    db.dataConflict.count({ where: { status: "PENDING" } }),
  ]);

  // 4. Source stats
  const [totalSources, activeSources, brokenSources, failedSourcesCount] = await Promise.all([
    db.officialSource.count(),
    db.officialSource.count({ where: { status: "ACTIVE", monitoringEnabled: true } }),
    db.officialSource.count({ where: { status: "BROKEN" } }),
    db.officialSource.count({ where: { consecutiveFailures: { gt: 0 } } }),
  ]);

  // 5. Entity counts (real DB state)
  const [totalUniversities, verifiedUniversities, unverifiedUniversities, totalCourses, verifiedCourses, totalFaculties] = await Promise.all([
    db.crmUniversity.count(),
    db.crmUniversity.count({ where: publicUniversityWhere() }),
    db.crmUniversity.count({ where: { NOT: publicUniversityWhere() } }),
    db.crmCourse.count(),
    db.crmCourse.count({ where: publicCourseWhere() }),
    db.universityFaculty.count(),
  ]);

  // 6. Change breakdown by type (last period)
  const changesByType = await db.dataChange.groupBy({
    by: ["changeType"],
    where: { detectedAt: { gte: since } },
    _count: { id: true },
  });
  const changesByImpact = await db.dataChange.groupBy({
    by: ["impactLevel"],
    where: { detectedAt: { gte: since }, status: "PENDING" },
    _count: { id: true },
  });

  // 7. Degree-level distribution of courses
  const coursesByLevel = await db.crmCourse.groupBy({
    by: ["studyLevel"],
    _count: { id: true },
  });

  // 8. Official documents
  const [totalDocuments, approvedDocuments, discoveredDocuments] = await Promise.all([
    db.officialDocument.count(),
    db.officialDocument.count({ where: { approvalStatus: "APPROVED" } }),
    db.officialDocument.count({ where: { approvalStatus: "DISCOVERED" } }),
  ]);

  // 9. Health status
  let health: "HEALTHY" | "RUNNING" | "NEEDS_REVIEW" | "ERROR" = "HEALTHY";
  if (job?.lastRunStatus === "FAILED") health = "ERROR";
  else if (lastRun?.status === "RUNNING") health = job?.lockExpiresAt && job.lockExpiresAt < new Date() ? "ERROR" : "RUNNING";
  else if (!job || !lastRun || !activeSources || !lastRun.sourcesChecked || lastRun.status === "PARTIAL" || critical > 0 || conflicts > 0 || needsReview > 0 || failedSourcesCount > 0) health = "NEEDS_REVIEW";

  // 10. Universities by country
  const universitiesByCountry = await db.crmUniversity.groupBy({
    by: ["country"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return NextResponse.json({
    evidenceNotice: 'Entity counters describe stored catalogue record statuses, not independently completed university catalogue research. Discovery candidates are never verified programmes.',
    job: job ? {
      jobId: job.jobId,
      name: job.name,
      description: job.description,
      schedule: job.schedule,
      enabled: job.enabled,
      nextRunAt: job.nextRunAt,
      lastRunStartedAt: job.lastRunStartedAt,
      lastRunCompletedAt: job.lastRunCompletedAt,
      lastRunStatus: job.lastRunStatus,
      totalRuns: job.totalRuns,
      successfulRuns: job.successfulRuns,
      failedRuns: job.failedRuns,
      lockedBy: job.lockedBy,
      lockedAt: job.lockedAt,
      lockExpiresAt: job.lockExpiresAt,
    } : null,
    health,
    lastRun,
    recentRuns,
    queue: {
      pending,
      approved,
      rejected,
      needsReview,
      recheckRequested,
      critical,
      conflicts,
    },
    sources: {
      total: totalSources,
      active: activeSources,
      broken: brokenSources,
      failed: failedSourcesCount,
    },
    entities: {
      universities: totalUniversities,
      verifiedUniversities,
      unverifiedUniversities,
      courses: totalCourses,
      verifiedCourses,
      faculties: totalFaculties,
      documents: totalDocuments,
      approvedDocuments,
      discoveredDocuments,
    },
    changes: {
      byType: changesByType.map((c) => ({ type: c.changeType, count: c._count.id })),
      byImpact: changesByImpact.map((c) => ({ level: c.impactLevel, count: c._count.id })),
    },
    coursesByLevel: coursesByLevel.map((c) => ({ level: c.studyLevel, count: c._count.id })),
    universitiesByCountry: universitiesByCountry.map((c) => ({ country: c.country, count: c._count.id })),
  });
}
