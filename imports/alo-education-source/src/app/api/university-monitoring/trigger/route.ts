import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/university-monitoring/trigger
// Super Admin: manually trigger a monitoring run.
// In production, this delegates to the mini-service which holds the scheduler.
// In the sandbox (no separate mini-service running), this kicks off a lightweight
// verification pass that re-checks the official source URLs for a sample of
// universities and records any detected changes.
//
// Body: { performedBy, scope? } where scope = "all" | "verified-only" | "country:XX"
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { performedBy, scope = "verified-only", limit } = body as { performedBy: string; scope?: string; limit?: number };

  if (!performedBy) {
    return NextResponse.json({ error: "performedBy is required" }, { status: 400 });
  }

  // 1. Acquire the scheduler lock (prevent duplicate concurrent runs)
  const job = await db.monitoringJob.findUnique({ where: { jobId: "university-monitor-7d" } });
  if (!job) {
    return NextResponse.json({ error: "Monitoring job not configured" }, { status: 500 });
  }

  if (job.lockedBy && job.lockExpiresAt && job.lockExpiresAt > new Date()) {
    return NextResponse.json({
      error: "A monitoring run is already in progress",
      lockedBy: job.lockedBy,
      lockExpiresAt: job.lockExpiresAt,
    }, { status: 409 });
  }

  const instanceId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const lockExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await db.monitoringJob.update({
    where: { id: job.id },
    data: {
      lockedBy: instanceId,
      lockedAt: new Date(),
      lockExpiresAt: lockExpiry,
    },
  });

  // 2. Create the VerificationRun record
  const runId = `VR-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).toUpperCase()}`;
  const run = await db.verificationRun.create({
    data: {
      jobId: job.id,
      runId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  await db.monitoringJob.update({
    where: { id: job.id },
    data: {
      lastRunId: run.id,
      lastRunStartedAt: new Date(),
      lastRunStatus: "RUNNING",
      totalRuns: { increment: 1 },
    },
  });

  await db.monitoringLog.create({
    data: {
      runId: run.id,
      jobId: job.id,
      level: "AUDIT",
      message: `Manual monitoring run triggered by ${performedBy} (scope: ${scope})`,
      metadata: JSON.stringify({ triggeredBy: performedBy, scope, instanceId }),
    },
  });

  // 3. Perform the monitoring (lightweight in-process check)
  // In production this is delegated to the mini-service worker.
  try {
    const { runMonitoringCycle } = await import("@/lib/university-monitoring-engine");
    const scopeTyped = (scope as "all" | "verified-only" | "country:XX");
    const result = await runMonitoringCycle(run.id, { scope: scopeTyped, limit: limit || 50 });

    // 4. Mark run complete and release the lock
    await db.verificationRun.update({
      where: { id: run.id },
      data: {
        status: result.counts.failedSources > 0 && result.counts.sourcesChecked > 0 ? "PARTIAL" : "COMPLETED",
        completedAt: new Date(),
        ...result.counts,
        aiReportSummary: result.aiReportSummary,
      },
    });

    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 7);
    nextRun.setHours(3, 0, 0, 0);

    await db.monitoringJob.update({
      where: { id: job.id },
      data: {
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        lastRunCompletedAt: new Date(),
        lastRunStatus: "COMPLETED",
        successfulRuns: { increment: 1 },
        nextRunAt: nextRun,
      },
    });

    await db.monitoringLog.create({
      data: {
        runId: run.id,
        jobId: job.id,
        level: "INFO",
        message: `Monitoring run completed: ${result.counts.sourcesChecked} sources checked, ${result.counts.changesDetected} changes detected`,
      },
    });

    return NextResponse.json({
      runId: run.id,
      status: "COMPLETED",
      ...result.counts,
      aiReportSummary: result.aiReportSummary,
    });
  } catch (err: any) {
    // Release the lock and mark as failed
    await db.verificationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date(), errorMessage: err.message },
    });
    await db.monitoringJob.update({
      where: { id: job.id },
      data: {
        lockedBy: null,
        lockedAt: null,
        lockExpiresAt: null,
        lastRunCompletedAt: new Date(),
        lastRunStatus: "FAILED",
        failedRuns: { increment: 1 },
      },
    });
    await db.monitoringLog.create({
      data: {
        runId: run.id,
        jobId: job.id,
        level: "ERROR",
        message: `Monitoring run failed: ${err.message}`,
      },
    });
    return NextResponse.json({ error: err.message, runId: run.id }, { status: 500 });
  }
}
