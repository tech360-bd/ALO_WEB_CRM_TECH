import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Liveness only; use /api/health for readiness and deployment acceptance. */
export async function GET() {
  return NextResponse.json({ status: 'alive' }, { headers: { 'Cache-Control': 'no-store' } });
}
