import { NextRequest, NextResponse } from 'next/server';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { describeCredential, verifyConnection } from '@/lib/seo/search-console-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/seo/search-console/status
 *
 * Answers two different questions that `/api/seo/health` deliberately does not:
 *
 *   - `configured` — is a credential present? (cheap, offline)
 *   - `verified`   — did Google actually answer, and can this credential see the
 *     ALO property? (a real API call)
 *
 * A deployment can be configured and still fail verification, most commonly
 * because the service account was never added as a user on the Search Console
 * property. Reporting only "configured" would leave that failure invisible, so
 * this route performs the real call and returns Google's own reason when it
 * fails. Nothing is fabricated: an unconfigured deployment reports
 * `NOT_CONFIGURED`, never an empty success.
 *
 * Never returns the private key, the client secret or an access token.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  // `?verify=false` skips the live call for a cheap configuration-only check.
  const wantLiveCheck = request.nextUrl.searchParams.get('verify') !== 'false';
  const credential = describeCredential();

  if (!credential.configured || !wantLiveCheck) {
    return NextResponse.json(
      {
        success: true,
        configured: credential.configured,
        verified: false,
        // `liveCheckPerformed` keeps the two states apart: a false `verified`
        // with no live check means "not tested", not "test failed".
        liveCheckPerformed: false,
        status: credential.mode === 'none' ? 'NOT_CONFIGURED' : 'CONFIGURED_NOT_VERIFIED',
        authMode: credential.mode,
        siteUrl: credential.siteUrl,
        serviceAccountEmail: credential.serviceAccountEmail ?? null,
        propertyAccessible: false,
        sites: [],
        reason: credential.note,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        costTier: 'FREE',
        billingAccountRequired: false,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const result = await verifyConnection();
  return NextResponse.json(
    {
      success: result.status === 'READY',
      configured: true,
      verified: result.status === 'READY' && result.propertyAccessible,
      liveCheckPerformed: true,
      status: result.status,
      authMode: credential.mode,
      siteUrl: result.siteUrl,
      serviceAccountEmail: credential.serviceAccountEmail ?? null,
      propertyAccessible: result.propertyAccessible,
      sites: result.sites,
      reason: result.reason,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      costTier: 'FREE',
      billingAccountRequired: false,
    },
    // Never cached: a stale "verified" would hide a revoked credential.
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
