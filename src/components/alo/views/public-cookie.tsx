"use client";

import * as React from "react";
import {
  Icon,
} from "@/components/alo/shared";
import { LegalLayout } from "@/components/alo/views/public-privacy";
import { type ViewKey } from "@/lib/alo-types";

interface PublicCookieProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

const SECTIONS = [
  {
    title: "1. What Are Cookies",
    body: [
      "Cookies are small text files that websites store on your device (computer, tablet, or mobile) when you visit them. Cookies allow websites to remember your actions and preferences (such as login, language, font size) over a period of time, so you don't have to re-enter them every time you visit the site or browse from one page to another.",
      "Cookies are widely used to make websites work more efficiently and to provide information to site owners. Cookies do not contain viruses or malware and cannot access the data on your device.",
    ],
  },
  {
    title: "2. How ALO Education Uses Cookies",
    body: [
      "ALO Education uses cookies minimally and only when strictly necessary. We do NOT use cookies for advertising, tracking across other websites, or selling your data to third parties.",
      "We use cookies for:",
      "• Authentication: keeping you logged into your Student Portal / Partner Portal / Employee Portal session.",
      "• Session management: remembering your navigation state (e.g., language preference, theme).",
      "• Security: protecting against CSRF attacks and unauthorised access.",
      "• Analytics: understanding which pages are most visited (anonymised, aggregated only).",
    ],
  },
  {
    title: "3. Types of Cookies We Use",
    body: [
      "Strictly necessary cookies: Required for the website to function. Cannot be disabled. Examples: session ID, authentication token, CSRF token.",
      "Preference cookies: Remember your preferences (theme, language). Optional — you can disable them.",
      "Analytics cookies: Help us understand how visitors use our website (anonymised). We use first-party analytics only — we do not share this data with third parties like Google Analytics.",
      "We do NOT use:",
      "• Advertising cookies (no Google Ads, Facebook Pixel, or similar).",
      "• Tracking cookies that follow you across other websites.",
      "• Third-party cookies except for essential authentication.",
    ],
  },
  {
    title: "4. Managing Cookies",
    body: [
      "You can control cookies through your browser settings:",
      "• Chrome: Settings > Privacy and security > Cookies and other site data.",
      "• Firefox: Settings > Privacy & Security > Cookies and Site Data.",
      "• Safari: Preferences > Privacy > Cookies and website data.",
      "• Edge: Settings > Cookies and site permissions.",
      "• Mobile browsers: Check your browser's settings menu.",
      "If you disable strictly necessary cookies, some parts of our website (such as the Student Portal login) will not function. We recommend keeping necessary cookies enabled.",
    ],
  },
  {
    title: "5. Cookie Duration",
    body: [
      "Session cookies: Deleted when you close your browser.",
      "Persistent cookies: Remain on your device for a set period (maximum 13 months for analytics, 30 days for authentication tokens).",
      "Authentication 'Keep me signed in for 30 days' option: Stores an encrypted token for 30 days. You can revoke this by logging out.",
    ],
  },
  {
    title: "6. Third-Party Cookies",
    body: [
      "ALO Education does NOT use third-party advertising or tracking cookies.",
      "If you click on links to external websites (universities, visa authorities, social media), those websites may set their own cookies. We have no control over those cookies — please review their privacy policies.",
      "We embed no third-party widgets that track you across the web.",
    ],
  },
  {
    title: "7. Cookie Consent",
    body: [
      "By continuing to use our website, you consent to our use of cookies as described in this policy.",
      "You can withdraw your consent at any time by disabling cookies in your browser settings.",
      "We do not show intrusive cookie banners — our cookie use is minimal and aligned with strict privacy standards.",
    ],
  },
  {
    title: "8. Updates to This Policy",
    body: [
      "We may update this Cookie Policy from time to time. Material changes will be posted on this page and notified via email if you've shared your email with us.",
      "Last updated: August 2025.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "Questions about our cookie use? Contact us:",
      "ALO Education, House 25, Road 11, Banani, Dhaka 1213, Bangladesh.",
      "Phone: +880 1805 020101.",
      "Email: hello@aloeducation.com.",
    ],
  },
];

export function PublicCookie({ onNavigate }: PublicCookieProps) {
  return (
    <LegalLayout
      title="Cookie Policy"
      icon="Cookie"
      subtitle="How ALO Education uses cookies — minimally and only when strictly necessary."
      onNavigate={onNavigate}
    >
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-[#0B2447]">{section.title}</h2>
            <div className="mt-3 space-y-2">
              {section.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#5A7299]">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </LegalLayout>
  );
}
export default PublicCookie;
