import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { handleAuthorizedCronRequest } from '@/lib/cron/route-handler';
import { listRegisteredJobs } from '@/lib/cron/job-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Scheduler dispatcher for `/api/cron/<job>`.
 *
 * `vercel.json` and `src/cron/cron-definitions.ts` declare the scheduled paths.
 * Before this route existed, 14 of the 15 declared paths had no file on disk and
 * therefore returned 404 while the deployment believed they were scheduled.
 *
 * Resolution and the HTTP contract live in `@/lib/cron/route-handler`, which
 * this route shares with the legacy per-job endpoints, so every entry point
 * behaves identically:
 *   200 ran · 423 another runner holds the lease · 501 blocked (reason given)
 *   · 500 failed (recorded in CronJobLog) · 404 unknown job.
 *
 * Existing static routes (`/api/cron/health`, `/api/cron/university-monitoring`
 * and the weekly jobs) take precedence over this dynamic segment and are
 * untouched by it.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ job: string }> },
): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  const params = await context.params;
  return handleAuthorizedCronRequest(req, params?.job ?? '');
}

/** POST is accepted so an operator or the admin UI can trigger the same job. */
export async function POST(
  req: Request,
  context: { params: Promise<{ job: string }> },
): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  const params = await context.params;
  return handleAuthorizedCronRequest(req, params?.job ?? '');
}

/** Catalogue endpoint for tooling; same authorization as running a job. */
export async function OPTIONS(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return NextResponse.json(
    { success: true, jobs: listRegisteredJobs() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
