'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { detectPageType } from '@/lib/analytics/events';

/**
 * Site-wide contact-click measurement by event delegation.
 *
 * ALO has WhatsApp, `tel:` and `mailto:` links in the floating action widget,
 * the header, the footer, every country page, every course page and the contact
 * page. Instrumenting each of them individually would mean editing dozens of
 * components, and every new page would silently go unmeasured until someone
 * remembered. Instead this component attaches ONE capture-phase listener to the
 * document and classifies whatever was clicked.
 *
 * This is the same technique a GTM "Click – Just Links" trigger uses, so if the
 * operator later configures click triggers inside the GTM container these events
 * would be duplicated. `CONTACT_CLICK_SOURCE` is emitted with every event for
 * exactly that reason, and the duplication check is documented in
 * docs/GOOGLE-FREE-STACK.md — configure click triggers in GTM **or** rely on
 * this component, not both.
 *
 * Only the link's scheme and target host are reported. A `wa.me` URL's `text=`
 * query parameter is deliberately not sent: pre-filled messages can contain a
 * visitor's own words, which are personal data.
 */

/** Emitted with every event so a GTM-side duplicate is detectable in reporting. */
const CONTACT_CLICK_SOURCE = 'alo-delegated-click';

interface ClickClassification {
  event: 'whatsapp_click' | 'phone_click' | 'email_click';
  /** Non-identifying descriptor of the target. */
  target: string;
}

/**
 * Classify an anchor href.
 *
 * Exported for unit testing: the whole point of this component is that its
 * matching rules are deterministic and reviewable.
 */
export function classifyContactHref(href: string | null | undefined): ClickClassification | null {
  if (!href) return null;
  const value = href.trim().toLowerCase();
  if (value === '' || value.startsWith('#') || value.startsWith('javascript:')) return null;

  if (value.startsWith('tel:')) {
    return { event: 'phone_click', target: 'tel' };
  }
  if (value.startsWith('mailto:')) {
    return { event: 'email_click', target: 'mailto' };
  }
  if (value.startsWith('sms:')) {
    return { event: 'phone_click', target: 'sms' };
  }
  // WhatsApp: the wa.me short link, the api.whatsapp.com endpoint and the
  // web/desktop clients. Query strings are ignored entirely.
  if (
    value.startsWith('https://wa.me/') ||
    value.startsWith('http://wa.me/') ||
    value.includes('api.whatsapp.com') ||
    value.includes('web.whatsapp.com') ||
    value.includes('chat.whatsapp.com')
  ) {
    return { event: 'whatsapp_click', target: 'whatsapp' };
  }
  return null;
}

/** Walk up from the event target to the nearest anchor. */
function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!target || typeof (target as Element).closest !== 'function') return null;
  return (target as Element).closest('a[href]') as HTMLAnchorElement | null;
}

export default function AnalyticsClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // A synthetic or programmatic click is not a visitor decision.
      if (event.defaultPrevented) return;
      // Modifier-clicks open a new tab/window without navigating; the visitor
      // still expressed the intent, so they are counted. Right-click is not.
      if (event.button !== undefined && event.button !== 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
        return;
      }

      const anchor = closestAnchor(event.target);
      if (!anchor) return;
      const classification = classifyContactHref(anchor.getAttribute('href'));
      if (!classification) return;

      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      trackAnalyticsEvent(
        classification.event,
        {
          page_path: path,
          page_type: detectPageType(path),
          // The link's own role on the page — enough to tell the floating
          // widget apart from a footer link without sending the URL.
          lead_source: anchor.dataset.analyticsPlacement || classification.target,
        },
        { source: CONTACT_CLICK_SOURCE },
      );
    }

    // Capture phase, so the listener still sees clicks that a component stops
    // propagation on (the floating widget does exactly that).
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true } as never);
  }, []);

  return null;
}
