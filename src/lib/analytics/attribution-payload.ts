/**
 * Client-side attribution payload for lead and application forms.
 *
 * A form POSTs to an API route, so the *request* URL the server sees is
 * `/api/leads`, not the page the visitor converted on. The server can recover
 * the landing page from the `referer` header (ALO sends
 * `strict-origin-when-cross-origin`, which transmits the full URL for
 * same-origin requests), but Referer can be stripped by a browser extension, a
 * proxy or a strict referrer policy on an inbound link.
 *
 * So the client states the landing page explicitly and the server treats it as
 * one of several inputs, in the precedence defined by `captureAttribution`.
 *
 * Only attribution keys leave the browser. This helper deliberately does not
 * serialise the form's own fields, and it caps every value so a crafted URL
 * cannot be used to smuggle a large payload through an attribution column.
 */

import { extractAttribution, hasAnyAttribution } from './page-context';
import { getAnalyticsIdentity } from './visitor';

/** Server-side bound; mirrored here so the client never sends an over-long value. */
const MAX_LENGTH = 191;

export interface AttributionPayload {
  landingPage: string;
  referrer: string;
  visitorId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  gclid: string;
  fbclid: string;
}

function cap(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LENGTH);
}

/**
 * Build the attribution payload for the current page.
 *
 * Returns `null` during SSR and when there is nothing to report, so callers can
 * spread the result without sending a block of empty strings.
 */
export function collectAttributionPayload(): AttributionPayload | null {
  if (typeof window === 'undefined') return null;

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return null;
  }

  const attribution = extractAttribution(url);
  const identity = getAnalyticsIdentity();
  const landingPage = cap(`${url.pathname}${url.search}`);
  // Only the referring origin is sent. A full referrer URL can carry another
  // site's query string, which may contain that site's user identifiers.
  const referrer = cap(document.referrer ? safeOrigin(document.referrer) : '');

  const hasSignal = hasAnyAttribution(attribution) || referrer !== '';
  if (!hasSignal && !identity.visitorId) return null;

  return {
    landingPage,
    referrer,
    visitorId: cap(identity.visitorId),
    utmSource: cap(attribution.utm_source),
    utmMedium: cap(attribution.utm_medium),
    utmCampaign: cap(attribution.utm_campaign),
    utmContent: cap(attribution.utm_content),
    utmTerm: cap(attribution.utm_term),
    gclid: cap(attribution.gclid),
    fbclid: cap(attribution.fbclid),
  };
}

/** Reduce a URL to its origin, returning '' when it cannot be parsed. */
function safeOrigin(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

/**
 * The landing page a multi-step form started on.
 *
 * An application form may navigate the visitor across SPA routes before it
 * submits; the attribution that matters is the one they ARRIVED with. Callers
 * capture this once on first render and pass it through to submission.
 */
export function rememberEntryAttribution(storageKey = 'alo.attribution.entry.v1'): AttributionPayload | null {
  if (typeof window === 'undefined') return null;
  const fresh = collectAttributionPayload();
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      const parsed = JSON.parse(existing) as AttributionPayload;
      // Refresh last-touch signals onto the remembered entry so a returning
      // visitor who arrived on a new campaign link is not attributed to the
      // stale one, while the original landing page is preserved separately.
      if (fresh && parsed.landingPage) {
        const hasFreshCampaignSignal = Boolean(
          fresh.utmSource ||
            fresh.utmMedium ||
            fresh.utmCampaign ||
            fresh.utmContent ||
            fresh.utmTerm ||
            fresh.gclid ||
            fresh.fbclid,
        );
        if (hasFreshCampaignSignal) {
          return {
            ...parsed,
            ...fresh,
            referrer: fresh.referrer || parsed.referrer,
            visitorId: fresh.visitorId || parsed.visitorId,
            landingPage: parsed.landingPage,
          };
        }
        return {
          ...parsed,
          visitorId: fresh.visitorId || parsed.visitorId,
        };
      }
      return parsed;
    }
    if (fresh) window.sessionStorage.setItem(storageKey, JSON.stringify(fresh));
  } catch {
    /* sessionStorage unavailable — fall back to the current page's values */
  }
  return fresh;
}

export const COURSE_FINDER_FUNNEL_STORAGE_KEY = 'alo.funnel.course_finder.v1';

export interface CourseFinderTouch {
  visitedAt: string;
  landingPage: string;
  subject: string;
  country: string;
  studyLevel: string;
}

/**
 * First-party Course Finder funnel touch (`UTM Landing -> Course Finder -> Lead`).
 *
 * Captures entry UTM attribution into both form and registration session keys
 * (`alo.attribution.entry.v1` and `alo.attribution.register.v1`) so a visitor
 * arriving on `/course-finder?utm_source=...` preserves their first-touch
 * campaign when they subsequently open `/apply`, `/student-register`, or a
 * consultation form. Stores strictly non-PII filter facets.
 */
export function recordCourseFinderTouch(facets?: {
  subject?: string;
  country?: string;
  studyLevel?: string;
}): CourseFinderTouch | null {
  if (typeof window === 'undefined') return null;

  const entry = rememberEntryAttribution('alo.attribution.entry.v1');
  rememberEntryAttribution('alo.attribution.apply.v1');
  rememberEntryAttribution('alo.attribution.register.v1');

  const touch: CourseFinderTouch = {
    visitedAt: new Date().toISOString(),
    landingPage: entry?.landingPage || cap(`${window.location.pathname}${window.location.search}`),
    subject: cap(facets?.subject || ''),
    country: cap(facets?.country || ''),
    studyLevel: cap(facets?.studyLevel || ''),
  };

  try {
    window.sessionStorage.setItem(COURSE_FINDER_FUNNEL_STORAGE_KEY, JSON.stringify(touch));
  } catch {
    /* sessionStorage unavailable */
  }
  return touch;
}

export function readCourseFinderTouch(): CourseFinderTouch | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(COURSE_FINDER_FUNNEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CourseFinderTouch>;
    if (!parsed || typeof parsed.visitedAt !== 'string') return null;
    return {
      visitedAt: cap(parsed.visitedAt),
      landingPage: cap(parsed.landingPage || ''),
      subject: cap(parsed.subject || ''),
      country: cap(parsed.country || ''),
      studyLevel: cap(parsed.studyLevel || ''),
    };
  } catch {
    return null;
  }
}

