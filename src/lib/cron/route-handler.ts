/**
 * HTTP adapter for scheduled jobs — ALO Education
 *
 * Every `/api/cron/*` route funnels through here so that:
 *   • authorization is identical everywhere (`requireCron`: cron secret or an
 *     authenticated SUPER_ADMIN/ADMIN session, constant-time comparison);
 *   • a job that already holds a lease answers 423 instead of running twice;
 *   • a job that cannot run (external dependency / superseded) answers 501 and
 *     never a fake 200;
 *   • the response shape is the same whether the job was triggered by Vercel,
 *     cPanel curl, the worker, or an admin clicking "run now".
 */

import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { db } from '@/lib/db';
import { createCronRunnerDeps, runCronJob, type CronJobRunResult } from './job-runner';
import { getRegisteredJob, registeredJobSegments, toRuntimeJob } from './job-registry';

export function cronHttpStatus(result: CronJobRunResult): number {
  switch (result.status) {
    case 'ran':
      return 200;
    case 'skipped_locked':
      return 423; // Locked: another runner holds the lease
    case 'blocked':
      return 501; // Not implemented here, and the reason is in the body
    default:
      return 500; // failed — the error is in the body and in CronJobLog
  }
}

export function cronPayload(result: CronJobRunResult): Record<string, unknown> {
  return {
    success: result.status === 'ran',
    job: result.jobKey,
    status: result.status,
    durationMs: result.durationMs,
    runId: result.runId,
    lockStatus: result.lockStatus,
    ...(result.result !== undefined ? { result: result.result } : {}),
    ...(result.error ? { error: result.error } : {}),
    ...(result.blockedReason ? { reason: result.blockedReason } : {}),
  };
}

/** Authorize, resolve and run one registered job. Never throws. */
export async function handleAuthorizedCronRequest(
  _req: Request,
  jobSegment: string,
): Promise<NextResponse> {
  const entry = getRegisteredJob(jobSegment);
  if (!entry) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unknown scheduled job',
        job: jobSegment,
        availableJobs: registeredJobSegments(),
      },
      { status: 404 },
    );
  }

  const result = await runCronJob(toRuntimeJob(entry), createCronRunnerDeps(db));
  return NextResponse.json(cronPayload(result), {
    status: cronHttpStatus(result),
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

/** Authorize then run. Returns 401/403 from `requireCron` when not allowed. */
export async function handleCronRequest(req: Request, jobSegment: string): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, jobSegment);
}
