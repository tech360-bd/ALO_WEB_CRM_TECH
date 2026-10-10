import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';

// No fabricated evidence or "completed" run until a real source-verification
// implementation, deduplication and durable logging have been validated.
export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;
  return NextResponse.json({ success: false, status: 'DISABLED', error: 'Official-source scanning is not implemented; no scan or data change performed.' }, { status: 503 });
}
