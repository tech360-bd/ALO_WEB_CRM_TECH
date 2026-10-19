import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { buildConversionFunnel, type FunnelGroupBy } from '@/lib/analytics/conversion-funnel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/conversion-funnel
 *
 * The business conversion report: acquisition channel → lead → qualified lead →
 * application → enrolment, grouped by whichever attribution dimension the
 * caller asks for.
 *
 *   ?groupBy=channel|source|medium|campaign|landingPage|firstTouchSource
 *   ?days=1-365            (default 90)
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   (overrides ?days)
 *   ?country=United Kingdom
 *   ?limit=1-500           (default 100, ordered by lead volume)
 *
 * Authenticated to marketing staff and admins only: this exposes campaign
 * performance, which is commercially sensitive, and it is aggregated so no
 * individual lead or student is identifiable in the response.
 *
 * Rate limited because each call scans the lead table.
 */

const GROUPS: FunnelGroupBy[] = ['channel', 'source', 'medium', 'campaign', 'landingPage', 'firstTouchSource'];

const querySchema = z.object({
  groupBy: z
    .string()
    .optional()
    .transform((value): FunnelGroupBy =>
      value && (GROUPS as string[]).includes(value) ? (value as FunnelGroupBy) : 'channel',
    ),
  days: z.coerce.number().int().min(1).max(365).default(90),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
    .optional(),
  country: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid query. groupBy must be one of ' + GROUPS.join(', ') + '; dates must be YYYY-MM-DD; days 1-365; limit 1-500.',
      },
      { status: 400 },
    );
  }
  const { groupBy, days, from, to, country, limit } = parsed.data;

  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : new Date(toDate.getTime() - (days - 1) * 86_400_000);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ success: false, error: 'Unparseable date range.' }, { status: 400 });
  }
  if (fromDate > toDate) {
    return NextResponse.json({ success: false, error: '`from` must not be after `to`.' }, { status: 400 });
  }

  try {
    const funnel = await buildConversionFunnel(db, {
      from: fromDate,
      to: toDate,
      groupBy,
      limit,
      ...(country ? { country } : {}),
    });
    return NextResponse.json(
      { success: true, ...funnel },
      // Aggregated marketing data changes slowly; a short private cache keeps a
      // dashboard refresh loop off the lead table.
      { headers: { 'Cache-Control': 'private, max-age=120' } },
    );
  } catch (error) {
    // Never echo a driver message: it can contain a connection string.
    console.error('[analytics/conversion-funnel] failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'Conversion funnel could not be computed. Lead data may be unavailable.' },
      { status: 503 },
    );
  }
}
