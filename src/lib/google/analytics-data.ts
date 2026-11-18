/**
 * GA4 Analytics Data API client.
 *
 * Read side of Google Analytics: the numbers a dashboard shows (sessions,
 * users, traffic source, landing page, campaign). It is deliberately separate
 * from `src/lib/analytics/*`, which is the *write* path (dataLayer + Measurement
 * Protocol), because the two fail independently: a broken reporting credential
 * must never stop event collection, and a broken tag must never blank the
 * dashboard.
 *
 * Cost: the Analytics Data API is **FREE**. It needs a Cloud project with the
 * API enabled and a credential with `analytics.readonly`, but no billing
 * account, and GA4 Standard property data has no per-query charge. Quota is the
 * only limit (default 25,000 tokens/day per property for core reports).
 *
 * Honesty rules, the same ones the Search Console client enforces:
 *   - No credential  → `NOT_CONFIGURED`, never an empty dashboard that reads as
 *     "working, but no traffic".
 *   - Credential rejected / API disabled / wrong property → `AUTH_FAILED` /
 *     `NO_ACCESS` / `API_ERROR` with Google's own reason, never zeroes.
 *   - A genuinely empty result set is `READY` with `rows: []`, which is a real
 *     answer and is deliberately distinguishable from the three states above.
 *   - Nothing here throws. A reporting failure must not break the CRM.
 */

import { googleApiRequest, type GoogleApiResult } from './oauth';
import { resolveGoogleCredential, describeGoogleCredential } from './oauth';
import { getGoogleStackConfig } from './config';

/** Read-only Analytics scope. Never request the write or admin scope. */
export const GA4_DATA_API_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

const API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 15_000;

export type AnalyticsDataStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'NO_ACCESS'
  | 'API_ERROR'
  | 'TIMEOUT';

export interface AnalyticsDataResult<T> {
  status: AnalyticsDataStatus;
  data?: T;
  /** Secret-free, operator-readable explanation. */
  reason?: string;
  httpStatus?: number;
  /** Google's own `reason`/`status` string, when one was returned. */
  googleErrorReason?: string;
  fetchedAt?: string;
}

/**
 * Dimensions and metrics ALO is allowed to request.
 *
 * An allowlist rather than a pass-through because the property is queried from
 * an HTTP endpoint: an unchecked dimension name is an unbounded query surface,
 * and GA4 rejects unknown fields with a 400 that would surface to the operator as
 * a mysterious API error. Everything listed is a standard, free GA4 field.
 */
export const ALLOWED_DIMENSIONS = [
  'date',
  'sessionSource',
  'sessionMedium',
  'sessionCampaignName',
  'sessionDefaultChannelGroup',
  'landingPagePlusQueryString',
  'pagePath',
  'pageTitle',
  'country',
  'city',
  'deviceCategory',
  'eventName',
  'fullPageUrl',
  'firstUserSource',
  'firstUserMedium',
  'firstUserCampaignName',
] as const;

export const ALLOWED_METRICS = [
  'sessions',
  'totalUsers',
  'newUsers',
  'engagedSessions',
  'engagementRate',
  'averageSessionDuration',
  'screenPageViews',
  'eventCount',
  'conversions',
  'keyEvents',
  'bounceRate',
] as const;

export type AllowedDimension = (typeof ALLOWED_DIMENSIONS)[number];
export type AllowedMetric = (typeof ALLOWED_METRICS)[number];

/**
 * Property id from configuration.
 *
 * Accepts `123456789`, `properties/123456789` and `GA4_PROPERTY_ID`. Returns ''
 * when absent — callers must treat that as NOT_CONFIGURED, never as property 0.
 */
export function resolvePropertyId(env: NodeJS.ProcessEnv = process.env): string {
  const raw = getGoogleStackConfig(env).analyticsData.propertyId.trim();
  if (!raw) return '';
  const digits = raw.replace(/^properties\//i, '');
  // A GA4 property id is numeric. Anything else is a copy/paste of the
  // measurement ID (G-XXXX) or the stream id, both of which fail at the API with
  // an opaque 400, so they are rejected here with a reason instead.
  return /^\d{5,15}$/.test(digits) ? digits : '';
}

/** Secret-free description for the admin UI and `/api/google/status`. */
export function describeAnalyticsDataConfig(env: NodeJS.ProcessEnv = process.env): {
  configured: boolean;
  propertyId: string;
  authMode: ReturnType<typeof resolveGoogleCredential>['mode'];
  serviceAccountEmail?: string;
  note: string;
} {
  const config = getGoogleStackConfig(env);
  const credential = describeGoogleCredential(env);
  const propertyId = resolvePropertyId(env);
  const rawProperty = config.analyticsData.propertyId;
  let note: string;
  if (!credential.configured) {
    note =
      'NOT CONFIGURED — the Analytics Data API needs the same Google credential as Search Console (service account or OAuth refresh token) with the analytics.readonly scope.';
  } else if (!rawProperty) {
    note = 'NOT CONFIGURED — set GA4_PROPERTY_ID (GA4 > Admin > Property settings, the numeric property id).';
  } else if (!propertyId) {
    note = `CONFIGURATION REQUIRED — GA4_PROPERTY_ID "${rawProperty}" is not a numeric property id. Use the property id, not the G- measurement ID or the stream id.`;
  } else {
    note = `CONFIGURED — property ${propertyId}. The service account must be added as a Viewer on the GA4 property, and the Analytics Data API must be enabled in the Cloud project. Neither is verifiable from configuration alone.`;
  }
  return {
    configured: credential.configured && propertyId !== '',
    propertyId,
    authMode: credential.mode,
    ...(credential.serviceAccountEmail ? { serviceAccountEmail: credential.serviceAccountEmail } : {}),
    note,
  };
}

export interface AnalyticsReportRequest {
  /** GA4 relative date, e.g. `28daysAgo`, `yesterday`, `today`, or `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  /** Metric name to sort descending by. Defaults to the first metric. */
  orderBy?: string;
  /** Optional filter, e.g. only organic Google sessions. */
  dimensionFilter?: {
    dimension: string;
    operator: 'EXACT' | 'CONTAINS' | 'BEGINS_WITH';
    value: string;
  };
}

export interface AnalyticsReportRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

export interface AnalyticsReport {
  propertyId: string;
  rows: AnalyticsReportRow[];
  /** Metric total across returned rows — GA4's own `totals`, not a client sum. */
  totals: Record<string, number>;
  rowCount: number;
  /** True when GA4 says the result is sampled or incomplete. */
  sampled: boolean;
  dataFreshness: string;
  period: { startDate: string; endDate: string };
}

interface RawRunReportResponse {
  dimensionHeaders?: { name?: string }[];
  metricHeaders?: { name?: string; type?: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  totals?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
  rowCount?: number;
  metadata?: { currencyCode?: string; timeZone?: string; dataLossFromOtherRow?: boolean };
}

/** Relative dates ALO may send. Absolute dates are validated separately. */
const RELATIVE_DATE_PATTERN = /^(?:today|yesterday|\d{1,3}daysAgo|\d{1,2}monthsAgo|startOfMonth)$/;
const ABSOLUTE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidGa4Date(value: string): boolean {
  return RELATIVE_DATE_PATTERN.test(value) || ABSOLUTE_DATE_PATTERN.test(value);
}

/**
 * Validate a caller-supplied report request before it reaches Google.
 *
 * Returns a list of problems (empty when valid) rather than throwing, so a
 * route handler can answer 400 with a precise message. Rejecting unknown
 * dimensions/metrics here is what keeps the endpoint from being an open query
 * proxy into the GA4 property.
 */
export function validateReportRequest(request: {
  startDate?: string;
  endDate?: string;
  dimensions?: string[];
  metrics?: string[];
  limit?: number;
}): string[] {
  const problems: string[] = [];
  if (!request.startDate || !isValidGa4Date(request.startDate)) {
    problems.push('startDate must be a GA4 relative date (28daysAgo, yesterday, today) or YYYY-MM-DD.');
  }
  if (!request.endDate || !isValidGa4Date(request.endDate)) {
    problems.push('endDate must be a GA4 relative date (today, yesterday) or YYYY-MM-DD.');
  }
  const dimensions = request.dimensions ?? [];
  const metrics = request.metrics ?? [];
  if (dimensions.length === 0 && metrics.length === 0) problems.push('At least one dimension or metric is required.');
  for (const dimension of dimensions) {
    if (!(ALLOWED_DIMENSIONS as readonly string[]).includes(dimension)) {
      problems.push(`Dimension "${dimension}" is not in the ALO allowlist (src/lib/google/analytics-data.ts).`);
    }
  }
  for (const metric of metrics) {
    if (!(ALLOWED_METRICS as readonly string[]).includes(metric)) {
      problems.push(`Metric "${metric}" is not in the ALO allowlist (src/lib/google/analytics-data.ts).`);
    }
  }
  if (metrics.length === 0) problems.push('At least one metric is required.');
  if (typeof request.limit === 'number' && (request.limit < 1 || request.limit > 10_000)) {
    problems.push('limit must be between 1 and 10000.');
  }
  return problems;
}

async function callApi<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown },
  env: NodeJS.ProcessEnv,
): Promise<GoogleApiResult<T>> {
  return googleApiRequest<T>(GA4_DATA_API_SCOPE, `${API_BASE}${path}`, init, env, DEFAULT_TIMEOUT_MS);
}

/** Map the shared Google auth status onto the Analytics Data vocabulary. */
function mapStatus(status: GoogleApiResult<unknown>['status']): AnalyticsDataStatus {
  switch (status) {
    case 'READY':
      return 'READY';
    case 'NOT_CONFIGURED':
      return 'NOT_CONFIGURED';
    case 'AUTH_FAILED':
      return 'AUTH_FAILED';
    case 'TIMEOUT':
      return 'TIMEOUT';
    case 'API_ERROR':
      return 'API_ERROR';
    default:
      return 'API_ERROR';
  }
}

/**
 * Run one GA4 report.
 *
 * Never throws. `status: 'READY'` with `rows: []` means Google answered and the
 * property genuinely has no matching data for the period — which is the honest
 * way to render a brand-new property, as opposed to three zeros pretending to
 * be a measurement.
 */
export async function runReport(
  request: AnalyticsReportRequest,
  env: NodeJS.ProcessEnv = process.env,
): Promise<AnalyticsDataResult<AnalyticsReport>> {
  const propertyId = resolvePropertyId(env);
  // `resolveGoogleCredential` reports the mode; `configured` lives on the
  // secret-free description. Using the resolver's own flag here keeps ONE
  // definition of "is a usable credential present".
  const credential = describeGoogleCredential(env);

  if (!propertyId) {
    return {
      status: 'NOT_CONFIGURED',
      reason: describeAnalyticsDataConfig(env).note,
    };
  }
  if (!credential.configured) {
    return {
      status: 'NOT_CONFIGURED',
      reason:
        'No Google credential is configured. The Analytics Data API uses the same credential as Search Console: GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON (service account) or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN.',
    };
  }

  const problems = validateReportRequest(request);
  if (problems.length > 0) {
    return { status: 'API_ERROR', reason: `Invalid report request: ${problems.join(' ')}` };
  }

  const body: Record<string, unknown> = {
    dateRanges: [{ startDate: request.startDate, endDate: request.endDate }],
    dimensions: request.dimensions.map((name) => ({ name })),
    metrics: request.metrics.map((name) => ({ name })),
    limit: String(Math.min(Math.max(request.limit ?? 100, 1), 10_000)),
    keepEmptyRows: false,
    metricAggregations: ['TOTAL'],
  };
  const orderMetric = request.orderBy ?? request.metrics[0];
  if (orderMetric) {
    body.orderBys = [{ metric: { metricName: orderMetric }, desc: true }];
  }
  if (request.dimensionFilter && request.dimensions.includes(request.dimensionFilter.dimension)) {
    body.dimensionFilter = {
      filter: {
        fieldName: request.dimensionFilter.dimension,
        stringFilter: {
          matchType: request.dimensionFilter.operator,
          value: request.dimensionFilter.value,
        },
      },
    };
  }

  const result = await callApi<RawRunReportResponse>(
    `/properties/${propertyId}:runReport`,
    { method: 'POST', body },
    env,
  );

  // Split deliberately: the discriminated union only narrows on `status`, so a
  // combined `status !== 'READY' || !data` test would leave the failure fields
  // unreachable to the type checker.
  if (result.status !== 'READY') {
    const status = mapStatus(result.status);
    // A 403 on a valid credential almost always means one of two operator
    // mistakes, so it is named rather than reported as a generic failure.
    if (status === 'AUTH_FAILED') {
      return {
        status: 'NO_ACCESS',
        reason: `Google refused access to GA4 property ${propertyId}. Either the Analytics Data API is not enabled in the Cloud project, or the service account has not been added as a Viewer on the property. Google said: ${result.googleErrorReason ?? 'no reason given'}.`,
        httpStatus: result.httpStatus,
        googleErrorReason: result.googleErrorReason,
      };
    }
    return {
      status,
      reason: result.reason,
      httpStatus: result.httpStatus,
      googleErrorReason: result.googleErrorReason,
    };
  }

  if (!result.data) {
    // Defensive: a READY result always carries data, but an empty payload is
    // reported as an API error rather than rendered as zero traffic.
    return { status: 'API_ERROR', reason: 'Google returned an empty report payload.' };
  }

  const raw = result.data;
  const dimensionNames = (raw.dimensionHeaders ?? []).map((header) => header.name ?? '');
  const metricNames = (raw.metricHeaders ?? []).map((header) => header.name ?? '');

  const rows: AnalyticsReportRow[] = (raw.rows ?? []).map((row) => {
    const dimensions: Record<string, string> = {};
    dimensionNames.forEach((name, index) => {
      if (name) dimensions[name] = row.dimensionValues?.[index]?.value ?? '';
    });
    const metrics: Record<string, number> = {};
    metricNames.forEach((name, index) => {
      if (name) metrics[name] = Number(row.metricValues?.[index]?.value ?? 0) || 0;
    });
    return { dimensions, metrics };
  });

  // GA4 returns the aggregate in `totals` only when metricAggregations is
  // requested. It is surfaced as-is rather than summed client-side, because a
  // client sum of a dimensioned report double-counts under sampling.
  const totals: Record<string, number> = {};
  const totalRow = raw.totals?.[0];
  metricNames.forEach((name, index) => {
    if (name) totals[name] = Number(totalRow?.metricValues?.[index]?.value ?? 0) || 0;
  });

  return {
    status: 'READY',
    data: {
      propertyId,
      rows,
      totals,
      rowCount: typeof raw.rowCount === 'number' ? raw.rowCount : rows.length,
      // `dataLossFromOtherRow` is GA4's own signal that high-cardinality values
      // were folded into "(other)"; treating it as sampling is conservative and
      // prevents a dashboard from presenting a partial figure as exact.
      sampled: Boolean(raw.metadata?.dataLossFromOtherRow),
      dataFreshness:
        'GA4 standard reports can lag up to 48 hours for a completed day, and intraday data is partial. Totals are Google\'s own aggregate for the requested period.',
      period: { startDate: request.startDate, endDate: request.endDate },
    },
    fetchedAt: result.fetchedAt,
  };
}

/**
 * Named reports the admin dashboard offers.
 *
 * Fixed definitions rather than free-form queries on the dashboard, so the
 * numbers shown are the same numbers every time and can be quoted in a report.
 * Acquisition coverage required by the specification: traffic source, organic
 * vs referral vs direct, campaigns, landing pages.
 */
export const REPORT_PRESETS = {
  /** Traffic source / medium — the acquisition report. */
  acquisition: {
    label: 'Acquisition — source / medium',
    dimensions: ['sessionSource', 'sessionMedium'],
    metrics: ['sessions', 'totalUsers', 'newUsers', 'engagedSessions', 'engagementRate', 'conversions'],
    limit: 100,
  },
  /** Default channel grouping — organic vs referral vs direct at a glance. */
  channels: {
    label: 'Acquisition — default channel group',
    dimensions: ['sessionDefaultChannelGroup'],
    metrics: ['sessions', 'totalUsers', 'engagedSessions', 'engagementRate', 'conversions'],
    limit: 25,
  },
  /** Campaign performance for future paid work. */
  campaigns: {
    label: 'Acquisition — campaigns',
    dimensions: ['sessionCampaignName', 'sessionSource', 'sessionMedium'],
    metrics: ['sessions', 'totalUsers', 'conversions'],
    limit: 100,
  },
  /** Landing page performance — which pages actually start sessions. */
  landingPages: {
    label: 'Acquisition — landing pages',
    dimensions: ['landingPagePlusQueryString'],
    metrics: ['sessions', 'totalUsers', 'engagedSessions', 'engagementRate', 'conversions'],
    limit: 100,
  },
  /** Daily trend, for a sparkline and for spotting a tag outage. */
  daily: {
    label: 'Trend — sessions per day',
    dimensions: ['date'],
    metrics: ['sessions', 'totalUsers', 'screenPageViews', 'conversions'],
    limit: 90,
  },
  /** Event-level check: what is actually arriving in the property. */
  events: {
    label: 'Events — what GA4 is receiving',
    dimensions: ['eventName'],
    metrics: ['eventCount', 'totalUsers'],
    limit: 100,
  },
  /** Country performance. */
  countries: {
    label: 'Audience — countries',
    dimensions: ['country'],
    metrics: ['sessions', 'totalUsers', 'conversions'],
    limit: 50,
  },
  /** Device split. */
  devices: {
    label: 'Audience — devices',
    dimensions: ['deviceCategory'],
    metrics: ['sessions', 'totalUsers', 'engagementRate', 'conversions'],
    limit: 10,
  },
} as const;

export type ReportPresetKey = keyof typeof REPORT_PRESETS;

export function isReportPreset(value: string): value is ReportPresetKey {
  return Object.prototype.hasOwnProperty.call(REPORT_PRESETS, value);
}

/** Run a named preset. */
export async function runPreset(
  preset: ReportPresetKey,
  period: { startDate: string; endDate: string } = { startDate: '28daysAgo', endDate: 'yesterday' },
  env: NodeJS.ProcessEnv = process.env,
): Promise<AnalyticsDataResult<AnalyticsReport>> {
  const definition = REPORT_PRESETS[preset];
  return runReport(
    {
      startDate: period.startDate,
      endDate: period.endDate,
      dimensions: [...definition.dimensions],
      metrics: [...definition.metrics],
      limit: definition.limit,
    },
    env,
  );
}

/**
 * Live connection check for `/api/google/status?live=true`.
 *
 * A deliberately trivial report — one metric, one day — because the point is to
 * prove the credential can read THIS property, not to fetch reporting data.
 */
export async function verifyConnection(
  env: NodeJS.ProcessEnv = process.env,
): Promise<AnalyticsDataResult<{ propertyId: string; reachable: boolean }>> {
  const propertyId = resolvePropertyId(env);
  if (!propertyId) {
    return { status: 'NOT_CONFIGURED', reason: describeAnalyticsDataConfig(env).note };
  }
  const result = await runReport(
    {
      startDate: 'yesterday',
      endDate: 'yesterday',
      dimensions: [],
      metrics: ['sessions'],
      limit: 1,
    },
    env,
  );
  if (result.status !== 'READY') {
    return { status: result.status, reason: result.reason, httpStatus: result.httpStatus, googleErrorReason: result.googleErrorReason };
  }
  return {
    status: 'READY',
    data: { propertyId, reachable: true },
    fetchedAt: result.fetchedAt,
  };
}
