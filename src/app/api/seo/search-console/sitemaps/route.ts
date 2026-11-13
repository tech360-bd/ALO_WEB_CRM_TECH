import { NextRequest, NextResponse } from 'next/server';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { listSitemaps } from '@/lib/seo/search-console-client';
import { getGoogleStackConfig } from '@/lib/google/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/seo/search-console/sitemaps
 *
 * The sitemaps Google has actually received for the property, with the
 * submitted/indexed counts and any warnings or errors Google recorded.
 *
 * This is the answer to "is my sitemap working?" — a question `/api/seo/health`
 * can only answer as "the sitemap module is importable". Here the numbers come
 * from Google: `submitted` is what ALO offered, `indexed` is what Google
 * accepted, and the gap between them is the real indexing signal.
 *
 * Returns `status: NOT_CONFIGURED` when there is no credential, so an operator
 * never mistakes "not connected" for "no sitemap submitted".
 */
export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const config = getGoogleStackConfig();
  const result = await listSitemaps();

  if (result.status !== 'READY' || !result.data) {
    return NextResponse.json(
      {
        success: false,
        status: result.status,
        sitemaps: [],
        expectedSitemapUrl: `${config.siteUrl}/sitemap.xml`,
        reason: result.reason ?? 'Search Console sitemap data unavailable.',
        googleErrorReason: result.googleErrorReason ?? null,
        liveProviderVerified: false,
      },
      { status: result.status === 'NOT_CONFIGURED' ? 200 : 502, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const totals = result.data.reduce(
    (accumulator, sitemap) => {
      for (const content of sitemap.contents ?? []) {
        accumulator.submitted += content.submitted ?? 0;
        accumulator.indexed += content.indexed ?? 0;
      }
      accumulator.warnings += sitemap.warnings ?? 0;
      accumulator.errors += sitemap.errors ?? 0;
      return accumulator;
    },
    { submitted: 0, indexed: 0, warnings: 0, errors: 0 },
  );

  return NextResponse.json(
    {
      success: true,
      status: 'READY',
      sitemaps: result.data,
      totals,
      expectedSitemapUrl: `${config.siteUrl}/sitemap.xml`,
      // True when ALO's own sitemap is among the ones Google has received.
      expectedSitemapSubmitted: result.data.some((sitemap) => sitemap.path.includes('/sitemap.xml')),
      fetchedAt: result.fetchedAt,
      liveProviderVerified: true,
      note: 'Submitted/indexed counts are reported by Google. A gap between them is normal — Google chooses what to index and does not explain every exclusion.',
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
}
