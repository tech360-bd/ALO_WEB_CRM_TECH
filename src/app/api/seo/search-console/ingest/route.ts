import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { querySearchAnalytics } from '@/lib/seo/search-console-client';
import { analyzeSearchConsoleData } from '@/lib/seo-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/seo/search-console/ingest
 *
 * Pulls live Search Console performance data and runs it through the EXISTING
 * opportunity engine (`analyzeSearchConsoleData` in src/lib/seo-engine.ts),
 * which writes real `SeoOpportunity` rows and is the same engine the manual
 * `/api/seo/opportunities` endpoint already uses.
 *
 * This closes the loop that was previously open: ALO had an analyser and an
 * admin panel that asked a human to paste Search Console JSON into a textarea.
 * The analysis logic is reused unchanged — only the data source is now Google
 * instead of a clipboard.
 *
 * Behaviour when unconfigured: returns `status: NOT_CONFIGURED` and creates
 * nothing. It never falls back to sample data, because a fabricated opportunity
 * list would be acted on by a real marketing team.
 *
 * Rate limited: each call spends Search Console quota, which is shared across
 * the whole property and is not something an admin refresh loop should exhaust.
 */

const bodySchema = z
  .object({
    days: z.number().int().min(1).max(90).default(28),
    /** Group by query (find content gaps) or page (find underperforming URLs). */
    dimension: z.enum(['query', 'page']).default('query'),
    rowLimit: z.number().int().min(1).max(5000).default(500),
    pageContains: z.string().trim().max(191).optional(),
  })
  .strict();

function isoDate(offsetDaysFromToday: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - offsetDaysFromToday);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid body. Accepts { days?: 1-90, dimension?: "query"|"page", rowLimit?: 1-5000, pageContains?: string }.' },
      { status: 400 },
    );
  }
  const { days, dimension, rowLimit, pageContains } = parsed.data;

  // Search Console data lags 2–3 days, so the window ends there rather than
  // today; otherwise the most recent days are silently incomplete.
  const endDate = isoDate(3);
  const startDate = isoDate(3 + days - 1);

  const result = await querySearchAnalytics(
    { startDate, endDate, dimensions: [dimension], rowLimit, ...(pageContains ? { pageContains } : {}) },
  );

  if (result.status !== 'READY' || !result.data) {
    return NextResponse.json(
      {
        success: false,
        status: result.status,
        opportunitiesCreated: 0,
        skipped: 0,
        rowsFetched: 0,
        window: { startDate, endDate, days },
        reason: result.reason ?? 'Search Console data unavailable.',
        googleErrorReason: result.googleErrorReason ?? null,
        // Explicit: nothing was written, and nothing was invented instead.
        liveProviderVerified: false,
      },
      { status: result.status === 'NOT_CONFIGURED' ? 200 : 502 },
    );
  }

  const rows = result.data.rows;
  if (rows.length === 0) {
    // A genuine empty result: the property exists and answered, but there is no
    // data for this window. Distinct from NOT_CONFIGURED and reported as such.
    return NextResponse.json({
      success: true,
      status: 'READY',
      opportunitiesCreated: 0,
      skipped: 0,
      rowsFetched: 0,
      totals: result.data.totals,
      window: { startDate, endDate, days },
      liveProviderVerified: true,
      reason: `Search Console returned no rows for ${dimension} between ${startDate} and ${endDate}. No opportunities were created and none were invented.`,
    });
  }

  try {
    // Feed the live rows into the existing analyser. It already validates its
    // input shape and de-duplicates opportunities, so nothing is reimplemented.
    const analysis = await analyzeSearchConsoleData(
      rows.map((row) => ({
        url: row.url ?? null,
        query: row.query ?? null,
        impressions: row.impressions,
        clicks: row.clicks,
        position: row.position,
      })),
    );
    return NextResponse.json({
      ...analysis,
      success: true,
      status: 'READY',
      rowsFetched: rows.length,
      totals: result.data.totals,
      window: { startDate, endDate, days },
      dimension,
      fetchedAt: result.fetchedAt,
      liveProviderVerified: true,
      provenance: 'Live Search Console Search Analytics data, analysed by the existing ALO opportunity engine.',
    });
  } catch (error) {
    console.error('[seo/search-console/ingest] analysis failed', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, status: 'API_ERROR', error: 'Search Console data was fetched but could not be analysed. No opportunities were written.' },
      { status: 503 },
    );
  }
}
