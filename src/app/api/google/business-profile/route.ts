import { NextRequest, NextResponse } from 'next/server';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import {
  listAccounts,
  listLocations,
  listReviews,
  verifyBusinessProfileConnection,
} from '@/lib/google/business-profile';
import { getGoogleStackConfig } from '@/lib/google/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/google/business-profile
 *
 * Reads ALO's own Google Business Profile back out of Google.
 *
 * Query parameters:
 *   accountId — optional; defaults to GOOGLE_BUSINESS_ACCOUNT_ID, then to the
 *               first account the credential can see.
 *   reviews   — `locations/<locationId>` to also fetch that location's reviews.
 *               Note that Google restricts the reviews API to accounts with 10+
 *               locations, so a 403 is the expected outcome for a single-office
 *               account and is reported as NO_ACCESS, not as an empty list.
 *   verify    — `true` to run the connection self-test instead of a data read.
 *
 * Read-only. Nothing here creates or edits a Business Profile location: the
 * specification forbids inventing locations for SEO, and a write path would make
 * that possible.
 *
 * Unconfigured deployments receive `status: NOT_CONFIGURED` with empty arrays —
 * never a fabricated location list.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const config = getGoogleStackConfig();
  const params = request.nextUrl.searchParams;
  const accountId = params.get('accountId')?.trim() || undefined;
  const reviewsFor = params.get('reviews')?.trim() || '';

  if (params.get('verify') === 'true') {
    const verification = await verifyBusinessProfileConnection();
    return NextResponse.json(
      {
        success: verification.status === 'READY',
        ...verification,
        costTier: 'FREE',
        billingAccountRequired: false,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const [accounts, locations] = await Promise.all([listAccounts(), listLocations(accountId)]);

  if (locations.status !== 'READY' || !locations.data) {
    return NextResponse.json(
      {
        success: false,
        status: locations.status,
        configuredAccountId: config.businessProfile.accountId || null,
        accounts: accounts.data ?? [],
        locations: [],
        reviews: [],
        reason: locations.reason ?? 'Business Profile locations unavailable.',
        googleErrorReason: locations.googleErrorReason ?? null,
        liveProviderVerified: false,
        costTier: 'FREE',
        billingAccountRequired: false,
      },
      { status: locations.status === 'NOT_CONFIGURED' ? 200 : 502, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  let reviews: unknown[] = [];
  let reviewsStatus: string | null = null;
  let reviewsReason: string | null = null;
  if (reviewsFor) {
    const result = await listReviews(reviewsFor);
    reviewsStatus = result.status;
    reviewsReason = result.reason ?? null;
    reviews = result.data ?? [];
  }

  return NextResponse.json(
    {
      success: true,
      status: 'READY',
      configuredAccountId: config.businessProfile.accountId || null,
      accounts: accounts.data ?? [],
      locations: locations.data,
      reviews,
      ...(reviewsStatus ? { reviewsStatus, reviewsReason } : {}),
      fetchedAt: locations.fetchedAt,
      liveProviderVerified: true,
      costTier: 'FREE',
      billingAccountRequired: false,
      // Real locations only. These values come from Google, not from a seed file
      // or a hard-coded address, so they cannot drift from the actual listing.
      note: 'Read-only view of the live Business Profile listing. Editing a location must be done in Google Business Profile itself.',
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
}
