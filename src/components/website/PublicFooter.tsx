'use client';

/**
 * ALO Education — site-wide footer, rendered on EVERY public page (and never
 * inside an authenticated portal) by PublicLayoutWrapper from the root layout.
 *
 * Brand specification implemented here:
 *   • Logo (ALO Education) + "Your Dream – Our Commitment" tagline
 *   • Social icons in this exact order: Facebook → Instagram → LinkedIn → YouTube
 *     (official ALO Education accounts only — see src/lib/alo-site-info.ts)
 *   • Destinations: UK | Australia | Canada | Ireland | New Zealand | USA | Dubai
 *   • Quick Links: Course Finder | Services | Language Prep | Scholarships
 *   • Company: About Us | Contact Us | Global Offices | Code of Conduct |
 *     Student Complaint Policy | AQF Compliance
 *   • Contact block: Google location link, WhatsApp, Mobile, Email, Address
 *   • Decorative graduation-cap strip with three ALO brand colours, always moving
 *   • Bottom bar in ALO Orange: "© ALO Education. All rights reserved."
 *
 * No B2B / partner-recruitment content is published in the footer.
 */

import Link from 'next/link';
import {
  Building2,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react';
import React from 'react';
import {
  ALO_CONTACT,
  ALO_POLICY_LINKS,
  ALO_SOCIALS,
  ALO_TAGLINE,
} from '@/lib/alo-site-info';
import { ALO_BRAND_ALT, ALO_BRAND_ASSETS } from '@/lib/brand/brand-assets';

/* ------------------------------------------------------------------ */
/*  REQUIRED COLUMN CONTENT (CMS may append safe internal links after */
/*  these entries; it cannot replace or reorder the brand requirements) */
/* ------------------------------------------------------------------ */

// Exact order required by the brand brief.
const destinations = [
  { label: 'UK', href: '/destinations/uk' },
  { label: 'Australia', href: '/destinations/australia' },
  { label: 'Canada', href: '/destinations/canada' },
  { label: 'Ireland', href: '/destinations/ireland' },
  { label: 'New Zealand', href: '/destinations/new-zealand' },
  { label: 'USA', href: '/destinations/usa' },
  { label: 'Dubai', href: '/destinations/dubai' },
];

const quickLinks = [
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Services', href: '/services' },
  { label: 'Language Prep', href: '/language-prep' },
  { label: 'Scholarships', href: '/scholarships' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Global Offices', href: '/global-offices' },
  { label: 'Code of Conduct', href: ALO_POLICY_LINKS.codeOfConduct },
  { label: 'Student Complaint Policy', href: ALO_POLICY_LINKS.studentComplaintPolicy },
  { label: 'AQF Compliance', href: ALO_POLICY_LINKS.aqfCompliance },
];

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

/* ------------------------------------------------------------------ */
/*  DECORATIVE CAP-ICON STRIP                                          */
/*                                                                     */
/*  Three ALO brand colours — Education Blue #0066CC, ALO Orange        */
/*  #F37021 and Accent #FFB347 — drifting in opposite directions behind  */
/*  the footer. Each row renders the same sequence of graduation caps    */
/*  four times inside a `width: max-content` track and animates it by    */
/*  exactly one sequence (-25%), so the loop is seamless and the strip   */
/*  is never empty on any screen width. Decorative only: the strip is    */
/*  aria-hidden and every animation stops for prefers-reduced-motion.    */
/* ------------------------------------------------------------------ */

const CAP_COLORS = ['#0066CC', '#F37021', '#FFB347'] as const;

/** One sequence of caps. Rendered CAP_SEQUENCE_COPIES times per row. */
const CAP_SEQUENCE = [
  'h-6 w-6 mx-4 sm:mx-6',
  'h-9 w-9 mx-6 sm:mx-10',
  'h-7 w-7 mx-5 sm:mx-8',
  'h-11 w-11 mx-7 sm:mx-12',
  'h-8 w-8 mx-4 sm:mx-7',
  'h-6 w-6 mx-6 sm:mx-9',
  'h-10 w-10 mx-5 sm:mx-11',
  'h-7 w-7 mx-7 sm:mx-9',
  'h-9 w-9 mx-4 sm:mx-8',
  'h-12 w-12 mx-6 sm:mx-12',
  'h-6 w-6 mx-5 sm:mx-7',
  'h-8 w-8 mx-7 sm:mx-10',
  'h-10 w-10 mx-4 sm:mx-6',
] as const;

/** Copies per row. (copies - 1) × sequence width must exceed the widest screen. */
const CAP_SEQUENCE_COPIES = 4;

interface CapRowConfig {
  color: string;
  opacity: string;
  duration: string;
  direction: 'left' | 'right';
}

const CAP_ROWS: CapRowConfig[] = [
  { color: CAP_COLORS[0], opacity: 'opacity-35', duration: '42s', direction: 'left' },
  { color: CAP_COLORS[1], opacity: 'opacity-60', duration: '34s', direction: 'right' },
  { color: CAP_COLORS[2], opacity: 'opacity-100', duration: '26s', direction: 'left' },
];

function CapRow({ color, opacity, duration, direction }: CapRowConfig) {
  return (
    <div className="flex items-center">
      <div
        className={`alo-cap-track ${direction === 'left' ? 'alo-cap-left' : 'alo-cap-right'} ${opacity}`}
        style={{ color, animationDuration: duration }}
      >
        {Array.from({ length: CAP_SEQUENCE_COPIES }).map((_, copy) => (
          <React.Fragment key={copy}>
            {CAP_SEQUENCE.map((size, index) => (
              <GraduationCap
                key={`${copy}-${index}`}
                className={`${size} shrink-0`}
                aria-hidden="true"
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function GraduationCapStrip() {
  return (
    <div
      data-testid="alo-cap-strip"
      aria-hidden="true"
      className="relative h-16 w-full overflow-hidden border-y border-alo-border bg-alo-brand-light/60"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes alo-cap-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-25%); }
        }
        @keyframes alo-cap-right {
          from { transform: translateX(-25%); }
          to   { transform: translateX(0); }
        }
        .alo-cap-stack { height: 100%; display: flex; flex-direction: column; justify-content: space-evenly; }
        .alo-cap-track { display: flex; align-items: center; width: max-content; will-change: transform; }
        .alo-cap-left { animation-name: alo-cap-left; animation-timing-function: linear; animation-iteration-count: infinite; }
        .alo-cap-right { animation-name: alo-cap-right; animation-timing-function: linear; animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) {
          .alo-cap-left, .alo-cap-right { animation: none; }
        }
      `,
        }}
      />
      <div className="alo-cap-stack">
        {CAP_ROWS.map((row) => (
          <CapRow key={row.color} {...row} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CMS-managed column content (Virtual Editor)                        */
/*  /admin/website-cms → published internal links are appended after   */
/*  the required entries above; external or unsafe links are rejected.  */
/* ------------------------------------------------------------------ */

interface FooterLink { label: string; href: string }

const CMS_FOOTER_SECTIONS = ['destinations', 'quickLinks', 'companyLinks'] as const;
const INTERNAL_LINK_ORIGIN = 'https://aloeducation.com';

function isSafeInternalHref(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\') || /[\u0000-\u001f\u007f]/.test(href)) {
    return false;
  }
  try {
    const parsed = new URL(href, INTERNAL_LINK_ORIGIN);
    return parsed.origin === INTERNAL_LINK_ORIGIN && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/** Required brand links remain first and cannot be replaced by CMS content. */
function withRequiredLinks(required: FooterLink[], cmsLinks: FooterLink[]): FooterLink[] {
  const requiredLabels = new Set(required.map((link) => link.label.trim().toLocaleLowerCase()));
  const requiredHrefs = new Set(required.map((link) => link.href));
  const seen = new Set<string>();
  const extras = cmsLinks.filter((link) => {
    const label = link.label.trim();
    const href = link.href.trim();
    const labelKey = label.toLocaleLowerCase();
    const extraKey = `${labelKey}\u0000${href}`;
    if (!label || label.length > 100 || href.length > 2048 || !isSafeInternalHref(href)) return false;
    if (requiredLabels.has(labelKey) || requiredHrefs.has(href) || seen.has(extraKey)) return false;
    seen.add(extraKey);
    return true;
  }).slice(0, 24);
  return [...required, ...extras];
}

function useCmsFooterLinks() {
  const [links, setLinks] = React.useState<{
    destinations: FooterLink[];
    quickLinks: FooterLink[];
    companyLinks: FooterLink[];
  }>({ destinations, quickLinks, companyLinks });

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/website/cms-content?type=footer')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items) || j.items.length === 0) return;
        const bySection: Record<(typeof CMS_FOOTER_SECTIONS)[number], FooterLink[]> = {
          destinations: [],
          quickLinks: [],
          companyLinks: [],
        };
        for (const item of j.items) {
          if (!item || typeof item !== 'object') continue;
          const section = String(item.section || '') as (typeof CMS_FOOTER_SECTIONS)[number];
          if (!CMS_FOOTER_SECTIONS.includes(section)) continue;
          const label = String(item.label || '').trim();
          const data = item.data && typeof item.data === 'object' ? item.data as Record<string, unknown> : {};
          const href = String(data.href ?? '').trim();
          if (!label || !href) continue;
          bySection[section].push({ label, href });
        }
        setLinks({
          destinations: withRequiredLinks(destinations, bySection.destinations),
          quickLinks: withRequiredLinks(quickLinks, bySection.quickLinks),
          companyLinks: withRequiredLinks(companyLinks, bySection.companyLinks),
        });
      })
      .catch(() => {
        /* keep the compiled-in defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}

/* ------------------------------------------------------------------ */
/*  COLUMN RENDERER                                                    */
/* ------------------------------------------------------------------ */

function FooterColumn({
  title,
  links,
  className = '',
}: {
  title: string;
  links: FooterLink[];
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="font-heading text-[13px] font-extrabold uppercase tracking-[0.12em] text-alo-brand">
        {title}
      </h2>
      <span className="mt-2 block h-[3px] w-8 rounded-full bg-alo-cta-accent" aria-hidden="true" />
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-[13px] font-medium text-alo-text-secondary transition-colors hover:text-alo-brand focus-visible:text-alo-brand focus-visible:outline-none"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                             */
/* ------------------------------------------------------------------ */

export default function PublicFooter() {
  const { destinations: destLinks, quickLinks: quickL, companyLinks: companyL } = useCmsFooterLinks();

  return (
    <footer id="alo-public-footer" className="mt-auto w-full bg-white">
      {/* ALO Orange brand accent across the top of the footer */}
      <div className="h-1 w-full bg-alo-cta" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* ── Brand, contact details, official social accounts ──────── */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Link href="/" className="flex items-start gap-3" aria-label={`ALO Education — ${ALO_TAGLINE}`}>
              <img
                src={ALO_BRAND_ASSETS.logo}
                alt={ALO_BRAND_ALT.logo}
                className="h-11 w-auto"
                width={44}
                height={44}
              />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-xl font-extrabold tracking-tight text-alo-brand">
                  ALO Education
                </span>
                <span className="mt-1 text-[12px] font-semibold italic text-alo-cta">
                  {ALO_TAGLINE}
                </span>
              </span>
            </Link>

            <p className="max-w-sm text-[13px] leading-relaxed text-alo-text-secondary">
              Bangladesh&apos;s trusted study abroad consultancy. Honest guidance from course match to
              visa decision — no hidden fees, no false promises.
            </p>

            {/* Contact block — exact fields required by the brand brief */}
            <ul className="flex flex-col gap-1 text-[13px]">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <span className="text-alo-text-secondary">
                  <span className="font-semibold text-alo-text">Location (Google): </span>
                  <a
                    href={ALO_CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-alo-brand underline underline-offset-2 hover:text-alo-cta"
                  >
                    Open in Google Maps
                  </a>
                </span>
              </li>
              {ALO_CONTACT.hasWhatsApp && (
                <li className="flex items-start gap-2.5">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                  <span className="text-alo-text-secondary">
                    <span className="font-semibold text-alo-text">WhatsApp: </span>
                    <a href={ALO_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-medium text-alo-brand hover:text-alo-cta">
                      {ALO_CONTACT.whatsappDisplay}
                    </a>
                  </span>
                </li>
              )}
              {ALO_CONTACT.hasContactPhone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                  <span className="text-alo-text-secondary">
                    <span className="font-semibold text-alo-text">Mobile: </span>
                    <a href={ALO_CONTACT.mobileHref} className="font-medium text-alo-brand hover:text-alo-cta">
                      {ALO_CONTACT.mobileDisplay}
                    </a>
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <span className="text-alo-text-secondary">
                  <span className="font-semibold text-alo-text">Email: </span>
                  <a href={ALO_CONTACT.emailHref} className="font-medium text-alo-brand hover:text-alo-cta">
                    {ALO_CONTACT.email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <span className="text-alo-text-secondary">
                  <span className="font-semibold text-alo-text">Address: </span>
                  {ALO_CONTACT.address}
                </span>
              </li>
            </ul>

            {/* Official social accounts — order is fixed: FB → IG → LinkedIn → YouTube */}
            <ul className="flex items-center gap-2.5" aria-label="ALO Education official social media">
              {ALO_SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.id];
                return (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.ariaLabel}
                      title={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-alo-brand-border bg-alo-brand-light text-alo-brand transition-colors hover:border-alo-cta hover:bg-alo-cta hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-cta-accent focus-visible:ring-offset-2"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/book-consultation"
              className="inline-flex w-fit items-center gap-2 rounded-button bg-alo-cta px-5 py-3 font-heading text-[13px] font-bold text-black shadow-sm transition-colors hover:bg-alo-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-cta-accent focus-visible:ring-offset-2"
            >
              Request Counseling
            </Link>
          </div>

          <FooterColumn
            title="Destinations"
            links={destLinks}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="Quick Links"
            links={quickL}
            className="lg:col-span-2"
          />
          <FooterColumn
            title="Company"
            links={companyL}
            className="md:col-span-1 lg:col-span-3"
          />
        </div>
      </div>

      {/* Decorative moving cap-icon strip — three ALO brand colours */}
      <GraduationCapStrip />

      {/* Bottom bar — ALO Orange #F37021. Black text preserves strong contrast on the required brand orange. */}
      <div className="bg-alo-cta py-4 text-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs font-medium sm:flex-row sm:px-6 lg:px-8">
          <p className="font-heading font-bold tracking-wide">© ALO Education. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
            <Link href="/privacy-policy" className="transition-colors hover:text-black/60">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="transition-colors hover:text-black/60">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link href="/cookies" className="transition-colors hover:text-black/60">Cookies</Link>
            <span aria-hidden="true">·</span>
            <Link href="/accessibility" className="transition-colors hover:text-black/60">Accessibility</Link>
            <span aria-hidden="true">·</span>
            <Link href="/communication-policy" className="transition-colors hover:text-black/60">Communication</Link>
            <span aria-hidden="true">·</span>
            <Link href="/lead-data-usage-policy" className="transition-colors hover:text-black/60">Lead Data</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
