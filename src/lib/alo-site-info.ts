/**
 * ALO Education — single source of truth for public contact details, official
 * social accounts and policy links.
 *
 * The public header (PublicNavbar), the site-wide footer (PublicFooter), the
 * contact page and the policy pages all read from this module. Before this
 * file each surface hard-coded its own phone number, address or handle, so the
 * site showed three different offices at once. Change a value here once and
 * every surface follows.
 *
 * Values verified against the live site (aloeducation.com/contact, fetched
 * 2026-10-13): phone +88 01805020101-10, info@aloeducation.com, Barek
 * Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205,
 * WhatsApp wa.me/8801805020101.
 */

export const ALO_CONTACT = {
  /** Full postal address, exactly as published on the live site. */
  address: 'Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.',
  /** Compact form for the header utility strip. */
  addressShort: 'Barek Mansion-02 (5th Floor), Panthapath, Dhaka-1205',
  /** Google location share link supplied by ALO Education. */
  mapsUrl: 'https://share.google/aarau5V2GfBrICZTj',
  /** Human-readable mobile range: +8801805020101 through ...10. */
  mobileDisplay: '+88 01805 020101-10',
  /** Dialable primary number. */
  mobileHref: 'tel:+8801805020101',
  /** WhatsApp deep link on the primary number. */
  whatsappHref: 'https://wa.me/8801805020101',
  whatsappDisplay: '+8801805020101',
  email: 'info@aloeducation.com',
  emailHref: 'mailto:info@aloeducation.com',
  officeHours: 'Sat–Thu: 10:00 AM – 6:00 PM (Asia/Dhaka)',
} as const;

/**
 * Official ALO Education accounts, in the order the brand requires:
 * Facebook → Instagram → LinkedIn → YouTube. Never render them in another
 * order and never add a platform that is not listed here.
 */
export const ALO_SOCIALS = [
  {
    id: 'facebook',
    label: 'Facebook',
    ariaLabel: 'ALO Education on Facebook',
    href: 'https://www.facebook.com/aloeducation',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    ariaLabel: 'ALO Education on Instagram',
    href: 'https://www.instagram.com/aloeducation',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    ariaLabel: 'ALO Education on LinkedIn',
    href: 'https://www.linkedin.com/company/aloeducation',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    ariaLabel: 'ALO Education on YouTube',
    href: 'https://www.youtube.com/@aloeducation',
  },
] as const;

export type AloSocialPlatform = (typeof ALO_SOCIALS)[number]['id'];

/** Policy / conduct pages that must be reachable from the footer. */
export const ALO_POLICY_LINKS = {
  codeOfConduct: '/code-of-conduct',
  studentComplaintPolicy: '/student-complaint-policy',
  aqfCompliance: '/aqf-compliance',
} as const;

/** Brand tagline — one spelling for the whole product. */
export const ALO_TAGLINE = 'Your Dream – Our Commitment';
