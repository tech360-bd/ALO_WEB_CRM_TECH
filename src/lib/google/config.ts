/**
 * Google Free Stack — single configuration source of truth.
 *
 * Every Google service ALO Education touches is described here once: which
 * environment variables configure it, whether it costs money, and whether it is
 * currently configured. Consumers (tag injection, API clients, admin surfaces,
 * the health probe) must read from this module instead of touching
 * `process.env` directly, so that:
 *
 *   1. an unconfigured service can only ever report `NOT CONFIGURED` — never a
 *      fabricated success;
 *   2. analytics cannot silently mix development/staging traffic into the
 *      production GA4 property;
 *   3. the FREE / FREE TIER / PAID classification required by the free-first
 *      mandate is machine-readable, not just prose in a document.
 *
 * No secret value is ever returned by this module. Only presence, shape and
 * non-sensitive public identifiers (measurement IDs, container IDs, channel
 * handles) cross the boundary — those are, by Google's own design, shipped to
 * every visitor's browser.
 */

/** Deployment environment the analytics layer is running in. */
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Cost classification mandated by the free-first rule.
 *
 * - `FREE`      — usable with no billing account at all.
 * - `FREE_TIER` — no charge within quota, but a billing account must exist.
 * - `PAID`      — usage is billed; a billing account is a hard prerequisite.
 */
export type CostTier = 'FREE' | 'FREE_TIER' | 'PAID';

export interface CostClassification {
  tier: CostTier;
  /** True when Google requires a billing account to be attached before use. */
  billingAccountRequired: boolean;
  /** Human-readable statement of what is free and where the money starts. */
  costNote: string;
  /** True when ALO must never treat this service as a runtime dependency. */
  optional: boolean;
}

export const GOOGLE_SERVICE_IDS = [
  'GA4',
  'GTM',
  'MEASUREMENT_PROTOCOL',
  'SEARCH_CONSOLE',
  'BUSINESS_PROFILE',
  'YOUTUBE',
  'MAPS',
  'CLOUD_RUN',
  'CLOUD_SCHEDULER',
  'CLOUD_STORAGE',
  'PUBSUB',
  'SECRET_MANAGER',
] as const;

export type GoogleServiceId = (typeof GOOGLE_SERVICE_IDS)[number];

/**
 * Free-first classification table. This is the authoritative answer to
 * "does this cost money?" and is surfaced verbatim in the admin module and in
 * docs/GOOGLE-FREE-STACK.md.
 */
export const GOOGLE_SERVICE_COSTS: Record<GoogleServiceId, CostClassification> = {
  GA4: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote:
      'Standard GA4 properties are free with no billing account and no event-volume invoice. GA4 360 is a separate paid contract and is NOT used or required by ALO.',
    optional: false,
  },
  GTM: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote: 'Tag Manager web containers are free at any volume. No billing account.',
    optional: false,
  },
  MEASUREMENT_PROTOCOL: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote:
      'The GA4 Measurement Protocol (/mp/collect) is free. It needs only the property Measurement ID plus a stream API secret.',
    optional: false,
  },
  SEARCH_CONSOLE: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote:
      'Search Console and the Search Console API are free with no billing account. Daily query quota applies but is far above ALO usage.',
    optional: false,
  },
  BUSINESS_PROFILE: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote:
      'Google Business Profile and its API are free with no billing account. Requires a verified real location.',
    optional: false,
  },
  YOUTUBE: {
    tier: 'FREE',
    billingAccountRequired: false,
    costNote:
      'Publishing and privacy-enhanced embedding are free. The YouTube Data API v3 is free within a 10,000-unit/day default quota and needs no billing account.',
    optional: false,
  },
  MAPS: {
    tier: 'PAID',
    billingAccountRequired: true,
    costNote:
      'Maps Platform requires a Cloud billing account. There is no billing-free tier any more; usage is billed per request after any promotional credit. ALO therefore uses zero-cost "Open in Google Maps" deep links instead and treats Maps as NOT REQUIRED.',
    optional: true,
  },
  CLOUD_RUN: {
    tier: 'FREE_TIER',
    billingAccountRequired: true,
    costNote:
      'Free monthly allowances exist, but a billing account must be attached to the project. ALO keeps the website and CRM on the existing VPS and does not use Cloud Run.',
    optional: true,
  },
  CLOUD_SCHEDULER: {
    tier: 'FREE_TIER',
    billingAccountRequired: true,
    costNote:
      'First 3 jobs free per month, then billed per job. Requires a billing account. ALO already runs 22 cron jobs on its own infrastructure via src/cron/cron-definitions.ts.',
    optional: true,
  },
  CLOUD_STORAGE: {
    tier: 'FREE_TIER',
    billingAccountRequired: true,
    costNote:
      '5 GB-month free in the US multi-region, but a billing account must exist. ALO stores documents on its own infrastructure.',
    optional: true,
  },
  PUBSUB: {
    tier: 'FREE_TIER',
    billingAccountRequired: true,
    costNote:
      'First 10 GiB free per month, then billed. Requires a billing account. Only relevant if Google pushes Business Profile notifications.',
    optional: true,
  },
  SECRET_MANAGER: {
    tier: 'FREE_TIER',
    billingAccountRequired: true,
    costNote:
      'Free allowance per secret version, but a billing account must be attached. ALO uses server environment variables / its own secret store instead.',
    optional: true,
  },
};

/** Shape of the resolved Google stack configuration. No secret values. */
export interface GoogleStackConfig {
  environment: DeploymentEnvironment;
  /** Public site origin, no trailing slash. */
  siteUrl: string;
  ga4: {
    measurementId: string;
    enabled: boolean;
    /** True when the Measurement Protocol API secret is present. Presence only. */
    apiSecretConfigured: boolean;
    /**
     * True only when tags may actually be injected in this environment. GA4 is
     * production-gated so that development and preview traffic can never be
     * written into the production property.
     */
    injectTags: boolean;
    reason: string;
  };
  gtm: {
    containerId: string;
    enabled: boolean;
    injectTags: boolean;
    reason: string;
  };
  consentMode: boolean;
  searchConsole: {
    siteUrl: string;
    configured: boolean;
    authMode: 'none' | 'service_account' | 'oauth_refresh_token';
    reason: string;
  };
  businessProfile: {
    accountId: string;
    configured: boolean;
    reason: string;
  };
  youtube: {
    channelHandle: string;
    channelId: string;
    configured: boolean;
    /** True only when a Data API credential exists — embedding needs none. */
    dataApiConfigured: boolean;
    reason: string;
  };
  maps: {
    configured: boolean;
    reason: string;
  };
  cloud: {
    projectId: string;
    configured: boolean;
    reason: string;
  };
  siteVerificationToken: string;
}

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;
const GA4_ID_PATTERN = /^(G|AW|UA)-[A-Z0-9]{4,15}$/;

/**
 * Resolve the deployment environment.
 *
 * `APP_ENV` wins when set (matches the existing convention in
 * `src/lib/feature-flags.ts`), then Vercel's `VERCEL_ENV`, then `NODE_ENV`.
 */
export function resolveDeploymentEnvironment(env: NodeJS.ProcessEnv = process.env): DeploymentEnvironment {
  const raw = (env.APP_ENV || env.VERCEL_ENV || env.NODE_ENV || 'development').toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'staging' || raw === 'stage' || raw === 'preview') return 'staging';
  if (raw === 'test' || raw === 'testing') return 'test';
  return 'development';
}

function firstString(env: NodeJS.ProcessEnv, ...keys: string[]): string {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return '';
}

function normalizeSiteUrl(raw: string): string {
  const fallback = 'https://aloeducation.com';
  const value = (raw || fallback).trim().replace(/\/+$/, '');
  return value === '' ? fallback : value;
}

/** True when a Search Console service-account JSON credential is present. */
function detectServiceAccount(env: NodeJS.ProcessEnv): boolean {
  const raw = firstString(env, 'GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON', 'GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) return false;
  // Accept either inline JSON or a base64-wrapped JSON document (the existing
  // .env.example documents base64). Validate the shape without echoing it.
  const candidates = [raw];
  try {
    candidates.push(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    /* not base64 — the raw candidate still applies */
  }
  return candidates.some((candidate) => {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      return (
        typeof parsed.client_email === 'string' &&
        parsed.client_email !== '' &&
        typeof parsed.private_key === 'string' &&
        parsed.private_key !== ''
      );
    } catch {
      return false;
    }
  });
}

/**
 * Resolve the whole Google stack configuration.
 *
 * Pure with respect to its `env` argument, so it is unit-testable without
 * mutating `process.env`.
 */
export function getGoogleStackConfig(env: NodeJS.ProcessEnv = process.env): GoogleStackConfig {
  const environment = resolveDeploymentEnvironment(env);
  const siteUrl = normalizeSiteUrl(
    firstString(env, 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_URL'),
  );
  const isProduction = environment === 'production';

  // Allow a deliberate, explicit opt-in for staging so QA can validate tags
  // against a SEPARATE property. There is no opt-in for development or test:
  // those must never emit analytics.
  const nonProdAllowed =
    environment === 'staging' && firstString(env, 'ANALYTICS_ALLOW_NON_PRODUCTION') === 'true';

  const ga4IdRaw = firstString(env, 'GA4_MEASUREMENT_ID', 'NEXT_PUBLIC_GA_MEASUREMENT_ID');
  const ga4MeasurementId = GA4_ID_PATTERN.test(ga4IdRaw) ? ga4IdRaw : '';
  const ga4Flag = firstString(env, 'NEXT_PUBLIC_GA4_ENABLED');
  const ga4EnabledRequested = ga4Flag === 'true';
  const apiSecretConfigured = firstString(env, 'GA4_API_SECRET', 'GA4_MEASUREMENT_PROTOCOL_SECRET') !== '';

  let ga4Reason: string;
  let ga4Inject: boolean;
  if (!ga4IdRaw) {
    ga4Inject = false;
    ga4Reason = 'NOT CONFIGURED — set GA4_MEASUREMENT_ID (format G-XXXXXXXXXX).';
  } else if (!ga4MeasurementId) {
    ga4Inject = false;
    ga4Reason = `NOT CONFIGURED — GA4_MEASUREMENT_ID value is not a valid measurement ID and was ignored rather than emitted to the page.`;
  } else if (!ga4EnabledRequested) {
    ga4Inject = false;
    ga4Reason = 'DISABLED — set NEXT_PUBLIC_GA4_ENABLED=true to activate.';
  } else if (!isProduction && !nonProdAllowed) {
    ga4Inject = false;
    ga4Reason = `SUPPRESSED IN ${environment.toUpperCase()} — analytics inject in production only, so test traffic cannot reach the production property. Set ANALYTICS_ALLOW_NON_PRODUCTION=true on staging to override.`;
  } else {
    ga4Inject = true;
    ga4Reason = isProduction
      ? 'ACTIVE — tags will be injected.'
      : 'ACTIVE (staging override) — ANALYTICS_ALLOW_NON_PRODUCTION=true is set.';
  }

  const gtmIdRaw = firstString(env, 'NEXT_PUBLIC_GTM_ID', 'GTM_CONTAINER_ID');
  const gtmContainerId = GTM_ID_PATTERN.test(gtmIdRaw) ? gtmIdRaw : '';
  const gtmEnabledRequested = firstString(env, 'NEXT_PUBLIC_GTM_ENABLED') !== 'false';

  let gtmReason: string;
  let gtmInject: boolean;
  if (!gtmIdRaw) {
    gtmInject = false;
    gtmReason = 'NOT CONFIGURED — set NEXT_PUBLIC_GTM_ID (format GTM-XXXXXXX).';
  } else if (!gtmContainerId) {
    gtmInject = false;
    gtmReason = 'NOT CONFIGURED — NEXT_PUBLIC_GTM_ID is not a valid container ID and was ignored.';
  } else if (!gtmEnabledRequested) {
    gtmInject = false;
    gtmReason = 'DISABLED — NEXT_PUBLIC_GTM_ENABLED=false.';
  } else if (!isProduction && !nonProdAllowed) {
    gtmInject = false;
    gtmReason = `SUPPRESSED IN ${environment.toUpperCase()} — see the GA4 environment gate.`;
  } else {
    gtmInject = true;
    gtmReason = 'ACTIVE — container will be injected.';
  }

  const gscSiteUrl = normalizeSiteUrl(firstString(env, 'GOOGLE_SEARCH_CONSOLE_SITE_URL'));
  const hasServiceAccount = detectServiceAccount(env);
  const hasOAuth =
    firstString(env, 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET') !== '' &&
    firstString(env, 'GOOGLE_CLIENT_ID') !== '' &&
    firstString(env, 'GOOGLE_CLIENT_SECRET') !== '' &&
    (firstString(env, 'GOOGLE_OAUTH_REFRESH_TOKEN', 'GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN') !== '' ||
      firstString(env, 'GOOGLE_OAUTH_ACCESS_TOKEN') !== '');
  const searchConsoleAuthMode: GoogleStackConfig['searchConsole']['authMode'] = hasServiceAccount
    ? 'service_account'
    : hasOAuth
      ? 'oauth_refresh_token'
      : 'none';
  const searchConsoleConfigured = searchConsoleAuthMode !== 'none';
  const searchConsoleReason = searchConsoleConfigured
    ? `CONFIGURED via ${searchConsoleAuthMode === 'service_account' ? 'service account' : 'OAuth refresh token'}. Domain ownership must still be verified in Search Console and the property shared with the credential.`
    : 'NOT CONFIGURED — supply GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON (service account) or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN.';

  const bpAccountId = firstString(env, 'GOOGLE_BUSINESS_ACCOUNT_ID');
  const bpConfigured = bpAccountId !== '' && searchConsoleAuthMode !== 'none' || (bpAccountId !== '' && hasOAuth);
  const businessProfileReason = bpAccountId
    ? bpConfigured
      ? 'CONFIGURED — account id and a Google credential are present.'
      : 'PARTIAL — GOOGLE_BUSINESS_ACCOUNT_ID is set but no usable Google credential (service account or OAuth refresh token) is present, so API calls cannot be authenticated.'
    : 'NOT CONFIGURED — set GOOGLE_BUSINESS_ACCOUNT_ID (Business Profile → settings → account id).';

  const ytHandle = firstString(env, 'NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE').replace(/^@/, '');
  const ytChannelId = firstString(env, 'NEXT_PUBLIC_YOUTUBE_CHANNEL_ID');
  const ytDataApi =
    firstString(env, 'YOUTUBE_API_KEY') !== '' ||
    (firstString(env, 'YOUTUBE_CLIENT_ID') !== '' && firstString(env, 'YOUTUBE_CLIENT_SECRET') !== '');
  const youtubeConfigured = ytHandle !== '' || ytChannelId !== '';
  const youtubeReason = youtubeConfigured
    ? `CONFIGURED — channel ${ytHandle ? `@${ytHandle}` : ytChannelId}. Embedding needs no API key; the Data API is ${ytDataApi ? 'configured' : 'NOT CONFIGURED (upload/publishing disabled)'}.`
    : 'NOT CONFIGURED — set NEXT_PUBLIC_YOUTUBE_CHANNEL_HANDLE (embedding still works per-video without it).';

  const mapsKey = firstString(env, 'GOOGLE_MAPS_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
  const mapsConfigured = mapsKey !== '';
  const mapsReason = mapsConfigured
    ? 'API KEY PRESENT — note that Maps Platform is a PAID service requiring a Cloud billing account, and the key must be restricted by HTTP referrer and by API before it is used in a browser.'
    : 'NOT CONFIGURED — intentional. Maps Platform requires billing; ALO uses zero-cost "Open in Google Maps" deep links instead. See docs/GOOGLE-FREE-STACK.md §Maps.';

  const cloudProject = firstString(env, 'GOOGLE_CLOUD_PROJECT_ID');
  const cloudConfigured = cloudProject !== '';
  const cloudReason = cloudConfigured
    ? `PROJECT ${cloudProject} CONFIGURED — Google Cloud is optional for ALO and no ALO service depends on it.`
    : 'NOT CONFIGURED — intentional. The existing VPS remains the production runtime; Cloud Run/Scheduler/Storage would require a billing account for no functional gain.';

  const consentRaw = firstString(env, 'NEXT_PUBLIC_CONSENT_MODE');

  return {
    environment,
    siteUrl,
    ga4: {
      measurementId: ga4MeasurementId,
      enabled: ga4EnabledRequested && ga4MeasurementId !== '',
      apiSecretConfigured,
      injectTags: ga4Inject,
      reason: ga4Reason,
    },
    gtm: {
      containerId: gtmContainerId,
      enabled: gtmEnabledRequested && gtmContainerId !== '',
      injectTags: gtmInject,
      reason: gtmReason,
    },
    // Consent mode defaults ON: when it is enabled, tags load with all
    // consent types denied and are only upgraded after an explicit visitor
    // choice. Turning it off is an explicit operator decision.
    consentMode: consentRaw === '' ? true : consentRaw !== 'false',
    searchConsole: {
      siteUrl: gscSiteUrl,
      configured: searchConsoleConfigured,
      authMode: searchConsoleAuthMode,
      reason: searchConsoleReason,
    },
    businessProfile: {
      accountId: bpAccountId,
      configured: Boolean(bpConfigured),
      reason: businessProfileReason,
    },
    youtube: {
      channelHandle: ytHandle,
      channelId: ytChannelId,
      configured: youtubeConfigured,
      dataApiConfigured: ytDataApi,
      reason: youtubeReason,
    },
    maps: { configured: mapsConfigured, reason: mapsReason },
    cloud: { projectId: cloudProject, configured: cloudConfigured, reason: cloudReason },
    siteVerificationToken: firstString(env, 'GOOGLE_SITE_VERIFICATION_TOKEN'),
  };
}

/**
 * Decide which single tag loader owns the page.
 *
 * GTM and the direct gtag loader must never both be injected: that produces two
 * GA4 configuration tags and therefore duplicated `page_view` hits and doubled
 * event counts. GTM wins when it is injectable, because GTM is the mandated
 * tag-management layer and the place where GA4, Ads and Meta tags are added
 * without a code change.
 */
export function resolveTagLoader(config: GoogleStackConfig): {
  loader: 'gtm' | 'gtag' | 'none';
  id: string;
  reason: string;
} {
  if (config.gtm.injectTags && config.gtm.containerId) {
    return {
      loader: 'gtm',
      id: config.gtm.containerId,
      reason: config.ga4.injectTags
        ? 'GTM owns the page. The GA4 configuration tag must live inside the GTM container — the direct gtag loader is intentionally NOT injected, because both together would double every page_view and event.'
        : config.gtm.reason,
    };
  }
  if (config.ga4.injectTags && config.ga4.measurementId) {
    return {
      loader: 'gtag',
      id: config.ga4.measurementId,
      reason:
        'No GTM container is active, so GA4 is loaded directly with gtag.js. Exactly one loader is on the page.',
    };
  }
  return {
    loader: 'none',
    id: '',
    reason: config.gtm.injectTags ? config.gtm.reason : config.ga4.reason,
  };
}

/** True when the given service costs money or needs a billing account. */
export function requiresBilling(service: GoogleServiceId): boolean {
  return GOOGLE_SERVICE_COSTS[service].billingAccountRequired;
}

/** True when ALO is forbidden from treating the service as a hard dependency. */
export function isOptionalService(service: GoogleServiceId): boolean {
  return GOOGLE_SERVICE_COSTS[service].optional;
}
