import { NextResponse } from 'next/server';
import { requireCron } from '@/lib/cron-auth';

// Quarantined: the previous handler manufactured tuition changes without
// fetching official sources. Retain the route and authorization, never write
// fabricated evidence or claim a completed scan. No historical rows changed.
export async function POST(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;
  return NextResponse.json({
    success: false, status: 'DISABLED',
    error: 'Official-source change detection is not implemented; no scan or data change performed.',
  }, { status: 503 });
}
