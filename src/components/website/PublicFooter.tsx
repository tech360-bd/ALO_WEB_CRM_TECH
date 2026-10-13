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
 *   • Company: About Us | Contact Us | Code of Conduct | Student Complaint
 *     Policy | AQF Compliance
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

/* ------------------------------------------------------------------ */
/*  COLUMN CONTENT (defaults — Destinations/Quick Links/Company are    */
/*  overridable by the Super Admin Virtual Editor, see useCmsFooter)   */
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
/*  Three brand colours (Education Blue · ALO Orange · Accent) drifting in   */
/*  opposite directions — always live, paused for prefers-reduced-motion.    */
/* ------------------------------------------------------------------ */

const CAP_COLORS = ['#0066CC', '#F37021', '#FFB347'] as const;

function GraduationCapStrip() {
  return (
    <div
      aria-hidden="true"
      className="relative h-16 w-full overflow-hidden border-y border-alo-border bg-alo-brand-light/60"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes alo-cap-drift-a {
          0%   { transform: translateX(-15%) translateY(0) rotate(0deg); }
          50%  { transform: translateX(15vw) translateY(-5px) rotate(10deg); }
          100% { transform: translateX(115%) translateY(0) rotate(-10deg); }
        }
        @keyframes alo-cap-drift-b {
          0%   { transform: translateX(115%) translateY(0) rotate(0deg); }
          50%  { transform: translateX(60vw) translateY(6px) rotate(-8deg); }
          100% { transform: translateX(-20%) translateY(0) rotate(8deg); }
        }
        .alo-cap-row { position: absolute; inset: 0; display: flex; align-items: center; will-change: transform; }
        .alo-cap-row-a { animation: alo-cap-drift-a 30s linear infinite; }
        .alo-cap-row-b { animation: alo-cap-drift-b 38s linear infinite; }
        .alo-cap-row-c { animation: alo-cap-drift-a 22s linear infinite; animation-delay: -8s; }
        @media (prefers-reduced-motion: reduce) {
          .alo-cap-row-a, .alo-cap-row-b, .alo-cap-row-c { animation: none; }
        }
      `,
        }}
      />

      {/* Education Blue — slowest, quietest */}
      <div className="alo-cap-row alo-cap-row-a opacity-30" style={{ color: CAP_COLORS[0] }}>
        <GraduationCap className="mx-10 h-8 w-8 sm:mx-16" />
        <GraduationCap className="mx-24 h-11 w-11 sm:mx-40" />
        <GraduationCap className="mx-14 h-6 w-6 sm:mx-24" />
        <GraduationCap className="mx-28 h-9 w-9 sm:mx-52" />
      </div>

      {/* ALO Orange — mid layer */}
      <div className="alo-cap-row alo-cap-row-b opacity-60" style={{ color: CAP_COLORS[1] }}>
        <GraduationCap className="mx-16 h-10 w-10 sm:mx-32" />
        <GraduationCap className="mx-28 h-7 w-7 sm:mx-48" />
        <GraduationCap className="mx-20 h-12 w-12 sm:mx-36" />
      </div>

      {/* Accent — fastest, full strength */}
      <div className="alo-cap-row alo-cap-row-c opacity-100" style={{ color: CAP_COLORS[2] }}>
        <GraduationCap className="mx-12 h-8 w-8 sm:mx-20" />
        <GraduationCap className="mx-32 h-10 w-10 sm:mx-60" />
        <GraduationCap className="mx-24 h-6 w-6 sm:mx-28" />
        <GraduationCap className="mx-40 h-9 w-9 sm:mx-44" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CMS-managed column content (Virtual Editor)                        */
/*  /admin/website-cms → footer items override the constants above.    */
/*  Nothing renders until an item is published, so the compiled         */
/*  defaults in this file always describe the published footer.        */
/* ------------------------------------------------------------------ */

interface FooterLink { label: string; href: string }

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
        const bySection: Record<string, FooterLink[]> = {};
        for (const item of j.items) {
          const section = String(item.section || '');
          const label = String(item.label || '');
          const href = String((item.data as Record<string, unknown>)?.href ?? '');
          if (!section || !label || !href) continue;
          (bySection[section] ||= []).push({ label, href });
        }
        if (Object.keys(bySection).length === 0) return;
        setLinks((prev) => ({
          destinations: bySection.destinations?.length ? bySection.destinations : prev.destinations,
          quickLinks: bySection.quickLinks?.length ? bySection.quickLinks : prev.quickLinks,
          companyLinks: bySection.companyLinks?.length ? bySection.companyLinks : prev.companyLinks,
        }));
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
              className="text-[13px] font-medium text-alo-text-secondary transition-colors hover:text-alo-cta focus-visible:text-alo-cta focus-visible:outline-none"
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
  const year = new Date().getFullYear();

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
                src="/images/landing/Copy of logo.webp"
                alt=""
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
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <span className="text-alo-text-secondary">
                  <span className="font-semibold text-alo-text">WhatsApp: </span>
                  <a
                    href={ALO_CONTACT.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-alo-brand hover:text-alo-cta"
                  >
                    {ALO_CONTACT.whatsappDisplay}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <span className="text-alo-text-secondary">
                  <span className="font-semibold text-alo-text">Mobile: </span>
                  <a href={ALO_CONTACT.mobileHref} className="font-medium text-alo-brand hover:text-alo-cta">
                    {ALO_CONTACT.mobileDisplay}
                  </a>
                </span>
              </li>
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
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-alo-brand-border bg-alo-brand-light text-alo-brand transition-colors hover:border-alo-cta hover:bg-alo-cta hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-cta-accent focus-visible:ring-offset-2"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/book-consultation"
              className="inline-flex w-fit items-center gap-2 rounded-button bg-alo-cta px-5 py-3 font-heading text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-alo-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alo-cta-accent focus-visible:ring-offset-2"
            >
              Book Free Counseling
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

      {/* Bottom bar — ALO Orange #F37021.
          Text is near-black rather than white on purpose: white on #F37021 is
          2.94:1, which fails WCAG AA for both body and large text, while black
          on #F37021 is ~7:1. Same brand colour, readable for everyone. */}
      <div className="bg-alo-cta py-4 text-black">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs font-medium sm:flex-row sm:px-6 lg:px-8">
          <p className="font-heading font-bold tracking-wide">© {year} ALO Education. All rights reserved.</p>
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
