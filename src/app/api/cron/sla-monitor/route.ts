import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { handleAuthorizedCronRequest } from '@/lib/cron/route-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Legacy path kept so existing schedulers keep working.
 *
 * It now delegates to the certified job runner (registry key `sla-monitoring`), so this
 * endpoint is lease-protected and records a start/finish row in CronJobLog
 * exactly like `/api/cron/sla-monitoring`. The previous bespoke body was removed: it
 * held no lock, so a scheduler trigger and the worker could process the same
 * queue concurrently.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'sla-monitoring');
}

export async function POST(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'sla-monitoring');
}
