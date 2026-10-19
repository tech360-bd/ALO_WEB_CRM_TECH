'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { buildPageContext, pageContextToEventParams } from '@/lib/analytics/page-context';
import { extractDetailSlug, pageViewEventsFor, type AnalyticsEventName } from '@/lib/analytics/events';

/**
 * Owns every `page_view` on the public site.
 *
 * The duplicate-page-view problem in a Next.js App Router site has two failure
 * modes, and this component is written to avoid both:
 *
 *   1. **Tag loader + manual emitter both fire.** Prevented by configuration:
 *      the gtag loader is started with `send_page_view: false`
 *      (`GoogleTags.tsx`), so this component is the only page-view source.
 *   2. **GTM owns the first view.** When the GTM container is the loader, its
 *      GA4 Configuration tag fires the initial `page_view` and that cannot be
 *      switched off from application code. So this component *skips the first
 *      view* in GTM mode and emits only for subsequent client-side navigations.
 *
 * The loader in use is published by `GoogleTags` on `window.aloAnalyticsContext`
 * rather than re-read from env, because the client bundle must not need the
 * server's configuration to agree with what was actually injected.
 *
 * Derived service events (`visa_page_view`, `ielts_page_view`) are emitted from
 * the route, not from each page component, so no page can forget them and no
 * page emits them twice.
 */

declare global {
  interface Window {
    aloAnalyticsContext?: {
      siteUrl: string;
      environment: string;
      consentMode: boolean;
      loader: 'gtm' | 'gtag';
    };
  }
}

export default function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Path + query of the last view this component emitted. */
  const lastEmitted = useRef<string>('');
  /** True once the first client render has been accounted for. */
  const firstRenderHandled = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const query = searchParams?.toString() ?? '';
    const href = `${pathname || '/'}${query ? `?${query}` : ''}`;
    if (href === lastEmitted.current) return;

    const context = window.aloAnalyticsContext;
    // No context means no tag loader was injected (development, or GA4/GTM not
    // configured). trackAnalyticsEvent would return `not_configured`, but there
    // is no reason to build the context object at all.
    if (!context) {
      lastEmitted.current = href;
      firstRenderHandled.current = true;
      return;
    }

    const isFirstView = !firstRenderHandled.current;
    firstRenderHandled.current = true;
    lastEmitted.current = href;

    // In GTM mode the container already fired the initial page_view.
    const skipPageView = isFirstView && context.loader === 'gtm';

    const pageContext = buildPageContext({
      href: `${window.location.origin}${href}`,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
    });
    const params: Record<string, string> = pageContextToEventParams(pageContext);

    // Attach the entity identity for detail pages. A view of a course is only
    // actionable if reporting can say WHICH course, and the slug is already
    // public information — it is in the URL Google indexed.
    const courseSlug = extractDetailSlug(pageContext.page_path, 'course');
    if (courseSlug) params.course_slug = courseSlug;
    const universitySlug = extractDetailSlug(pageContext.page_path, 'university');
    if (universitySlug) params.university_slug = universitySlug;
    const scholarshipSlug = extractDetailSlug(pageContext.page_path, 'scholarship');
    if (scholarshipSlug) params.scholarship_slug = scholarshipSlug;
    // A destination page IS the country dimension for reporting.
    if (pageContext.page_type === 'country') {
      const destination = decodeURIComponent(pageContext.page_path.split('/')[2] || '');
      if (destination) params.destination = destination.slice(0, 120);
    }

    if (!skipPageView) {
      trackAnalyticsEvent('page_view', params, { source: 'route' });
    }

    // Route-derived service events fire on every matching view, including the
    // first, because the tag loader never emits them.
    const derived: AnalyticsEventName[] = pageViewEventsFor(pageContext.page_path);
    for (const event of derived) {
      trackAnalyticsEvent(event, params, { source: 'route' });
    }
  }, [pathname, searchParams]);

  return null;
}
