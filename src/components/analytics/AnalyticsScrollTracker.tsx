'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { detectPageType } from '@/lib/analytics/events';

/**
 * Scroll-depth measurement — the `page_scroll` event required by the analytics
 * specification.
 *
 * Design decisions, all of which exist to keep this from becoming the classic
 * scroll-tracking bug:
 *
 *   - **Milestones, not every pixel.** Four thresholds (25 / 50 / 75 / 90) are
 *     emitted once each per page view. A listener that fires per scroll event
 *     would send hundreds of hits per visit and cost the property its quota for
 *     no additional insight.
 *   - **Once per milestone per path.** A `Set` is reset on navigation, so
 *     scrolling back up and down again does not re-report. The milestone set is
 *     keyed on the pathname, not the query string, so a filter change on the same
 *     page does not double-count.
 *   - **rAF-throttled, passive listener.** The scroll handler is coalesced to one
 *     measurement per frame and registered `{ passive: true }`, so it cannot block
 *     scrolling on a low-end Android device — the majority of ALO's traffic.
 *   - **Never a dependency.** If the tag loader is absent (development, or GA4
 *     unconfigured) `trackAnalyticsEvent` returns `not_configured` and nothing is
 *     sent. If consent has not been granted, the event is held by the shared
 *     client and discarded on refusal.
 *   - **Not measured where it is meaningless.** Nothing is emitted when the
 *     document is not taller than the viewport (a page that fits on one screen is
 *     "100% scrolled" on arrival, which would otherwise make every short page look
 *     perfectly engaged) and nothing is emitted in print or `prefers-reduced-*`
 *     contexts that never scroll.
 */

/** Depth milestones, in percent of the *scrollable* distance. */
export const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

/**
 * Compute how far down the scrollable region the visitor is.
 *
 * Pure and exported so the arithmetic is unit-tested rather than trusted.
 * Returns 0 when the document cannot scroll, which the caller treats as "no
 * measurement" rather than "100% read".
 */
export function scrollPercent(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const scrollable = scrollHeight - clientHeight;
  if (!Number.isFinite(scrollable) || scrollable <= 0) return 0;
  const raw = (scrollTop / scrollable) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Milestones reached at (or below) a given depth, in ascending order. */
export function milestonesReached(percent: number): number[] {
  return SCROLL_MILESTONES.filter((milestone) => percent >= milestone);
}

export default function AnalyticsScrollTracker() {
  const pathname = usePathname();
  /** Milestones already emitted for the current path. */
  const emitted = useRef<Set<number>>(new Set());
  /** Pending frame handle, so bursts of scroll events cost one measurement. */
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // New page view → its own milestone set.
    emitted.current = new Set<number>();

    const finalize = () => {
      frame.current = null;
      const doc = document.documentElement;
      // Respect a visitor who has asked for reduced motion: they are not
      // necessarily not scrolling, but a scroll-driven measurement loop is
      // exactly the kind of thing that setting is meant to suppress.
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      const percent = scrollPercent(window.scrollY || doc.scrollTop || 0, doc.scrollHeight, window.innerHeight);
      if (percent <= 0) return;

      const pageType = detectPageType(pathname || '/');
      for (const milestone of milestonesReached(percent)) {
        if (emitted.current.has(milestone)) continue;
        emitted.current.add(milestone);
        trackAnalyticsEvent(
          'page_scroll',
          {
            scroll_depth_percent: milestone,
            page_path: pathname || '/',
            page_type: pageType,
          },
          { source: 'scroll' },
        );
      }
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(finalize);
    };

    // A viewport resize can move the goalposts: a page that could not scroll at
    // load may become scrollable when the window is narrowed.
    const onResize = () => {
      emitted.current = new Set<number>();
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [pathname]);

  return null;
}
