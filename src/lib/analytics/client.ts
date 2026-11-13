'use client';

/**
 * Client-side analytics bridge to GTM / GA4.
 *
 * Design rules this file enforces:
 *
 *   - **One queue, no tag ownership.** This module only ever pushes to
 *     `window.dataLayer`. It never loads a second copy of gtag.js and never
 *     calls `gtag('config', …)`, so it cannot duplicate the `page_view` that
 *     the tag loader (GTM container or gtag.js) already fires.
 *   - **Closed vocabulary.** `trackAnalyticsEvent` rejects any event name that
 *     is not in `ANALYTICS_EVENT_NAMES`.
 *   - **PII screened before the push**, not after.
 *   - **Silent no-op when nothing is configured.** Analytics must never break
 *     the website: if no tag loader is present, every call resolves
 *     immediately and reports `not_configured`.
 *   - **Consent respected.** When consent mode is active and the visitor has
 *     not granted `analytics_storage`, events are queued in memory and flushed
 *     only if consent is later granted; otherwise they are discarded. Google's
 *     consent mode would also hold them, but not queueing at all avoids any
 *     chance of a beacon leaving the browser before a choice is made.
 */

import {
  isAllowedEventName,
  scrubEventParams,
  type AnalyticsEventName,
  type AnalyticsEventParams,
} from './events';

/** Consent state persisted for the visitor. */
export interface AnalyticsConsentState {
  /** Analytics storage (cookies / local identifiers). */
  analytics: boolean;
  /** Ad personalisation / advertising storage. */
  advertising: boolean;
  /** True once the visitor has made an explicit choice. */
  decided: boolean;
}

export const CONSENT_STORAGE_KEY = 'alo.analytics.consent.v1';

type DataLayerEntry = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    gtag?: (...args: unknown[]) => void;
    google_tag_manager?: Record<string, unknown>;
  }
}

function getDataLayer(): DataLayerEntry[] | null {
  if (typeof window === 'undefined') return null;
  if (!Array.isArray(window.dataLayer)) return null;
  return window.dataLayer;
}

/** True when a tag loader (GTM container or gtag.js) is present on the page. */
export function isAnalyticsReady(): boolean {
  if (typeof window === 'undefined') return false;
  const dataLayer = getDataLayer();
  if (!dataLayer) return false;
  // GTM sets google_tag_manager[containerId]; gtag.js leaves a function on window.
  return Boolean(window.google_tag_manager) || typeof window.gtag === 'function' || dataLayer.length > 0;
}

export function readConsentState(): AnalyticsConsentState {
  const fallback: AnalyticsConsentState = { analytics: false, advertising: false, decided: false };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AnalyticsConsentState>;
    return {
      analytics: parsed.analytics === true,
      advertising: parsed.advertising === true,
      decided: parsed.decided === true,
    };
  } catch {
    return fallback;
  }
}

export function writeConsentState(state: AnalyticsConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage disabled — consent simply is not remembered */
  }
}

/**
 * Push a `gtag('consent', …)` command. Written as a dataLayer entry rather than
 * a direct `gtag()` call so it is queued correctly even before the tag script
 * has finished loading.
 */
export function pushConsentCommand(mode: 'default' | 'update', state: AnalyticsConsentState): void {
  const dataLayer = getDataLayer();
  if (!dataLayer) return;
  dataLayer.push({
    // gtag.js and GTM's Google tag both consume this shape: the `consent`
    // command is read from the pushed object, and the `event` name lets a GTM
    // trigger react to the change.
    event: 'consent_' + mode,
    consent: [
      mode,
      {
        ad_storage: state.advertising ? 'granted' : 'denied',
        ad_user_data: state.advertising ? 'granted' : 'denied',
        ad_personalization: state.advertising ? 'granted' : 'denied',
        analytics_storage: state.analytics ? 'granted' : 'denied',
        // ALO serves Bangladesh, the UK, the EU and Australia; region-specific
        // behaviour is left to Google's defaults rather than hard-coded here.
        functionality_storage: 'granted',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: mode === 'default' ? 500 : undefined,
      },
    ],
  });
}

/** Events held back while consent is undecided or denied. Bounded. */
const pendingQueue: { name: AnalyticsEventName; params: Record<string, string | number | boolean> }[] = [];
const PENDING_LIMIT = 50;

export type TrackResult =
  | { status: 'sent'; event: AnalyticsEventName }
  | { status: 'not_configured'; event: AnalyticsEventName }
  | { status: 'held_for_consent'; event: AnalyticsEventName }
  | { status: 'rejected'; event: string; reason: string }
  | { status: 'unavailable'; event: string; reason: string };

export interface TrackOptions {
  /** Send even when analytics consent has not been granted. Default false. */
  ignoreConsent?: boolean;
  /** Emitted as `event_source` alongside the event, for funnel debugging. */
  source?: string;
}

/**
 * Emit one analytics event.
 *
 * Safe to call unconditionally from any component: when no tag loader is
 * configured the call is a no-op that reports `not_configured`, which is the
 * honest status rather than a fabricated success.
 */
export function trackAnalyticsEvent(
  eventName: string,
  params?: AnalyticsEventParams | Record<string, unknown> | null,
  options: TrackOptions = {},
): TrackResult {
  if (typeof window === 'undefined') {
    return { status: 'unavailable', event: eventName, reason: 'server side — use the Measurement Protocol client' };
  }
  if (!isAllowedEventName(eventName)) {
    return {
      status: 'rejected',
      event: eventName,
      reason: `"${eventName}" is not in the ALO analytics event catalogue (src/lib/analytics/events.ts). Add it there deliberately rather than emitting an uncontrolled name.`,
    };
  }

  const scrubbed = scrubEventParams(eventName, params as Record<string, unknown> | null);
  const payload: Record<string, string | number | boolean> = { ...scrubbed.params };
  if (options.source) payload.event_source = String(options.source).slice(0, 100);

  const dataLayer = getDataLayer();
  if (!dataLayer) {
    // No dataLayer means the tag loader was never injected — GA4/GTM is not
    // configured for this environment. This is the expected state in
    // development and must never be reported as a success.
    return { status: 'not_configured', event: eventName };
  }

  const consent = readConsentState();
  if (!options.ignoreConsent && !consent.analytics) {
    if (pendingQueue.length < PENDING_LIMIT) pendingQueue.push({ name: eventName, params: payload });
    return { status: 'held_for_consent', event: eventName };
  }

  dataLayer.push({ event: eventName, ...payload });
  return { status: 'sent', event: eventName };
}

/**
 * Flush events that were held while consent was undecided. Called once the
 * visitor grants analytics consent. Events held while consent was *denied* are
 * discarded, not sent.
 */
export function flushPendingEvents(): number {
  const dataLayer = getDataLayer();
  if (!dataLayer) {
    pendingQueue.length = 0;
    return 0;
  }
  const consent = readConsentState();
  const queued = pendingQueue.splice(0, pendingQueue.length);
  if (!consent.analytics) return 0;
  for (const entry of queued) {
    dataLayer.push({ event: entry.name, ...entry.params });
  }
  return queued.length;
}

/** Discard held events (visitor denied consent). */
export function discardPendingEvents(): number {
  const count = pendingQueue.length;
  pendingQueue.length = 0;
  return count;
}

/** Number of events currently held awaiting a consent decision. */
export function pendingEventCount(): number {
  return pendingQueue.length;
}
