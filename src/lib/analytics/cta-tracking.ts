/**
 * Non-blocking CTA analytics on top of the existing behavior-tracking endpoint
 * (POST /api/behavior/track, a public write route).
 *
 * Rules:
 *   • Analytics must never block or delay navigation. Callers do not
 *     preventDefault(); this sends with sendBeacon (or keepalive fetch) and
 *     swallows every error.
 *   • Only non-personal fields are sent: the event name, the CTA location and
 *     the URL pathname. Query strings are dropped so tokens cannot leak.
 *   • The visitor ID is random and lives only in memory for the current page
 *     load. Nothing is written to cookies or localStorage, so there is no
 *     cross-visit identifier.
 */

import { ENGLISH_EXAM_CTA_EVENT, type EnglishExamCtaLocation } from '@/lib/english-exam';

export const BEHAVIOR_TRACK_ENDPOINT = '/api/behavior/track';

export interface CtaEventPayload {
  visitorId: string;
  eventType: string;
  pageUrl: string;
  eventData: { location: EnglishExamCtaLocation; destination: 'english_test_platform' };
}

/** Transport returns true when the request was queued/sent. */
export type CtaTransport = (url: string, body: string) => boolean;

let pageLoadVisitorId: string | null = null;

function getPageLoadVisitorId(): string {
  if (pageLoadVisitorId) return pageLoadVisitorId;
  const randomUUID = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
    : null;
  pageLoadVisitorId = randomUUID
    ? randomUUID()
    : `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  return pageLoadVisitorId;
}

export function buildEnglishExamCtaPayload(
  location: EnglishExamCtaLocation,
  pathname: string,
  visitorId: string = getPageLoadVisitorId(),
): CtaEventPayload {
  // Keep only the path; drop query strings and fragments.
  const safePath = (pathname || '/').split('?')[0].split('#')[0] || '/';
  return {
    visitorId,
    eventType: ENGLISH_EXAM_CTA_EVENT,
    pageUrl: safePath,
    eventData: { location, destination: 'english_test_platform' },
  };
}

function defaultTransport(url: string, body: string): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const queued = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    if (queued) return true;
  }
  if (typeof fetch === 'function') {
    // keepalive lets the request complete even though the page is navigating away.
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => undefined);
    return true;
  }
  return false;
}

/** Sends the event. Never throws and never returns a promise to await. */
export function sendCtaEvent(payload: CtaEventPayload, transport: CtaTransport = defaultTransport): boolean {
  try {
    return transport(BEHAVIOR_TRACK_ENDPOINT, JSON.stringify(payload));
  } catch {
    return false;
  }
}

/** Fire-and-forget click tracking for the English Test CTA. */
export function trackEnglishExamCtaClick(location: EnglishExamCtaLocation): void {
  if (typeof window === 'undefined') return;
  try {
    sendCtaEvent(buildEnglishExamCtaPayload(location, window.location.pathname));
  } catch {
    // Analytics must never block navigation.
  }
}
