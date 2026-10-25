'use client';

/**
 * ALO Education — footer for signed-in portals.
 *
 * Three separate things are being kept separate on purpose:
 *
 *   1. The PUBLIC footer (src/components/website/PublicFooter.tsx) belongs to
 *      the marketing site and is mounted exactly once, by PublicLayoutWrapper.
 *   2. This GENERAL portal footer is what a signed-in ALO student or ALO
 *      employee sees. It is deliberately compact — it sits under an app shell,
 *      not under a landing page.
 *   3. The PARTNER block below it is added only when the signed-in student was
 *      recruited through a B2B partner (or the user is that partner's own
 *      staff). It uses the partner's own logo and colours, which the partner
 *      Super Admin maintains in /partner-admin/branding.
 *
 * The server decides (1)/(3) via GET /api/portal/footer-context; this component
 * never accepts a partner id from the client.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Phone, Youtube, Globe } from 'lucide-react';
import { ALO_CONTACT, ALO_SOCIALS, ALO_TAGLINE } from '@/lib/alo-site-info';
import { ALO_BRAND_ALT, ALO_BRAND_ASSETS } from '@/lib/brand/brand-assets';
import { buildPartnerFooterTheme, type PartnerBrandingView } from '@/lib/partner/branding';
import { shouldShowPartnerFooter } from '@/lib/portal/footer-context';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
} as const;

/** One link set — never repeated between the general and partner blocks. */
const GENERAL_LINKS = [
  { label: 'Course Finder', href: '/course-finder' },
  { label: 'Services', href: '/services' },
  { label: 'Language Prep', href: '/language-prep' },
  { label: 'Scholarships', href: '/scholarships' },
] as const;

const POLICY_LINKS = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Code of Conduct', href: '/code-of-conduct' },
  { label: 'Complaints', href: '/student-complaint-policy' },
] as const;

export interface PortalFooterProps {
  /** Where the footer is mounted. Shown in the partner block copy. */
  scope?: 'student' | 'employee' | 'partner' | 'counselor';
}

export default function PortalFooter({ scope = 'student' }: PortalFooterProps) {
  const [partner, setPartner] = useState<PartnerBrandingView | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/portal/footer-context', { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.success) return;
        setPartner((payload.partner as PartnerBrandingView | null) ?? null);
      })
      .catch(() => {
        /* a footer must never break a portal page — general footer still renders */
      });
    return () => controller.abort();
  }, []);

  const partnerTheme = partner ? buildPartnerFooterTheme(partner) : null;
  const showPartner = shouldShowPartnerFooter(partner) && partnerTheme !== null;

  return (
    <footer id="alo-portal-footer" className="mt-auto border-t border-alo-border bg-white">
      <div className="h-1 w-full bg-alo-cta" aria-hidden="true" />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand + tagline */}
          <div className="md:col-span-5">
            <Link href="/" className="flex items-start gap-3" aria-label={`ALO Education — ${ALO_TAGLINE}`}>
              <img src={ALO_BRAND_ASSETS.logo} alt={ALO_BRAND_ALT.logo} className="h-10 w-auto" width={40} height={40} />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-lg font-extrabold tracking-tight text-alo-brand">ALO Education</span>
                <span className="mt-1 text-[11px] font-semibold italic text-alo-cta">{ALO_TAGLINE}</span>
              </span>
            </Link>

            <ul className="mt-4 flex flex-col gap-1.5 text-[12.5px] text-alo-text-secondary">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <a href={ALO_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-medium text-alo-brand hover:text-alo-cta">
                  WhatsApp {ALO_CONTACT.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <a href={ALO_CONTACT.mobileHref} className="font-medium text-alo-brand hover:text-alo-cta">
                  {ALO_CONTACT.mobileDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-alo-cta" aria-hidden="true" />
                <a href={ALO_CONTACT.emailHref} className="font-medium text-alo-brand hover:text-alo-cta">
                  {ALO_CONTACT.email}
                </a>
              </li>
              <li className="max-w-sm leading-relaxed">{ALO_CONTACT.address}</li>
            </ul>
          </div>

          {/* Portal quick links */}
          <nav aria-label="Quick links" className="md:col-span-3">
            <h2 className="font-heading text-[12px] font-extrabold uppercase tracking-[0.12em] text-alo-brand">Quick Links</h2>
            <span className="mt-2 block h-[3px] w-8 rounded-full bg-alo-cta-accent" aria-hidden="true" />
            <ul className="mt-3 flex flex-col gap-2">
              {GENERAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] font-medium text-alo-text-secondary transition-colors hover:text-alo-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policy links + socials */}
          <div className="md:col-span-4">
            <h2 className="font-heading text-[12px] font-extrabold uppercase tracking-[0.12em] text-alo-brand">Policies</h2>
            <span className="mt-2 block h-[3px] w-8 rounded-full bg-alo-cta-accent" aria-hidden="true" />
            <ul className="mt-3 flex flex-col gap-2">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] font-medium text-alo-text-secondary transition-colors hover:text-alo-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex items-center gap-2" aria-label="ALO Education official social media">
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
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-alo-brand-border bg-alo-brand-light text-alo-brand transition-colors hover:border-alo-cta hover:bg-alo-cta hover:text-black"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Partner block — only for B2B-linked users ───────────────────── */}
      {showPartner && partner && partnerTheme && (
        <section
          aria-label={`${partner.displayName || 'B2B partner'} — partner information`}
          data-testid="alo-partner-footer"
          className="border-t border-alo-border"
          style={{ backgroundColor: partnerTheme.tint }}
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={`${partner.displayName || 'Partner'} logo`}
                    className="h-12 w-12 rounded-lg bg-white object-contain p-1 ring-1"
                    style={{ boxShadow: 'none', borderColor: partnerTheme.accentColor }}
                    width={48}
                    height={48}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-lg font-heading text-lg font-extrabold"
                    style={{ backgroundColor: partnerTheme.primaryColor, color: partnerTheme.onPrimary }}
                  >
                    {(partner.displayName || 'P').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="font-heading text-sm font-extrabold" style={{ color: partnerTheme.primaryColor }}>
                    {partner.displayName || 'B2B Partner'}
                  </p>
                  {partner.tagline ? (
                    <p className="text-[12px] font-medium text-alo-text-secondary">{partner.tagline}</p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-alo-text-muted">
                    {scope === 'partner'
                      ? 'Your organisation on the ALO Education partner network.'
                      : 'Your studies are supported through this ALO Education partner.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: partnerTheme.primaryColor }}
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Website
                  </a>
                ) : null}
                {partner.supportEmail ? (
                  <a
                    href={`mailto:${partner.supportEmail}`}
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: partnerTheme.primaryColor }}
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {partner.supportEmail}
                  </a>
                ) : null}
                {partner.supportPhone ? (
                  <a
                    href={`tel:${partner.supportPhone.replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: partnerTheme.secondaryColor }}
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {partner.supportPhone}
                  </a>
                ) : null}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: partnerTheme.accentColor, color: '#000000' }}
                >
                  ALO Education partner
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom bar — ALO Orange, one copyright statement, no repeated links */}
      <div className="bg-alo-cta py-3 text-black">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11.5px] font-medium sm:flex-row sm:px-6 lg:px-8">
          <p className="font-heading font-bold tracking-wide">© {new Date().getFullYear()} ALO Education</p>
          <p className="text-center sm:text-right">{ALO_TAGLINE}</p>
        </div>
      </div>
    </footer>
  );
}
