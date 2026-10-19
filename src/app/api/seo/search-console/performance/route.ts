import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { querySearchAnalytics, type SearchConsolePerformanceRow } from '@/lib/seo/search-console-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/seo/search-console/performance
 *
 * Live Search Analytics data straight from Google: clicks, impressions, CTR and
 * average position, grouped by query, page, country, device or date.
 *
 * Query parameters:
 *   days        — lookback window, 1–90 (default 28). Search Console itself
 *                 only retains ~16 months and has a 2–3 day reporting delay, so
 *                 the window ends 3 days ago rather than today. A "last 7 days"
 *                 query ending today would otherwise return an incomplete week
 *                 and look like a traffic collapse.
 *   dimensions  — comma-separated subset of query,page,country,device,date
 *   rowLimit    — 1–25000 (default 250)
 *   pageContains — restrict to URLs containing a path, e.g. /destinations/uk
 *
 * When Search Console is not configured this returns `status: NOT_CONFIGURED`
 * with `rows: []` and never a 200 that looks like real zero traffic.
 */

const DIMENSIONS = ['query', 'page', 'country', 'device', 'date'] as const;
type Dimension = (typeof DIMENSIONS)[number];

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(28),
  dimensions: z
    .string()
    .optional()
    .transform((value): Dimension[] => {
      const requested = (value ?? 'query').split(',').map((part) => part.trim()).filter(Boolean);
      const valid = requested.filter((part): part is Dimension =>
        (DIMENSIONS as readonly string[]).includes(part),
      );
      return valid.length > 0 ? valid : ['query'];
    }),
  rowLimit: z.coerce.number().int().min(1).max(25000).default(250),
  pageContains: z.string().trim().max(191).optional(),
});

function isoDate(offsetDaysFromToday: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - offsetDaysFromToday);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query. days must be 1-90, rowLimit 1-25000, dimensions a subset of query,page,country,device,date.' },
      { status: 400 },
    );
  }

  const { days, dimensions, rowLimit, pageContains } = parsed.data;
  // Search Console's data has a 2–3 day processing delay. Ending the window
  // today would silently truncate the most recent days.
  const endDate = isoDate(3);
  const startDate = isoDate(3 + days - 1);

  const result = await querySearchAnalytics({
    startDate,
    endDate,
    dimensions,
    rowLimit,
    ...(pageContains ? { pageContains } : {}),
  });

  if (result.status !== 'READY' || !result.data) {
    return NextResponse.json(
      {
        success: false,
        status: result.status,
        // An explicit empty array plus a non-READY status. A dashboard must
        // render "not connected" here, never a flat zero-traffic chart.
        rows: [] as SearchConsolePerformanceRow[],
        totals: null,
        window: { startDate, endDate, days },
        dimensions,
        reason: result.reason ?? 'Search Console data unavailable.',
        googleErrorReason: result.googleErrorReason ?? null,
        liveProviderVerified: false,
      },
      { status: result.status === 'NOT_CONFIGURED' ? 200 : 502, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  return NextResponse.json(
    {
      success: true,
      status: 'READY',
      rows: result.data.rows,
      totals: result.data.totals,
      window: { startDate, endDate, days },
      dimensions,
      rowLimit,
      fetchedAt: result.fetchedAt,
      liveProviderVerified: true,
      // Search Console reports clicks and impressions only. It is not a
      // rankings API and does not return a rank for an arbitrary keyword.
      note: 'Live Search Console data. Position is the average impression-weighted rank Google reported, not a tracked position for a keyword.',
    },
    // Short private cache: the underlying data changes at most daily, and
    // repeated dashboard refreshes should not burn Search Console quota.
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
}
