import { NextRequest, NextResponse } from 'next/server';
import { requireSeoStaff } from '@/lib/seo/request-access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import {
  GOOGLE_SERVICE_COSTS,
  getGoogleStackConfig,
  resolveTagLoader,
  type GoogleServiceId,
} from '@/lib/google/config';
import { describeCredential, verifyConnection } from '@/lib/seo/search-console-client';
import { describeGoogleCredential } from '@/lib/google/oauth';
import { verifyBusinessProfileConnection } from '@/lib/google/business-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/google/status
 *
 * The single honest answer to "what Google integrations does ALO actually have
 * working?" — one call covering GA4, GTM, Search Console, Business Profile,
 * YouTube, Maps and Cloud.
 *
 * Each service reports:
 *   `configured`       — is a credential / identifier present?
 *   `costTier`         — FREE, FREE_TIER or PAID (the free-first mandate)
 *   `billingRequired`  — does Google need a billing account for this?
 *   `liveVerified`     — did Google actually answer a real API call?
 *   `status`           — PASS / PARTIAL / NOT_CONFIGURED / NOT_VERIFIED / BLOCKED
 *   `reason`           — why, in words an operator can act on
 *
 * `configured` and `liveVerified` are kept separate on purpose. A deployment can
 * hold a valid-looking Search Console credential that Google rejects because the
 * service account was never added to the property; reporting only "configured"
 * would hide that. Conversely a live check costs quota, so `?live=false` (the
 * default for repeated polling) reports configuration only and says so.
 *
 * Never returns a secret value. Identifiers that Google itself ships to every
 * browser (Measurement ID, Container ID) are returned because hiding them would
 * not hide anything.
 */

export type GoogleStatusVerdict = 'PASS' | 'PARTIAL' | 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'BLOCKED';

export async function GET(request: NextRequest) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limited: with ?live=true each call makes several outbound requests to
  // Google, and quota is shared across the whole property.
  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const config = getGoogleStackConfig();
  const loader = resolveTagLoader(config);
  const wantLive = request.nextUrl.searchParams.get('live') === 'true';

  const credential = describeGoogleCredential();
  const searchConsoleCredential = describeCredential();

  // Live checks are only meaningful when a credential exists at all.
  const searchConsoleLive =
    wantLive && searchConsoleCredential.configured ? await verifyConnection() : null;
  const businessProfileLive =
    wantLive && config.businessProfile.accountId && credential.configured
      ? await verifyBusinessProfileConnection()
      : null;

  const services: Record<string, {
    configured: boolean;
    costTier: (typeof GOOGLE_SERVICE_COSTS)[GoogleServiceId]['tier'];
    billingRequired: boolean;
    optional: boolean;
    liveVerified: boolean | null;
    status: GoogleStatusVerdict;
    reason: string;
    detail?: Record<string, unknown>;
  }> = {
    GA4: {
      configured: config.ga4.enabled,
      costTier: GOOGLE_SERVICE_COSTS.GA4.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.GA4.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.GA4.optional,
      // Whether the browser actually received a hit is not observable from the
      // server; only DebugView in the GA4 UI can confirm it. Claiming otherwise
      // would be a fabricated PASS.
      liveVerified: null,
      status: config.ga4.injectTags ? 'PARTIAL' : config.ga4.enabled ? 'NOT_VERIFIED' : 'NOT_CONFIGURED',
      reason: config.ga4.reason,
      detail: {
        measurementId: config.ga4.measurementId || null,
        measurementProtocolConfigured: config.ga4.apiSecretConfigured,
        tagLoader: loader.loader,
        loaderId: loader.id || null,
        loaderReason: loader.reason,
        consentMode: config.consentMode,
      },
    },
    GTM: {
      configured: config.gtm.enabled,
      costTier: GOOGLE_SERVICE_COSTS.GTM.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.GTM.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.GTM.optional,
      liveVerified: null,
      status: config.gtm.injectTags ? 'PARTIAL' : config.gtm.enabled ? 'NOT_VERIFIED' : 'NOT_CONFIGURED',
      reason: config.gtm.reason,
      detail: { containerId: config.gtm.containerId || null },
    },
    SEARCH_CONSOLE: {
      configured: searchConsoleCredential.configured,
      costTier: GOOGLE_SERVICE_COSTS.SEARCH_CONSOLE.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.SEARCH_CONSOLE.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.SEARCH_CONSOLE.optional,
      liveVerified: searchConsoleLive ? searchConsoleLive.propertyAccessible : null,
      status: searchConsoleLive
        ? searchConsoleLive.status === 'READY' && searchConsoleLive.propertyAccessible
          ? 'PASS'
          : searchConsoleLive.status === 'NOT_CONFIGURED'
            ? 'NOT_CONFIGURED'
            : 'BLOCKED'
        : searchConsoleCredential.configured
          ? 'NOT_VERIFIED'
          : 'NOT_CONFIGURED',
      reason: searchConsoleLive ? searchConsoleLive.reason : searchConsoleCredential.note,
      detail: {
        siteUrl: config.searchConsole.siteUrl,
        authMode: searchConsoleCredential.mode,
        serviceAccountEmail: searchConsoleCredential.serviceAccountEmail ?? null,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        ...(searchConsoleLive ? { sitesVisible: searchConsoleLive.sites.length } : {}),
      },
    },
    BUSINESS_PROFILE: {
      configured: config.businessProfile.configured,
      costTier: GOOGLE_SERVICE_COSTS.BUSINESS_PROFILE.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.BUSINESS_PROFILE.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.BUSINESS_PROFILE.optional,
      liveVerified: businessProfileLive ? businessProfileLive.status === 'READY' : null,
      status: businessProfileLive
        ? businessProfileLive.status === 'READY'
          ? 'PASS'
          : businessProfileLive.status === 'NOT_CONFIGURED'
            ? 'NOT_CONFIGURED'
            : 'BLOCKED'
        : config.businessProfile.configured
          ? 'NOT_VERIFIED'
          : 'NOT_CONFIGURED',
      reason: businessProfileLive ? businessProfileLive.reason : config.businessProfile.reason,
      detail: {
        accountId: config.businessProfile.accountId || null,
        inboundWebhook: 'POST /api/marketing/webhooks/google-business (token-verified, fails closed in production)',
        ...(businessProfileLive ? { locationsReadable: businessProfileLive.locationCount } : {}),
      },
    },
    YOUTUBE: {
      configured: config.youtube.configured,
      costTier: GOOGLE_SERVICE_COSTS.YOUTUBE.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.YOUTUBE.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.YOUTUBE.optional,
      liveVerified: null,
      // Embedding works with no credential at all, so a configured channel is a
      // PARTIAL (channel links resolve) and an unconfigured channel is still
      // usable for per-video embeds.
      status: config.youtube.dataApiConfigured ? 'PARTIAL' : config.youtube.configured ? 'PARTIAL' : 'NOT_CONFIGURED',
      reason: config.youtube.reason,
      detail: {
        channelHandle: config.youtube.channelHandle || null,
        channelId: config.youtube.channelId || null,
        dataApiConfigured: config.youtube.dataApiConfigured,
        embeddingAvailable: true,
        publishingAvailable: config.youtube.dataApiConfigured,
      },
    },
    MAPS: {
      configured: config.maps.configured,
      costTier: GOOGLE_SERVICE_COSTS.MAPS.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.MAPS.billingAccountRequired,
      optional: GOOGLE_SERVICE_COSTS.MAPS.optional,
      liveVerified: null,
      // NOT_CONFIGURED is the intended state. Maps Platform needs a Cloud
      // billing account, and ALO's real need — showing office and university
      // locations — is met by zero-cost deep links.
      status: config.maps.configured ? 'NOT_VERIFIED' : 'NOT_CONFIGURED',
      reason: config.maps.reason,
      detail: {
        deepLinksInUse: ['src/app/global-offices/page.tsx', 'src/components/website/PublicFooter.tsx'],
        activationRequires: 'Cloud billing account + HTTP-referrer-restricted and API-restricted key',
      },
    },
    CLOUD: {
      configured: config.cloud.configured,
      costTier: GOOGLE_SERVICE_COSTS.CLOUD_RUN.tier,
      billingRequired: GOOGLE_SERVICE_COSTS.CLOUD_RUN.billingAccountRequired,
      optional: true,
      liveVerified: null,
      status: config.cloud.configured ? 'NOT_VERIFIED' : 'NOT_CONFIGURED',
      reason: config.cloud.reason,
      detail: {
        projectId: config.cloud.projectId || null,
        // ALO's own scheduler already covers what Cloud Scheduler would do.
        cronJobsRunLocally: true,
      },
    },
  };

  return NextResponse.json(
    {
      success: true,
      environment: config.environment,
      siteUrl: config.siteUrl,
      liveChecksPerformed: Boolean(searchConsoleLive || businessProfileLive),
      tagLoader: { loader: loader.loader, id: loader.id || null, reason: loader.reason },
      credential: {
        mode: credential.mode,
        configured: credential.configured,
        serviceAccountEmail: credential.serviceAccountEmail ?? null,
      },
      siteVerificationTokenConfigured: config.siteVerificationToken !== '',
      services,
      costSummary: {
        free: Object.entries(services).filter(([, value]) => value.costTier === 'FREE').map(([key]) => key),
        freeTier: Object.entries(services).filter(([, value]) => value.costTier === 'FREE_TIER').map(([key]) => key),
        paid: Object.entries(services).filter(([, value]) => value.costTier === 'PAID').map(([key]) => key),
        // The free-first mandate in one number: nothing ALO actually runs costs
        // money, and the two services that would (Maps, Cloud) are unused.
        paidServicesInUse: Object.entries(services)
          .filter(([, value]) => value.costTier === 'PAID' && value.configured)
          .map(([key]) => key),
      },
      // Honest scope statement rather than an implied guarantee.
      note: 'configured means a credential or identifier is present. liveVerified means Google answered a real API call. GA4 and GTM cannot be live-verified from the server — confirm those in GA4 DebugView and the GTM preview console.',
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
