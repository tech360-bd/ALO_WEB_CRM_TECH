/**
 * Google Search Console API client.
 *
 * Before this module ALO had an analyser (`src/lib/seo-engine.ts`) that could
 * turn Search Console rows into SEO opportunities, and an admin panel that asked
 * a human to paste those rows in as JSON. There was no client that actually
 * talked to Google. This is that client.
 *
 * Authentication — two supported modes, both real:
 *
 *   1. **Service account** (`GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON`, inline or
 *      base64 JSON). A signed RS256 JWT is exchanged for an access token at
 *      `oauth2.googleapis.com`. The service account must be added as a user on
 *      the Search Console property; Google does not grant access implicitly.
 *   2. **OAuth refresh token** (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` +
 *      `GOOGLE_OAUTH_REFRESH_TOKEN`). For an operator who authorised their own
 *      Google account rather than creating a service account.
 *
 * Only `https://www.googleapis.com/auth/webmasters.readonly` is requested. ALO
 * reads performance and sitemap data; it never needs write access, and asking
 * for less is the whole point of scope restriction.
 *
 * Honesty rules:
 *   - When no credential is configured every call returns
 *     `{ status: 'NOT_CONFIGURED' }`. It never returns empty data shaped like a
 *     successful response, because an admin cannot distinguish "no traffic" from
 *     "not connected" in that case.
 *   - A 401/403 is reported as `AUTH_FAILED` / `NO_ACCESS` with Google's own
 *     error reason, not as zero clicks.
 *   - Secrets are never logged or returned. `describeCredential()` reports the
 *     auth mode and the client email only.
 */

import {
  SCOPE_SEARCH_CONSOLE as SEARCH_CONSOLE_SCOPE,
  describeGoogleCredential,
  googleApiRequest,
  resolveGoogleCredential,
  clearGoogleTokenCache,
  type GoogleAuthMode as AuthMode,
} from '@/lib/google/oauth';
import { getGoogleStackConfig } from '@/lib/google/config';

export { SEARCH_CONSOLE_SCOPE };

const DEFAULT_TIMEOUT_MS = 15_000;
const API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

export type SearchConsoleStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'NO_ACCESS'
  | 'API_ERROR'
  | 'TIMEOUT';

export interface SearchConsoleResult<T> {
  status: SearchConsoleStatus;
  data?: T;
  /** Human-readable, secret-free explanation. Safe to show an admin. */
  reason?: string;
  httpStatus?: number;
  /** Google's own error `reason` / `status` string when one was returned. */
  googleErrorReason?: string;
  fetchedAt?: string;
}

/** Row shape consumed by `analyzeSearchConsoleData` in src/lib/seo-engine.ts. */
export interface SearchConsolePerformanceRow {
  url?: string | null;
  query?: string | null;
  country?: string | null;
  device?: string | null;
  date?: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  rowCount: number;
}

export interface SearchConsoleSitemap {
  path: string;
  lastSubmitted?: string | null;
  lastDownloaded?: string | null;
  contents?: { type?: string; submitted?: number; indexed?: number }[];
  warnings?: number;
  errors?: number;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
}

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel?: string;
}

/** The configured property, from the shared Google config resolver. */
function siteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return getGoogleStackConfig(env).searchConsole.siteUrl;
}

/**
 * Parse the configured credential.
 *
 * Delegates to `src/lib/google/oauth.ts` so there is exactly one JWT signer and
 * one credential parser in the codebase, then attaches the Search Console
 * property this client operates on.
 */
export function resolveCredential(env: NodeJS.ProcessEnv = process.env): {
  mode: AuthMode;
  siteUrl: string;
} {
  return { mode: resolveGoogleCredential(env).mode, siteUrl: siteUrl(env) };
}

/** Secret-free description of the credential, safe to return to an admin UI. */
export function describeCredential(env: NodeJS.ProcessEnv = process.env): {
  mode: AuthMode;
  configured: boolean;
  siteUrl: string;
  serviceAccountEmail?: string;
  note: string;
} {
  const described = describeGoogleCredential(env);
  return {
    mode: described.mode,
    configured: described.configured,
    siteUrl: siteUrl(env),
    ...(described.serviceAccountEmail ? { serviceAccountEmail: described.serviceAccountEmail } : {}),
    note: described.reason,
  };
}

/** Forget the cached token. Call after a 401 so a retry re-authenticates. */
export function clearTokenCache(): void {
  clearGoogleTokenCache(SEARCH_CONSOLE_SCOPE);
}

/**
 * Generic authenticated Search Console call.
 *
 * Token acquisition, the one-shot 401 retry and error sanitisation all live in
 * `googleApiRequest`. What this adds is Search Console-specific status mapping:
 * a 403 from this API almost always means the credential is valid but was never
 * added as a user on the property, which deserves its own label rather than a
 * generic auth failure.
 */
async function callApi<T>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<SearchConsoleResult<T>> {
  if (resolveGoogleCredential(env).mode === 'none') {
    return { status: 'NOT_CONFIGURED', reason: describeCredential(env).note };
  }
  const result = await googleApiRequest<T>(
    SEARCH_CONSOLE_SCOPE,
    `${API_BASE}${path}`,
    init,
    env,
    DEFAULT_TIMEOUT_MS,
  );
  if (result.status === 'READY') {
    return { status: 'READY', data: result.data, fetchedAt: result.fetchedAt };
  }
  return {
    status: result.httpStatus === 403 ? 'NO_ACCESS' : result.status,
    reason:
      result.httpStatus === 403
        ? `Google refused access to ${siteUrl(env)}. The credential is valid but is not a user on this Search Console property. ${result.googleErrorReason ?? ''}`.trim()
        : result.reason,
    httpStatus: result.httpStatus,
    googleErrorReason: result.googleErrorReason,
  };
}

/** Encode a property URL the way the API expects (trailing slash, escaped). */
export function encodeSiteUrl(siteUrl: string): string {
  const normalised = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  return encodeURIComponent(normalised);
}

/** Properties this credential can actually see. Proves the connection works. */
export async function listSites(env: NodeJS.ProcessEnv = process.env): Promise<SearchConsoleResult<SearchConsoleSite[]>> {
  const result = await callApi<{ siteEntry?: { siteUrl: string; permissionLevel?: string }[] }>('/sites', {}, env);
  if (result.status !== 'READY' || !result.data) {
    return { status: result.status, reason: result.reason, httpStatus: result.httpStatus, googleErrorReason: result.googleErrorReason };
  }
  return {
    status: 'READY',
    data: (result.data.siteEntry ?? []).map((site) => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel,
    })),
    fetchedAt: result.fetchedAt,
  };
}

export interface PerformanceQuery {
  startDate: string;
  endDate: string;
  /** GSC dimensions: 'query' | 'page' | 'country' | 'device' | 'date'. */
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[];
  rowLimit?: number;
  /** Restrict to URLs under this path, e.g. `/destinations/uk`. */
  pageContains?: string;
}

interface RawPerformanceResponse {
  rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  responseAggregationType?: string;
}

/**
 * Run a Search Analytics query.
 *
 * Returns rows in exactly the shape `analyzeSearchConsoleData` consumes, so the
 * existing opportunity engine needs no changes. An empty result set is returned
 * as `status: 'READY'` with zero rows — that is a genuine "no data" answer and
 * is distinguishable from `NOT_CONFIGURED`.
 */
export async function querySearchAnalytics(
  query: PerformanceQuery,
  env: NodeJS.ProcessEnv = process.env,
): Promise<SearchConsoleResult<{ rows: SearchConsolePerformanceRow[]; totals: SearchConsoleTotals }>> {
  const credential = resolveCredential(env);
  const dimensions = query.dimensions ?? ['query'];
  const body: Record<string, unknown> = {
    startDate: query.startDate,
    endDate: query.endDate,
    dimensions,
    rowLimit: Math.min(Math.max(query.rowLimit ?? 250, 1), 25000),
    dataState: 'final',
    type: 'web',
  };
  if (query.pageContains) {
    body.dimensionFilterGroups = [
      { filters: [{ dimension: 'page', expression: query.pageContains, operator: 'contains' }] },
    ];
  }

  const result = await callApi<RawPerformanceResponse>(
    `/sites/${encodeSiteUrl(credential.siteUrl)}/searchAnalytics/query`,
    { method: 'POST', body },
    env,
  );
  if (result.status !== 'READY' || !result.data) {
    return { status: result.status, reason: result.reason, httpStatus: result.httpStatus, googleErrorReason: result.googleErrorReason };
  }

  const rows: SearchConsolePerformanceRow[] = (result.data.rows ?? []).map((row) => {
    const keys = row.keys ?? [];
    const mapped: SearchConsolePerformanceRow = {
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      ctr: Number(row.ctr) || 0,
      position: Number(row.position) || 0,
    };
    // Keys come back in the order the dimensions were requested.
    dimensions.forEach((dimension, index) => {
      const value = keys[index] ?? null;
      if (dimension === 'query') mapped.query = value;
      else if (dimension === 'page') mapped.url = value;
      else if (dimension === 'country') mapped.country = value;
      else if (dimension === 'device') mapped.device = value;
      else if (dimension === 'date') mapped.date = value;
    });
    return mapped;
  });

  const totals = rows.reduce<SearchConsoleTotals>(
    (accumulator, row) => ({
      clicks: accumulator.clicks + row.clicks,
      impressions: accumulator.impressions + row.impressions,
      ctr: 0,
      position: 0,
      rowCount: accumulator.rowCount + 1,
    }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0, rowCount: 0 },
  );
  // CTR and average position are impression-weighted, not simple averages: a
  // plain mean would let one low-impression query dominate the summary.
  totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const weightedPosition = rows.reduce(
    (sum, row) => sum + row.position * row.impressions,
    0,
  );
  totals.position = totals.impressions > 0 ? weightedPosition / totals.impressions : 0;

  return { status: 'READY', data: { rows, totals }, fetchedAt: result.fetchedAt };
}

/** Submitted sitemaps and their indexed/submitted counts. */
export async function listSitemaps(env: NodeJS.ProcessEnv = process.env): Promise<SearchConsoleResult<SearchConsoleSitemap[]>> {
  const credential = resolveCredential(env);
  const result = await callApi<{ sitemap?: Record<string, unknown>[] }>(
    `/sites/${encodeSiteUrl(credential.siteUrl)}/sitemaps`,
    {},
    env,
  );
  if (result.status !== 'READY' || !result.data) {
    return { status: result.status, reason: result.reason, httpStatus: result.httpStatus, googleErrorReason: result.googleErrorReason };
  }
  const sitemaps = (result.data.sitemap ?? []).map((entry) => {
    const contents = Array.isArray(entry.contents)
      ? (entry.contents as Record<string, unknown>[]).map((content) => ({
          type: typeof content.type === 'string' ? content.type : undefined,
          submitted: typeof content.submitted === 'number' ? content.submitted : undefined,
          indexed: typeof content.indexed === 'number' ? content.indexed : undefined,
        }))
      : undefined;
    return {
      path: typeof entry.path === 'string' ? entry.path : '',
      lastSubmitted: typeof entry.lastSubmitted === 'string' ? entry.lastSubmitted : null,
      lastDownloaded: typeof entry.lastDownloaded === 'string' ? entry.lastDownloaded : null,
      contents,
      warnings: typeof entry.warnings === 'number' ? entry.warnings : 0,
      errors: typeof entry.errors === 'number' ? entry.errors : 0,
      isPending: entry.isPending === true,
      isSitemapsIndex: entry.isSitemapsIndex === true,
    } satisfies SearchConsoleSitemap;
  });
  return { status: 'READY', data: sitemaps, fetchedAt: result.fetchedAt };
}

/**
 * Connection self-test: proves the credential works and can see the property.
 *
 * Returns `READY` only when Google actually answered. This is the difference
 * between "credentials are present" (which `/api/seo/health` reports) and "the
 * integration works", which is what an operator needs before trusting a
 * dashboard.
 */
export async function verifyConnection(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ status: SearchConsoleStatus; siteUrl: string; sites: SearchConsoleSite[]; propertyAccessible: boolean; reason: string }> {
  const credential = resolveCredential(env);
  if (credential.mode === 'none') {
    return {
      status: 'NOT_CONFIGURED',
      siteUrl: credential.siteUrl,
      sites: [],
      propertyAccessible: false,
      reason: describeCredential(env).note,
    };
  }
  const result = await listSites(env);
  if (result.status !== 'READY' || !result.data) {
    return {
      status: result.status,
      siteUrl: credential.siteUrl,
      sites: [],
      propertyAccessible: false,
      reason: result.reason ?? 'Search Console did not return a site list.',
    };
  }
  // A domain property appears as `sc-domain:example.com`; a URL-prefix property
  // appears as the full origin. Accept either for the configured site.
  const configured = credential.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const propertyAccessible = result.data.some((site) => {
    const value = site.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    return value === configured || configured.endsWith(`.${value}`);
  });
  return {
    status: 'READY',
    siteUrl: credential.siteUrl,
    sites: result.data,
    propertyAccessible,
    reason: propertyAccessible
      ? `Connected. ${result.data.length} propert${result.data.length === 1 ? 'y' : 'ies'} visible and ${credential.siteUrl} is among them.`
      : `Connected, but ${credential.siteUrl} is NOT among the ${result.data.length} visible propert${result.data.length === 1 ? 'y' : 'ies'}. Add the credential as a user on that property in Search Console.`,
  };
}
