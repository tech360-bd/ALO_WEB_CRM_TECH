// ALO Education — University Data Monitoring Scheduler Mini-Service
// Runs the 7-day monitoring job. Survives restarts via database-backed locks.
//
// IMPORTANT: This service reads its schedule and lock state from the MonitoringJob
// table in the main database. On startup it:
//   1. Reads the job config (jobId: "university-monitor-7d")
//   2. Checks if nextRunAt has passed AND no other instance holds the lock
//   3. Acquires the lock, runs the monitoring cycle, releases the lock
//   4. Updates nextRunAt to now + 7 days
//   5. Polls every 5 minutes for the next due run
//
// This design means:
//   - Multiple instances can run safely (only one acquires the lock)
//   - Server restarts are fine (the job record persists; on restart it resumes)
//   - Manual triggers (via /api/university-monitoring/trigger) also respect the lock

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  log: ["error", "warn"],
});

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOCK_TTL_MS = 60 * 60 * 1000; // 1 hour — if a run takes longer than this, the lock is considered stale
const INSTANCE_ID = `monitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

console.log(`[ALO University Monitor] Starting scheduler instance: ${INSTANCE_ID}`);
console.log(`[ALO University Monitor] Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
console.log(`[ALO University Monitor] Lock TTL: ${LOCK_TTL_MS / 1000}s`);

async function ensureJobExists() {
  // Ensure the monitoring job exists. If not, create it with the default 7-day schedule.
  const existing = await db.monitoringJob.findUnique({ where: { jobId: "university-monitor-7d" } });
  if (!existing) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 7);
    nextRun.setHours(3, 0, 0, 0);
    await db.monitoringJob.create({
      data: {
        jobId: "university-monitor-7d",
        name: "ALO University & Official Data Monitoring Agent",
        description: "Continuously monitors official university and government sources every 7 days. Detects changes and routes to Super Admin approval queue.",
        schedule: "0 3 * * 1",
        enabled: true,
        maxRetries: 3,
        retryDelayMs: 60000,
        nextRunAt: nextRun,
      },
    });
    console.log("[ALO University Monitor] Created default monitoring job (next run in 7 days)");
  }
}

async function tryAcquireLock(job: any): Promise<boolean> {
  // Use a conditional update to atomically acquire the lock.
  // Only acquire if: lockedBy is null OR lockExpiresAt has passed.
  const now = new Date();
  const staleLock = !job.lockedBy || (job.lockExpiresAt && job.lockExpiresAt < now);

  if (!staleLock) return false;

  const lockExpiresAt = new Date(now.getTime() + LOCK_TTL_MS);
  // Conditional update: only update if lockedBy is still null/stale
  const updated = await db.monitoringJob.updateMany({
    where: {
      id: job.id,
      OR: [
        { lockedBy: null },
        { lockExpiresAt: { lt: now } },
      ],
    },
    data: {
      lockedBy: INSTANCE_ID,
      lockedAt: now,
      lockExpiresAt,
    },
  });
  return updated.count > 0;
}

async function releaseLock(jobId: string, nextRunAt: Date) {
  await db.monitoringJob.update({
    where: { id: jobId },
    data: {
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
      nextRunAt,
    },
  });
}

async function runMonitoringCycle(runId: string): Promise<void> {
  console.log(`[ALO University Monitor] Starting monitoring run: ${runId}`);

  // Import the engine logic inline (to avoid needing the main app's build)
  // We replicate the core fetch+diff logic here using the SDK directly.
  const sources = await db.officialSource.findMany({
    where: { monitoringEnabled: true, status: "ACTIVE" },
    take: 100, // limit per run to keep it manageable
    orderBy: [{ priority: "asc" }, { lastCheckedAt: { asc: true } }],
  });

  console.log(`[ALO University Monitor] Found ${sources.length} sources to check`);

  let sourcesChecked = 0;
  let changesDetected = 0;
  let failedSources = 0;
  let criticalChanges = 0;

  for (const source of sources) {
    try {
      // Fetch the source
      const res = await fetch(source.sourceUrl, {
        headers: { "User-Agent": "ALO-Education-Monitor/1.0 (+https://aloeducation.com)" },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });
      const text = await res.text();

      // Normalize
      const normalized = text
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const crypto = await import("crypto");
      const contentHash = crypto.createHash("sha256").update(normalized).digest("hex");
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Get previous snapshot
      const previous = await db.sourceSnapshot.findFirst({
        where: { sourceId: source.id },
        orderBy: { capturedAt: "desc" },
      });

      // Create new snapshot
      await db.sourceSnapshot.create({
        data: {
          sourceId: source.id,
          httpStatus: res.status,
          contentHash,
          contentLength: normalized.length,
          title,
          contentType: res.headers.get("content-type") || "text/html",
          textExtract: normalized.slice(0, 50000),
          aiSummary: `Fetched ${normalized.length} chars from ${source.sourceUrl}`,
          aiKeyFacts: "{}",
        },
      });

      // Update source
      await db.officialSource.update({
        where: { id: source.id },
        data: {
          lastCheckedAt: new Date(),
          lastHttpStatus: res.status,
          lastContentHash: contentHash,
          consecutiveFailures: 0,
          lastVerifiedAt: new Date(),
          status: "ACTIVE",
        },
      });

      // Detect change
      if (previous && previous.contentHash !== contentHash) {
        changesDetected++;
        await db.dataChange.create({
          data: {
            runId,
            sourceId: source.id,
            entityType: source.entityType,
            universitySlug: source.universitySlug,
            courseSlug: source.courseSlug,
            countrySlug: source.countrySlug,
            changeType: "SOURCE_CHANGED",
            fieldName: "page_content",
            oldValue: `hash:${previous.contentHash?.slice(0, 16)}`,
            newValue: `hash:${contentHash.slice(0, 16)}`,
            sourceUrl: source.sourceUrl,
            sourcePageTitle: title,
            detectedAt: new Date(),
            previousVerifiedAt: previous.capturedAt,
            aiExplanation: `Page content changed on ${source.sourceUrl}. Previous snapshot hash differs from current. Super Admin should review the diff and determine if any material facts (fees, intakes, deadlines, requirements) have changed.`,
            confidence: 0.7,
            impactLevel: "LOW",
            status: "PENDING",
          },
        }).then(async (change) => {
          await db.approvalQueueItem.create({
            data: { changeId: change.id, queueType: "STANDARD", priority: 1, status: "PENDING" },
          });
        });
      }

      sourcesChecked++;
    } catch (err: any) {
      failedSources++;
      console.error(`[ALO University Monitor] Source failed: ${source.sourceUrl} — ${err.message}`);
      await db.officialSource.update({
        where: { id: source.id },
        data: {
          consecutiveFailures: { increment: 1 },
          lastError: err.message,
          lastCheckedAt: new Date(),
          lastHttpStatus: 0,
        },
      });
      await db.monitoringLog.create({
        data: {
          runId,
          jobId: source.id,
          level: "ERROR",
          message: `Source check failed: ${source.sourceUrl} — ${err.message}`,
          entityType: source.entityType,
          entitySlug: source.universitySlug || source.courseSlug || source.countrySlug,
          sourceUrl: source.sourceUrl,
        },
      });
    }
  }

  // Update the run record
  await db.verificationRun.update({
    where: { id: runId },
    data: {
      status: failedSources > 0 && sourcesChecked > 0 ? "PARTIAL" : "COMPLETED",
      completedAt: new Date(),
      universitiesChecked: sources.filter((s) => s.entityType === "UNIVERSITY").length,
      sourcesChecked,
      changesDetected,
      failedSources,
      criticalChanges,
      aiReportSummary: `Monitoring cycle complete. ${sourcesChecked} sources checked, ${changesDetected} changes detected, ${failedSources} sources failed.`,
    },
  });

  console.log(`[ALO University Monitor] Run complete: ${sourcesChecked} checked, ${changesDetected} changes, ${failedSources} failed`);
}

async function pollOnce() {
  try {
    await ensureJobExists();
    const job = await db.monitoringJob.findUnique({ where: { jobId: "university-monitor-7d" } });
    if (!job) {
      console.error("[ALO University Monitor] Job not found after ensureJobExists — aborting poll");
      return;
    }
    if (!job.enabled) {
      console.log("[ALO University Monitor] Job disabled — skipping poll");
      return;
    }

    const now = new Date();
    const isDue = !job.nextRunAt || job.nextRunAt <= now;
    if (!isDue) {
      const minsUntil = Math.ceil((job.nextRunAt!.getTime() - now.getTime()) / 60000);
      if (minsUntil % 60 === 0 || minsUntil < 5) {
        console.log(`[ALO University Monitor] Next run in ${minsUntil} minutes (${job.nextRunAt!.toISOString()})`);
      }
      return;
    }

    // Try to acquire the lock
    const acquired = await tryAcquireLock(job);
    if (!acquired) {
      console.log(`[ALO University Monitor] Run is due but lock held by ${job.lockedBy} — skipping`);
      return;
    }

    console.log(`[ALO University Monitor] Lock acquired by ${INSTANCE_ID} — starting run`);

    // Create the run record
    const runId = `VR-${now.toISOString().slice(0, 10)}-${Date.now().toString(36).toUpperCase()}`;
    const run = await db.verificationRun.create({
      data: {
        jobId: job.id,
        runId,
        status: "RUNNING",
        startedAt: now,
      },
    });

    // Update job stats
    await db.monitoringJob.update({
      where: { id: job.id },
      data: {
        lastRunId: run.id,
        lastRunStartedAt: now,
        lastRunStatus: "RUNNING",
        totalRuns: { increment: 1 },
      },
    });

    await db.monitoringLog.create({
      data: {
        runId: run.id,
        jobId: job.id,
        level: "AUDIT",
        message: `Scheduled monitoring run started by ${INSTANCE_ID}`,
      },
    });

    // Run the cycle
    try {
      await runMonitoringCycle(run.id);

      // Schedule next run: now + 7 days, at 03:00 local
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 7);
      nextRun.setHours(3, 0, 0, 0);

      await db.monitoringJob.update({
        where: { id: job.id },
        data: {
          lastRunCompletedAt: new Date(),
          lastRunStatus: "COMPLETED",
          successfulRuns: { increment: 1 },
        },
      });

      await releaseLock(job.id, nextRun);
      console.log(`[ALO University Monitor] Run ${runId} complete — next run at ${nextRun.toISOString()}`);
    } catch (err: any) {
      console.error(`[ALO University Monitor] Run failed:`, err);
      await db.verificationRun.update({
        where: { id: run.id },
        data: { status: "FAILED", completedAt: new Date(), errorMessage: err.message },
      });
      await db.monitoringJob.update({
        where: { id: job.id },
        data: {
          lastRunCompletedAt: new Date(),
          lastRunStatus: "FAILED",
          failedRuns: { increment: 1 },
        },
      });
      // Schedule retry in 1 hour
      const retryAt = new Date(Date.now() + 60 * 60 * 1000);
      await releaseLock(job.id, retryAt);
    }
  } catch (err: any) {
    console.error(`[ALO University Monitor] Poll error:`, err);
  }
}

// Start polling
console.log("[ALO University Monitor] Starting poll loop");
pollOnce(); // run once on startup
setInterval(pollOnce, POLL_INTERVAL_MS);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("[ALO University Monitor] Shutting down...");
  await db.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("[ALO University Monitor] SIGTERM — shutting down...");
  await db.$disconnect();
  process.exit(0);
});

console.log("[ALO University Monitor] Scheduler running. Press Ctrl+C to stop.");
