"use client";

import { useEffect, useRef } from "react";
import {
  captureUtmParams,
  generateSessionId,
  isDoNotTrack,
  trackEvent,
} from "@/lib/analytics";

/**
 * AnalyticsInit
 * -------------
 * Client-only mount-once component that wires up the privacy-friendly
 * first-party analytics for the page. Mounted once in the layout
 * (or page.tsx) — never re-mounts during in-app navigation.
 *
 * Responsibilities:
 *   1. On mount: capture UTM params, generate/refresh the daily
 *      session ID, send the initial `page_view` event.
 *   2. On `hashchange`: send another `page_view` with the new anchor
 *      (so single-page anchor navigation is tracked).
 *   3. Track scroll-depth milestones (25/50/75/100%) — fire each
 *      `scroll_depth` event at most once per page lifecycle.
 *   4. Track outbound clicks (anchor hrefs to a different host) →
 *      `outbound_click`.
 *   5. Track CTA button clicks (elements with `data-analytics="cta-click"`)
 *      → `cta_click` (carries the `data-cta` label in `meta.cta`).
 *
 * Everything is fire-and-forget. `trackEvent` uses `sendBeacon` when
 * available so events survive page unload.
 *
 * PRIVACY: The whole module is a no-op when the visitor has enabled
 * Do Not Track — we check `isDoNotTrack()` in `trackEvent` itself,
 * but we also early-return from every listener below to avoid
 * registering observers that would never emit anything useful.
 */
export function AnalyticsInit() {
  // Track which scroll milestones have already been sent so each fires
  // at most once per page lifecycle.
  const sentMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // ── DNT short-circuit ───────────────────────────────────────────
    if (isDoNotTrack()) return;

    // Capture the current milestone Set so cleanup operates on the same
    // instance even if the ref is replaced later (silences the ESLint
    // react-hooks/exhaustive-deps ref-value warning).
    const sentMilestones = sentMilestonesRef.current;

    // ── 1. Initial page view ────────────────────────────────────────
    // Capture UTM params from the URL into sessionStorage (preserves
    // first-touch UTM across in-page navigation) and generate/refresh
    // the daily session ID before sending the first event.
    captureUtmParams();
    generateSessionId();

    trackEvent("page_view", {
      entryType: "initial",
    });

    // ── 2. Hash-change page views ───────────────────────────────────
    // The site is a single-page app where navigation is done via
    // #anchor links — `popstate` doesn't fire for those, but
    // `hashchange` does.
    const handleHashChange = () => {
      trackEvent("page_view", { entryType: "hashchange" });
    };
    window.addEventListener("hashchange", handleHashChange, { passive: true });

    // ── 3. Scroll-depth milestones ──────────────────────────────────
    // Compute the maximum scroll percentage on a throttled scroll
    // handler, and emit `scroll_depth` the first time the visitor
    // crosses each of 25 / 50 / 75 / 100 %.
    const MILESTONES = [25, 50, 75, 100];
    let ticking = false;

    const computeScrollPercent = (): number => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
      const scrollHeight =
        (doc.scrollHeight || document.body.scrollHeight || 0) -
        doc.clientHeight;
      if (scrollHeight <= 0) return 100;
      return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        if (isDoNotTrack()) return;
        const pct = computeScrollPercent();
        for (const m of MILESTONES) {
          if (pct >= m && !sentMilestonesRef.current.has(m)) {
            sentMilestonesRef.current.add(m);
            trackEvent("scroll_depth", { depth: m });
          }
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ── 4. Outbound + CTA click tracking ────────────────────────────
    // Single delegated listener on document — fires for every click,
    // but we filter to anchor tags with an external host (outbound)
    // and to elements with `data-analytics="cta-click"` (CTA).
    const handleClick = (event: MouseEvent) => {
      if (isDoNotTrack()) return;
      const target = event.target as Element | null;
      if (!target) return;

      // Walk up to the nearest anchor / element with data-analytics.
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      const ctaEl = target.closest('[data-analytics="cta-click"]') as
        | HTMLElement
        | null;

      // Outbound click → external host link
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href) {
          let isExternal = false;
          let host = "";
          try {
            // mailto: / tel: / sms: → treat as internal (no host).
            if (/^https?:\/\//i.test(href)) {
              const u = new URL(href, window.location.href);
              host = u.hostname;
              isExternal =
                host !== window.location.hostname &&
                host !== "localhost" &&
                host !== "127.0.0.1";
            }
          } catch {
            // malformed href — skip
          }
          if (isExternal && host) {
            trackEvent("outbound_click", { host, href: stripToOriginPath(href) });
          }
        }
      }

      // CTA click — element (or ancestor) with data-analytics="cta-click"
      if (ctaEl) {
        const cta = ctaEl.getAttribute("data-cta") || undefined;
        const label = ctaEl.getAttribute("data-cta-label") || undefined;
        trackEvent("cta_click", { cta, label });
      }
    };
    document.addEventListener("click", handleClick, { passive: true });

    // ── Cleanup ─────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      // Reset milestone set on unmount so a remount (e.g. after a
      // full-page reload from dev HMR) starts fresh.
      sentMilestones.clear();
    };
  }, []);

  // This component renders nothing — it's purely a side-effect mount.
  return null;
}

/**
 * Reduce an absolute URL to origin+path so we don't persist any
 * query string (which could contain personal data from the
 * destination site).
 */
function stripToOriginPath(href: string): string {
  try {
    const u = new URL(href, window.location.href);
    return u.origin + u.pathname;
  } catch {
    return href;
  }
}
