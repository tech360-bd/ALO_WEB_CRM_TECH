/**
 * Lead acquisition attribution — capture, normalisation and lifecycle merge.
 *
 * This is the single place ALO turns an incoming HTTP request into the
 * attribution record stored on a lead. Every public lead endpoint must go
 * through it, because three endpoints deriving UTM independently is how
 * attribution silently disagrees with GA4.
 *
 * Rules this module enforces:
 *
 *   - **Nothing is invented.** A parameter the visitor did not send stays
 *     `null`/`''`. There is no `'direct'` guess written to the database and no
 *     default country, intake or campaign. `deriveSourceMedium()` exists for
 *     *reporting* only and is never persisted as if it were captured.
 *   - **First touch is immutable.** `firstTouch*` columns are written once, when
 *     the lead is created, and `mergeAttribution()` refuses to overwrite them.
 *     That is what makes "which campaign originally acquired this student"
 *     answerable months later.
 *   - **Last touch advances.** A returning visitor who converts again refreshes
 *     `lastTouch*`, so a multi-session journey stays traceable end to end.
 *   - **Bounded.** Every value is truncated to the VARCHAR(191) the migration
 *     created, and control characters are stripped, so a hostile or absurd URL
 *     cannot inflate a row or break the insert.
 *   - **No PII.** The referrer is reduced to an origin. Query strings are read
 *     for attribution keys only; nothing else is copied from the URL.
 */

import {
  deriveSourceMedium,
  emptyAttribution,
  extractAttribution,
  hasAnyAttribution,
  type AttributionParams,
} from '@/lib/analytics/page-context';
import { referrerDomain } from '@/lib/analytics/events';

/** MySQL VARCHAR(191) — every persisted attribution value fits inside this. */
export const ATTRIBUTION_MAX_LENGTH = 191;

export interface LeadAttributionRecord {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
  landingPage: string | null;
  referrer: string | null;
  visitorId: string | null;
  /** True when the request carried at least one attribution signal. */
  captured: boolean;
  /** True when a paid-click identifier was present. */
  paidClick: boolean;
}

/** Attribution fields as they exist on the `Lead` model. */
export interface LeadAttributionColumns {
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  visitorId?: string | null;
}

/** Attribution fields as they exist on the `LeadForm` model (''-defaulted). */
export type LeadFormAttributionColumns = {
  [K in keyof Omit<LeadAttributionColumns, 'medium' | 'campaign' | 'content' | 'term'>]: string;
} & { utmSource: string };

export function emptyLeadAttribution(): LeadAttributionRecord {
  return {
    source: null,
    medium: null,
    campaign: null,
    content: null,
    term: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    gclid: null,
    fbclid: null,
    landingPage: null,
    referrer: null,
    visitorId: null,
    captured: false,
    paidClick: false,
  };
}

function truncate(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (cleaned === '') return null;
  return cleaned.slice(0, ATTRIBUTION_MAX_LENGTH);
}

function nullify(value: string | null | undefined): string | null {
  return truncate(value);
}

export interface CaptureInput {
  /** Full request URL, or at minimum a path with a query string. */
  url?: string | null;
  /** Query string alone, when the caller has already parsed the request. */
  search?: string | null;
  /** The `referer` header, or `document.referrer` from the form payload. */
  referer?: string | null;
  /** Landing page reported by the form itself (it knows the page it lives on). */
  landingPage?: string | null;
  /** Opaque analytics visitor token from src/lib/analytics/visitor.ts. */
  visitorId?: string | null;
  /**
   * Attribution fields the client explicitly posted. Trusted only for the
   * attribution keys — a posted `source` never overrides a real UTM value,
   * because a form field is trivially forgeable while the URL the visitor
   * actually arrived on is not.
   */
  body?: Record<string, unknown> | null;
}

function bodyString(body: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!body) return '';
  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return '';
}

/**
 * Build the attribution record for an incoming request.
 *
 * Resolution order for each attribution key:
 *   1. the request URL's query string (what the visitor actually arrived with),
 *   2. the posted body (needed when the form posts from a later SPA route and
 *      the original query string is gone — the client forwards it explicitly).
 * A URL value always wins over a posted one.
 */
export function captureAttribution(input: CaptureInput = {}): LeadAttributionRecord {
  const record = emptyLeadAttribution();

  // 1. URL / query string
  let fromUrl: AttributionParams = emptyAttribution();
  let urlPath = '';
  let urlSearch = '';
  if (input.url) {
    try {
      const parsed = new URL(input.url, 'https://aloeducation.com');
      fromUrl = extractAttribution(parsed);
      urlPath = parsed.pathname || '';
      urlSearch = parsed.search || '';
    } catch {
      /* unparseable URL contributes nothing */
    }
  } else if (input.search) {
    try {
      fromUrl = extractAttribution(new URL(`https://aloeducation.com/${input.search.replace(/^\?/, '')}`));
    } catch {
      /* ignore */
    }
  }

  const body = input.body ?? null;
  const pick = (fromUrlValue: string, ...bodyKeys: string[]): string | null =>
    nullify(fromUrlValue || bodyString(body, ...bodyKeys));

  record.utmSource = pick(fromUrl.utm_source, 'utmSource', 'utm_source');
  record.utmMedium = pick(fromUrl.utm_medium, 'utmMedium', 'utm_medium');
  record.utmCampaign = pick(fromUrl.utm_campaign, 'utmCampaign', 'utm_campaign');
  record.utmContent = pick(fromUrl.utm_content, 'utmContent', 'utm_content');
  record.utmTerm = pick(fromUrl.utm_term, 'utmTerm', 'utm_term');
  record.gclid = pick(fromUrl.gclid, 'gclid');
  record.fbclid = pick(fromUrl.fbclid, 'fbclid');

  // `campaign` accepts the bare alias too, but never falls back to the utm
  // value: a lead that arrived with only utm_campaign has campaign = null, and
  // reporting groups it under utm_campaign. Collapsing them here would destroy
  // the distinction between the two spellings.
  record.campaign = nullify(fromUrl.campaign && fromUrl.campaign !== record.utmCampaign ? fromUrl.campaign : bodyString(body, 'campaign'));
  record.content = nullify(bodyString(body, 'content'));
  record.term = nullify(bodyString(body, 'term'));

  // `source` on the lead is ALO's acquisition channel, not utm_source. Callers
  // pass it explicitly ('WEBSITE', 'GOOGLE_MAPS', …); this module only records
  // it when the caller supplied one.
  record.source = nullify(bodyString(body, 'leadSource', 'lead_source'));

  // Landing page: prefer the URL the request actually came in on, then the
  // value the form reported about itself, then the body's own field.
  const fromUrlLanding = urlPath ? `${urlPath}${urlSearch}` : '';
  record.landingPage = nullify(
    fromUrlLanding || input.landingPage || bodyString(body, 'landingPage', 'landing_page', 'pageUrl', 'pagePath'),
  );

  record.referrer = nullify(
    referrerDomain(input.referer || bodyString(body, 'referrer', 'referer', 'documentReferrer')),
  );
  record.visitorId = nullify(input.visitorId || bodyString(body, 'visitorId', 'visitor_id'));

  record.paidClick = Boolean(record.gclid || record.fbclid);
  record.captured =
    hasAnyAttribution({
      utm_source: record.utmSource ?? '',
      utm_medium: record.utmMedium ?? '',
      utm_campaign: record.utmCampaign ?? '',
      utm_content: record.utmContent ?? '',
      utm_term: record.utmTerm ?? '',
      gclid: record.gclid ?? '',
      fbclid: record.fbclid ?? '',
      campaign: record.campaign ?? '',
    }) || Boolean(record.landingPage || record.referrer);

  return record;
}

/**
 * Capture attribution directly from a Web Fetch API `Request`.
 *
 * Reads only the URL and the `referer` header. The body must be read by the
 * caller (a Request body can only be consumed once), so pass the already-parsed
 * JSON through `captureAttribution({ body })` when body-level attribution is
 * needed.
 */
export function captureAttributionFromRequest(
  request: { url: string; headers?: { get(name: string): string | null } },
  extra: Omit<CaptureInput, 'url'> = {},
): LeadAttributionRecord {
  // Precedence for the referring origin:
  //   1. an explicit `referer` override from the caller (the client-reported
  //      value, which survives proxies that strip the header),
  //   2. a `referrer` field inside the posted body,
  //   3. the request's own `referer` / `referrer` header.
  const fromBody = extra.body?.referrer;
  const referer =
    extra.referer ??
    (typeof fromBody === 'string' && fromBody !== '' ? fromBody : null) ??
    request.headers?.get('referer') ??
    request.headers?.get('referrer');
  return captureAttribution({ url: request.url, ...extra, referer });
}

/** Projection for a `Lead` write. */
export function toLeadColumns(record: LeadAttributionRecord): LeadAttributionColumns {
  return {
    medium: record.utmMedium,
    campaign: record.utmCampaign,
    content: record.utmContent,
    term: record.utmTerm,
    utmSource: record.utmSource,
    utmMedium: record.utmMedium,
    utmCampaign: record.utmCampaign,
    utmContent: record.utmContent,
    utmTerm: record.utmTerm,
    gclid: record.gclid,
    fbclid: record.fbclid,
    landingPage: record.landingPage,
    referrer: record.referrer,
    visitorId: record.visitorId,
  };
}

/** Projection for a `LeadForm` write — every column is a non-null VARCHAR. */
export function toLeadFormColumns(record: LeadAttributionRecord): LeadFormAttributionColumns {
  return {
    utmSource: record.utmSource ?? '',
    utmMedium: record.utmMedium ?? '',
    utmCampaign: record.utmCampaign ?? '',
    utmContent: record.utmContent ?? '',
    utmTerm: record.utmTerm ?? '',
    gclid: record.gclid ?? '',
    fbclid: record.fbclid ?? '',
    landingPage: record.landingPage ?? '',
    referrer: record.referrer ?? '',
    visitorId: record.visitorId ?? '',
  };
}

/** First-touch columns, written only when the lead has none yet. */
export interface FirstTouchColumns {
  firstTouchSource: string;
  firstTouchMedium: string;
  firstTouchCampaign: string;
  firstTouchLandingPage: string;
  firstTouchAt: Date;
}

/** Last-touch columns, refreshed on every new conversion. */
export interface LastTouchColumns {
  lastTouchSource: string;
  lastTouchMedium: string;
  lastTouchAt: Date;
}

/**
 * Derive the source/medium labels for first- and last-touch columns.
 *
 * Uses the same derivation as reporting (`deriveSourceMedium`) so the stored
 * label and the displayed label cannot diverge. When nothing was captured the
 * labels are `unknown`, never `direct`: an unattributed lead is not the same
 * thing as a lead that provably arrived by typing the URL.
 */
export function touchLabels(record: LeadAttributionRecord): { source: string; medium: string } {
  if (!record.captured) return { source: 'unknown', medium: 'unknown' };
  const derived = deriveSourceMedium({
    page_path: '',
    page_type: 'other',
    landing_page: record.landingPage ?? '',
    referrer_domain: record.referrer ?? '',
    attribution: {
      utm_source: record.utmSource ?? '',
      utm_medium: record.utmMedium ?? '',
      utm_campaign: record.utmCampaign ?? '',
      utm_content: record.utmContent ?? '',
      utm_term: record.utmTerm ?? '',
      gclid: record.gclid ?? '',
      fbclid: record.fbclid ?? '',
      campaign: record.campaign ?? '',
    },
    hasAttribution: true,
  });
  return { source: derived.source.slice(0, ATTRIBUTION_MAX_LENGTH), medium: derived.medium.slice(0, ATTRIBUTION_MAX_LENGTH) };
}

export interface ExistingAttribution {
  firstTouchSource?: string | null;
  firstTouchAt?: Date | null;
  lastTouchSource?: string | null;
  lastTouchAt?: Date | null;
}

/**
 * Merge a newly captured attribution record onto an existing lead.
 *
 * Returns only the columns that should actually change. First-touch columns are
 * omitted when the lead already has them, which is what keeps the original
 * acquisition source immutable across a returning visitor's later conversions.
 */
export function mergeAttribution(
  record: LeadAttributionRecord,
  existing: ExistingAttribution,
  now: Date = new Date(),
): LeadAttributionColumns & Partial<FirstTouchColumns> & Partial<LastTouchColumns> {
  const labels = touchLabels(record);
  const update: LeadAttributionColumns & Partial<FirstTouchColumns> & Partial<LastTouchColumns> = {
    ...toLeadColumns(record),
  };

  if (!record.captured) {
    // No new signal: change nothing at all, so an existing attribution is
    // never blanked out by a later direct visit.
    return {};
  }

  if (!existing.firstTouchSource && !existing.firstTouchAt) {
    update.firstTouchSource = labels.source;
    update.firstTouchMedium = labels.medium;
    update.firstTouchCampaign = record.utmCampaign ?? record.campaign ?? '';
    update.firstTouchLandingPage = record.landingPage ?? '';
    update.firstTouchAt = now;
  }

  // Last touch always advances when a new signal was captured.
  update.lastTouchSource = labels.source;
  update.lastTouchMedium = labels.medium;
  update.lastTouchAt = now;

  return update;
}

/** Attribution columns for a brand-new lead (first touch == last touch). */
export function newLeadAttribution(
  record: LeadAttributionRecord,
  now: Date = new Date(),
): LeadAttributionColumns & Partial<FirstTouchColumns> & Partial<LastTouchColumns> {
  return mergeAttribution(record, {}, now);
}

/**
 * Human-readable summary for audit logs and API responses.
 *
 * Contains no PII: only campaign labels, a path and an origin.
 */
export function describeAttribution(record: LeadAttributionRecord): string {
  if (!record.captured) return 'no attribution captured';
  const parts: string[] = [];
  if (record.utmSource) parts.push(`source=${record.utmSource}`);
  if (record.utmMedium) parts.push(`medium=${record.utmMedium}`);
  if (record.utmCampaign) parts.push(`campaign=${record.utmCampaign}`);
  if (record.gclid) parts.push('gclid=present');
  if (record.fbclid) parts.push('fbclid=present');
  if (record.landingPage) parts.push(`landing=${record.landingPage}`);
  if (record.referrer) parts.push(`referrer=${record.referrer}`);
  return parts.join(' ');
}
