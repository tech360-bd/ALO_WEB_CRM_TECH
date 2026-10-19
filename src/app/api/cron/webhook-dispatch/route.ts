import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';
import { handleAuthorizedCronRequest } from '@/lib/cron/route-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Outbound webhook dispatch (spec s77).
 *
 * Delegates to the certified job runner (registry key `webhook-dispatch`), so
 * the endpoint is lease-protected and records a start/finish row in
 * CronJobLog. The handler reports NOT_CONFIGURED when no active subscription
 * exists instead of pretending deliveries succeeded (spec s94).
 *
 * Guarded by `requireCron`: an unauthenticated caller must never be able to
 * trigger outbound HTTP fan-out to third-party endpoints.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'webhook-dispatch');
}

export async function POST(req: Request): Promise<NextResponse> {
  const denied = await requireCron(req);
  if (denied) return denied;
  return handleAuthorizedCronRequest(req, 'webhook-dispatch');
}
