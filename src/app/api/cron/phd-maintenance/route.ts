import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { handleAuthorizedCronRequest } from '@/lib/cron/route-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PhD workspace maintenance (registry key `phd-maintenance`).
 *
 * Authorised by `requireCron` (cron secret or an authenticated administrator) and
 * executed through the certified runner, so the job holds a lease and writes a
 * CronJobLog row. The handler creates in-app deadline reminders only; evidence
 * due for re-verification and documents past retention are reported, never
 * changed or deleted by the scheduler.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'phd-maintenance');
}

export async function POST(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'phd-maintenance');
}
