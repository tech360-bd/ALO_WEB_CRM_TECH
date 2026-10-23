'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearAnalyticsIdentity } from '@/lib/analytics/visitor';
import {
  CONSENT_STORAGE_KEY,
  discardPendingEvents,
  flushPendingEvents,
  pushConsentCommand,
  readConsentState,
  writeConsentState,
  type AnalyticsConsentState,
} from '@/lib/analytics/client';

/**
 * Analytics consent banner (Consent Mode v2).
 *
 * Behaviour contract:
 *
 *   - Nothing is sent to Google until the visitor chooses. The tag loader sets
 *     every consent type to `denied` before any tag fires
 *     (`GoogleTags.tsx`), and `trackAnalyticsEvent` additionally holds events in
 *     a bounded in-memory queue while consent is undecided.
 *   - A previously made choice is read from `localStorage` and re-applied with
 *     `gtag('consent','update', …)` on mount, so returning visitors are not
 *     asked twice and no event is lost while the stored decision is applied.
 *   - **Accept** grants analytics (and advertising only if the operator has
 *     configured an ad tag) and flushes the held queue.
 *   - **Reject** denies everything and *discards* the held queue — rejected
 *     events are never sent later.
 *   - The choice is revocable from `/privacy` and from the footer link, which
 *     clears `localStorage[alo.analytics.consent.v1]` and re-opens the banner.
 *
 * This is analytics consent only. It is deliberately separate from ALO's
 * marketing communication consent (`src/lib/marketing-consent.ts`), which is a
 * per-student, per-channel, recorded decision stored in the CRM and required
 * before WhatsApp/SMS/email outreach. Granting analytics consent does not grant
 * marketing consent, and the banner never claims otherwise.
 */

const ALO_BLUE = '#0057B8';

const DENIED: AnalyticsConsentState = { analytics: false, advertising: false, decided: false };

export interface ConsentBannerProps {
  /**
   * When true an advertising-consent toggle is shown. Left off by default
   * because ALO runs no remarketing tag today; the toggle exists so that an
   * approved Google Ads or Meta tag can be added in GTM without changing this
   * component's privacy posture silently.
   */
  showAdvertisingChoice?: boolean;
  /** Privacy policy URL used in the banner copy. */
  privacyUrl?: string;
}

export default function ConsentBanner({
  showAdvertisingChoice = false,
  privacyUrl = '/privacy-policy',
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount-time: apply a stored decision, or ask. `mounted` prevents a
  // hydration mismatch, because localStorage is not readable during SSR.
  useEffect(() => {
    setMounted(true);
    const stored = readConsentState();
    if (stored.decided) {
      pushConsentCommand('update', stored);
      if (stored.analytics) flushPendingEvents();
      return;
    }
    // No stored decision: tags are already running with consent denied. Ask.
    pushConsentCommand('default', DENIED);
    setVisible(true);
  }, []);

  // Listen for a revocation dispatched from the privacy page / footer link.
  useEffect(() => {
    function onRevoke() {
      writeConsentState(DENIED);
      pushConsentCommand('update', DENIED);
      discardPendingEvents();
      setAdvertising(false);
      setVisible(true);
    }
    window.addEventListener('alo:consent:revoke', onRevoke);
    // Also react to a raw storage clear (e.g. from another tab).
    function onStorage(event: StorageEvent) {
      if (event.key === CONSENT_STORAGE_KEY && !event.newValue) onRevoke();
    }
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('alo:consent:revoke', onRevoke);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const decide = useCallback(
    (analytics: boolean, ads: boolean) => {
      const state: AnalyticsConsentState = { analytics, advertising: ads, decided: true };
      writeConsentState(state);
      pushConsentCommand('update', state);
      if (analytics) {
        flushPendingEvents();
      } else {
        // Refusing consent also drops the anonymous visitor/session tokens, so
        // nothing that could be correlated across visits survives a refusal.
        discardPendingEvents();
        clearAnalyticsIdentity();
      }
      setVisible(false);
    },
    [],
  );

  if (!mounted || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-[9998] border-t bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] sm:px-6"
      style={{ borderColor: 'var(--alo-border)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-2 text-sm text-[var(--alo-body)]">
          <p className="font-semibold text-[var(--alo-text)]">We would like to measure how this site is used</p>
          <p className="leading-relaxed">
            With your permission we use Google Analytics to understand which pages, courses and
            universities visitors find useful. This uses cookies and does <strong>not</strong> include
            your name, email, phone number, passport or national ID, application documents, payment
            details or any private student record — those stay inside ALO&rsquo;s own system. You can
            change your mind at any time from our{' '}
            <a href={privacyUrl} className="underline" style={{ color: ALO_BLUE }}>
              privacy policy
            </a>
            .
          </p>
          {showAdvertisingChoice ? (
            <label className="flex items-center gap-2 pt-1 text-[var(--alo-body)]">
              <input
                type="checkbox"
                checked={advertising}
                onChange={(event) => setAdvertising(event.target.checked)}
                className="size-4 rounded border-[var(--alo-border-strong)]"
              />
              <span>Also allow advertising measurement (off by default)</span>
            </label>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => decide(false, false)}
            className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--alo-body)] transition-colors hover:bg-[var(--alo-page)]"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide(true, advertising)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ALO_BLUE }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Small link that re-opens the consent banner. Mount it in the footer and on
 * the privacy page so the choice stays revocable after the banner disappears.
 */
export function ConsentPreferenceLink({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = useCallback(() => {
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      /* storage unavailable — the banner still re-opens for this page view */
    }
    writeConsentState(DENIED);
    pushConsentCommand('update', DENIED);
    discardPendingEvents();
    clearAnalyticsIdentity();
    window.dispatchEvent(new CustomEvent('alo:consent:revoke'));
  }, []);

  if (!mounted) {
    // Reserve the space so the footer does not shift when hydration completes.
    return <span className={className} aria-hidden="true" />;
  }
  return (
    <button type="button" onClick={open} className={className}>
      Cookie &amp; analytics preferences
    </button>
  );
}
