'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearAnalyticsIdentity } from '@/lib/analytics/visitor';
import {
  CONSENT_STORAGE_KEY,
  discardPendingEvents,
  flushPendingEvents,
  pushConsentCommand,
  readConsentState,
  recordWebsiteConsent,
  withdrawWebsiteConsent,
  writeConsentState,
  CONSENT_POLICY_VERSION,
  type AnalyticsConsentState,
} from '@/lib/analytics/client';

/**
 * Cookie Consent Manager (spec: Cookie Consent Manager, Google Consent Mode v2).
 *
 * Three equally-prominent choices: Accept All / Reject Optional Cookies /
 * Customize Preferences. Customize exposes the four categories — Strictly
 * Necessary (always on), Analytics, Marketing, Functional/Preferences.
 *
 * Behaviour contract:
 *   - Necessary storage (security/core operation) is always granted.
 *   - Analytics tags cannot carry data before `analytics_storage` is granted
 *     (the loader sets consent defaults to denied; events are held in-memory
 *     here until a grant). Marketing maps to ad_storage / ad_user_data /
 *     ad_personalization; Functional maps to personalization_storage.
 *   - Choices are applied to Google Consent Mode v2 immediately and persisted
 *     to the browser plus an append-only server-side audit record
 *     (`/api/cookie-consent`, WebsiteConsent table). Withdrawal is recorded, not
 *     silently discarded: `ConsentPreferenceLink` withdraws and re-opens the
 *     banner so the visitor can choose again.
 *   - Marketing communication consent is ALO's separate per-channel permission
 *     (marketing-consent service); this banner never grants or implies it.
 *   - The banner is not a page takeover: no dark overlay, no blocked content.
 */

const ALO_BLUE = '#0057B8';

const ALL_YES: AnalyticsConsentState = { analytics: true, advertising: true, functional: true, decided: true };
const ALL_NO: AnalyticsConsentState = { analytics: false, advertising: false, functional: false, decided: false };
const REJECTED: AnalyticsConsentState = { analytics: false, advertising: false, functional: false, decided: true };

export interface ConsentBannerProps {
  /** Privacy policy URL used in the banner copy. */
  privacyUrl?: string;
  /** Cookie policy URL used in the banner copy. */
  cookieUrl?: string;
}

export default function ConsentBanner({
  privacyUrl = '/privacy-policy',
  cookieUrl = '/cookies',
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);
  const [functionalOn, setFunctionalOn] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readConsentState();
    if (stored.decided) {
      pushConsentCommand('update', stored);
      if (stored.analytics) flushPendingEvents();
      return;
    }
    pushConsentCommand('default', ALL_NO);
    setVisible(true);
  }, []);

  // Withdrawal / re-open dispatched from the privacy page or footer link.
  useEffect(() => {
    function onRevoke() {
      writeConsentState(REJECTED);
      pushConsentCommand('update', REJECTED);
      discardPendingEvents();
      clearAnalyticsIdentity();
      setAnalyticsOn(false);
      setMarketingOn(false);
      setFunctionalOn(false);
      setRecordError(null);
      setCustomizing(false);
      setVisible(true);
    }
    window.addEventListener('alo:consent:revoke', onRevoke);
    function onStorage(event: StorageEvent) {
      if (event.key === CONSENT_STORAGE_KEY && !event.newValue) onRevoke();
    }
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('alo:consent:revoke', onRevoke);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const applyDecision = useCallback((state: AnalyticsConsentState) => {
    writeConsentState(state);
    pushConsentCommand('update', state);
    if (state.analytics) {
      flushPendingEvents();
    } else {
      discardPendingEvents();
      clearAnalyticsIdentity();
    }
    setRecordError(null);
    recordWebsiteConsent(state, 'cookie_banner').then((result) => {
      if (!result.ok) {
        // The client-side consent still applies (it drives Google tags); the
        // server-side audit row is best-effort. Surface the failure honestly
        // rather than pretending the audit trail was written.
        setRecordError('Your choice was applied on this device, but we could not save it to your record. Please try again later from the Privacy Policy page.');
      }
    });
    setVisible(false);
    setCustomizing(false);
  }, []);

  const saveCustomized = useCallback(() => {
    applyDecision({
      analytics: analyticsOn,
      advertising: marketingOn,
      functional: functionalOn,
      decided: true,
    });
  }, [analyticsOn, marketingOn, functionalOn, applyDecision]);

  if (!mounted || !visible) return null;

  if (customizing) {
    return (
      <div
        role="region"
        aria-label="Cookie preferences"
        className="fixed inset-x-0 bottom-0 z-[9998] border-t bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] sm:px-6"
        style={{ borderColor: 'var(--alo-border)' }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-[var(--alo-text)]">Customize cookie preferences</p>
            <button
              type="button"
              onClick={() => setCustomizing(false)}
              className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-3 py-2 text-sm font-semibold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"
            >
              Back
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--alo-text-muted)]">
            Necessary cookies can never be switched off. Your choices are recorded against an anonymous
            visitor token with the policy version — change or withdraw them any time from{' '}
            <a href={privacyUrl} className="underline" style={{ color: ALO_BLUE }}>Privacy Policy</a> or the footer link.
          </p>
          <fieldset className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--alo-border)] p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <input type="checkbox" checked readOnly disabled aria-checked="true" className="size-4" />
                Strictly Necessary
              </label>
              <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Security, load balancing, accessibility, fraud prevention. Always active.</p>
            </div>
            <div className="rounded-xl border border-[var(--alo-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <input type="checkbox" checked={analyticsOn} onChange={(e) => setAnalyticsOn(e.target.checked)} className="size-4" />
                Analytics
              </label>
              <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Anonymous usage measurement (Google Analytics 4) to improve the site. Never includes your name, documents or contact details.</p>
            </div>
            <div className="rounded-xl border border-[var(--alo-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <input type="checkbox" checked={marketingOn} onChange={(e) => setMarketingOn(e.target.checked)} className="size-4" />
                Marketing
              </label>
              <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Ad performance measurement. Off by default. Never grants permission for WhatsApp/SMS/email marketing.</p>
            </div>
            <div className="rounded-xl border border-[var(--alo-border)] p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <input type="checkbox" checked={functionalOn} onChange={(e) => setFunctionalOn(e.target.checked)} className="size-4" />
                Functional / Preferences
              </label>
              <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Remembers language and display preferences on this device.</p>
            </div>
          </fieldset>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveCustomized}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ALO_BLUE }}
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={() => applyDecision(ALL_YES)}
              className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => applyDecision(REJECTED)}
              className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"
            >
              Reject all optional
            </button>
            {recordError ? <span role="alert" className="text-xs text-crm-warning-text">{recordError}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[9998] border-t bg-white px-4 py-4 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] sm:px-6"
      style={{ borderColor: 'var(--alo-border)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-2 text-sm text-[var(--alo-body)]">
          <p className="font-semibold text-[var(--alo-text)]">We use cookies — your choice</p>
          <p className="leading-relaxed">
            Strictly necessary cookies keep this site secure and working. Optional analytics and marketing
            cookies help us understand what visitors find useful — only with your permission. You can change
            or withdraw any choice at any time. See our{' '}
            <a href={cookieUrl} className="underline" style={{ color: ALO_BLUE }}>Cookie Policy</a> and{' '}
            <a href={privacyUrl} className="underline" style={{ color: ALO_BLUE }}>Privacy Policy</a>.
            Consent is recorded anonymously (policy v{CONSENT_POLICY_VERSION}).
          </p>
          {recordError ? (
            <p role="alert" className="text-xs text-crm-warning-text">{recordError}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => applyDecision(REJECTED)}
            className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--alo-body)] transition-colors hover:bg-[var(--alo-page)]"
          >
            Reject Optional Cookies
          </button>
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="rounded-lg border border-[var(--alo-border-strong)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--alo-body)] transition-colors hover:bg-[var(--alo-page)]"
          >
            Customize Preferences
          </button>
          <button
            type="button"
            onClick={() => applyDecision(ALL_YES)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ALO_BLUE }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Re-opens the consent banner and records a full withdrawal when clicked.
 * Mount it in the footer and on the privacy page.
 */
export function ConsentPreferenceLink({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = useCallback(() => {
    writeConsentState(REJECTED);
    pushConsentCommand('update', REJECTED);
    discardPendingEvents();
    clearAnalyticsIdentity();
    // Append-only withdrawal record; fire-and-forget but surfaced in the console.
    withdrawWebsiteConsent().then((result) => {
      if (!result.ok) {
        console.error('[consent] withdrawal could not be recorded server-side:', result.error);
      }
    });
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
