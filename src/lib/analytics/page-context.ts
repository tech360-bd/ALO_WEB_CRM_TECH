/**
 * Page context extraction for analytics + lead attribution.
 *
 * One module reads the browser URL so that the analytics page-view emitter and
 * the lead-attribution capture derive `utm_*`, `gclid`, `fbclid`, landing page
 * and referrer in exactly the same way. Divergent parsers are how attribution
 * silently disagrees with the analytics platform.
 *
 * Every function here takes an explicit `URL`/string argument and returns plain
 * data, so the whole module is unit-testable without a DOM.
 */

import { detectPageType, referrerDomain, type PageType } from './events';

export interface AttributionParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  /** The `campaign` shorthand Google Ads / GA4 also accept. */
  campaign: string;
}

export interface PageContext {
  page_path: string;
  page_type: PageType;
  landing_page: string;
  referrer_domain: string;
  attribution: AttributionParams;
  /** True when the URL carried any attribution parameter at all. */
  hasAttribution: boolean;
}

/** Query-string keys ALO recognises as attribution, in canonical output order. */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Maximum stored length — attribution values are short labels, not payloads. */
const MAX_VALUE_LENGTH = 200;

function sanitizeValue(raw: string | null): string {
  if (!raw) return '';
  // Strip control characters and trim. Never store an unbounded string:
  // attribution columns are VARCHAR-sized and a hostile URL should not be able
  // to inflate them.
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, MAX_VALUE_LENGTH);
}

/**
 * Read attribution parameters from a URL's query string.
 *
 * Accepts the canonical `utm_*` spelling plus the bare `source` / `medium` /
 * `campaign` / `content` / `term` aliases that Google Ads autotagging and some
 * ALO landing-page links use. Canonical `utm_*` wins over an alias.
 */
export function extractAttribution(url: URL | string): AttributionParams {
  let search: URLSearchParams;
  try {
    search = typeof url === 'string' ? new URL(url, 'https://aloeducation.com').searchParams : url.searchParams;
  } catch {
    return emptyAttribution();
  }

  const pick = (canonical: string, aliases: string[]): string => {
    const direct = sanitizeValue(search.get(canonical));
    if (direct) return direct;
    for (const alias of aliases) {
      const value = sanitizeValue(search.get(alias));
      if (value) return value;
    }
    return '';
  };

  return {
    utm_source: pick('utm_source', ['source', 'utmSource']),
    utm_medium: pick('utm_medium', ['medium', 'utmMedium']),
    utm_campaign: pick('utm_campaign', ['campaign_id', 'campaignName', 'utmCampaign']),
    utm_content: pick('utm_content', ['content', 'utmContent']),
    utm_term: pick('utm_term', ['term', 'keyword', 'utmTerm']),
    gclid: sanitizeValue(search.get('gclid')),
    fbclid: sanitizeValue(search.get('fbclid')),
    campaign: pick('campaign', ['utm_campaign', 'campaignName']),
  };
}

export function emptyAttribution(): AttributionParams {
  return {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    gclid: '',
    fbclid: '',
    campaign: '',
  };
}

/** True when at least one attribution parameter is populated. */
export function hasAnyAttribution(attribution: AttributionParams): boolean {
  return Object.values(attribution).some((value) => value !== '');
}

/**
 * Build the full page context for a URL.
 *
 * `landingPage` is the path *with* its attribution query string, because a
 * landing page is only meaningful together with the campaign that produced it.
 * `pagePath` is the bare path used for `page_type` classification.
 */
export function buildPageContext(options: {
  href: URL | string;
  referrer?: string | null;
}): PageContext {
  let url: URL;
  try {
    url = typeof options.href === 'string' ? new URL(options.href, 'https://aloeducation.com') : options.href;
  } catch {
    url = new URL('https://aloeducation.com/');
  }
  const pagePath = url.pathname || '/';
  const attribution = extractAttribution(url);
  const search = url.search || '';
  return {
    page_path: pagePath,
    page_type: detectPageType(pagePath),
    landing_page: sanitizeValue(`${pagePath}${search}`),
    referrer_domain: referrerDomain(options.referrer),
    attribution,
    hasAttribution: hasAnyAttribution(attribution),
  };
}

/** Flatten a page context into analytics-safe parameters. */
export function pageContextToEventParams(context: PageContext): Record<string, string> {
  const params: Record<string, string> = {
    page_path: context.page_path,
    page_type: context.page_type,
    landing_page: context.landing_page,
  };
  if (context.referrer_domain) params.referrer_domain = context.referrer_domain;
  for (const [key, value] of Object.entries(context.attribution)) {
    if (value) params[key] = value;
  }
  return params;
}

/**
 * Derive the human-readable `source` / `medium` pair stored on a lead.
 *
 * Falls back to a referrer-domain-derived source when no UTM is present, and to
 * `direct` when there is nothing at all. Never invents a campaign.
 */
export function deriveSourceMedium(context: PageContext): { source: string; medium: string } {
  if (context.attribution.gclid) {
    return {
      source: context.attribution.utm_source || 'google',
      medium: context.attribution.utm_medium || 'cpc',
    };
  }
  if (context.attribution.fbclid) {
    return {
      source: context.attribution.utm_source || 'facebook',
      medium: context.attribution.utm_medium || 'social',
    };
  }
  if (context.attribution.utm_source) {
    return {
      source: context.attribution.utm_source,
      medium: context.attribution.utm_medium || 'referral',
    };
  }
  if (context.referrer_domain) {
    // A known search engine referrer with no UTM is organic traffic.
    if (/^(?:www\.)?(?:google|bing|yahoo|duckduckgo|yandex|baidu)\./i.test(context.referrer_domain)) {
      return { source: context.referrer_domain.replace(/^www\./i, ''), medium: 'organic' };
    }
    return { source: context.referrer_domain, medium: 'referral' };
  }
  return { source: 'direct', medium: 'none' };
}
