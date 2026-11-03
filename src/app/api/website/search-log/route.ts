/**
 * Anonymous website search logging. Intentionally public (see
 * PUBLIC_API_WRITE_ROUTES in src/proxy.ts), but previously unbounded: any
 * caller could insert arbitrary rows with arbitrary string lengths. It now
 * rate-limits per client, whitelists and bounds every field, and never echoes
 * raw provider errors.
 */
import { db } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

const MAX_LEN = 120;
function bounded(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, MAX_LEN) : '';
}

export async function POST(request: Request) {
  const limited = rateLimitMiddleware(request, 'lead_create');
  if (limited) return limited;
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const searchLog = await db.searchLog.create({
      data: {
        countryId: typeof body.countryId === 'string' ? body.countryId.slice(0, MAX_LEN) : null,
        studyLevel: bounded(body.studyLevel),
        subject: bounded(body.subject),
        intake: bounded(body.intake),
        budget: bounded(body.budget),
        source: bounded(body.source) || 'homepage',
      },
    });
    return NextResponse.json({ success: true, searchLogId: searchLog.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[search-log] write failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Failed to log search' }, { status: 503 });
  }
}
