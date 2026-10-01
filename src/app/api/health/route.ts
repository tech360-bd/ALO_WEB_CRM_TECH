import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Readiness: a running process without a working database must not receive traffic. */
export async function GET() {
  const startedAt = Date.now();
  let connected = false;
  try {
    await db.$queryRaw`SELECT 1`;
    connected = true;
  } catch {
    // Public health responses deliberately omit database exceptions/credentials.
    console.error('[readiness] Database probe failed');
  }
  return NextResponse.json({
    status: connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: { connected },
    responseTime_ms: Date.now() - startedAt,
  }, {
    status: connected ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
