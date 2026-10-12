import { NextResponse } from 'next/server';
import { getPublicMetrics } from '@/lib/verified-metrics';

export const dynamic = 'force-dynamic';

/**
 * Public verified-metrics endpoint (master specification Part 13).
 * Returns the centralized, governed metrics payload. No secrets, no
 * internal identifiers — only metric values with source + status.
 */
export async function GET() {
  try {
    const payload = await getPublicMetrics();
    return NextResponse.json(
      { success: true, status: 200, data: payload, timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('[api/metrics] failed:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, status: 503, message: 'Metrics temporarily unavailable', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
