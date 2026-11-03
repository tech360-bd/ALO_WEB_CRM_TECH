/**
 * ALO Education — shared public contact details, social accounts and policy links.
 *
 * The ALO-provided public contact numbers below are compiled in as brand
 * defaults so the header/footer show them on EVERY pre-login page, including a
 * deployment that has not set the optional NEXT_PUBLIC_* overrides. Operators
 * may override them through protected environment configuration; a blank value
 * falls back to these defaults rather than hiding the required contact block.
 *
 * These are DISPLAY / CONTACT details only. They do not prove phone ownership,
 * Meta WhatsApp Business registration, approved templates or Cloud API
 * connectivity. Automated sending is controlled separately by the number
 * registry and provider configuration (see docs/WHATSAPP_NUMBER_REGISTRY.md).
 */
const ALO_BRAND_CONTACT_DEFAULTS = {
  /** Display range, e.g. "+8801805020101-10"; the dial link uses the first number. */
  contactPhone: '+8801805020101-10',
  whatsappPhone: '+8801805020101',
} as const;

function readPublicPhone(value: string | undefined, requireInternational = false): { display: string; digits: string } | null {
  const raw = (value || '').trim();
  if (!raw || !/^[+()\d\s.-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15 || (requireInternational && digits.startsWith('0'))) return null;
  return { display: raw, digits };
}

/**
 * A display value may be a short range such as "+8801805020101-10". Only the
 * first number is dialable; appending the range suffix would produce a
 * non-existent 15-digit telephone number.
 */
function dialDigits(display: string): string {
  return display.replace(/\s*[-–]\s*\d{1,4}\s*$/, '').replace(/\D/g, '');
}

// An invalid operator override must never make the required brand contact
// block disappear: fall back to the ALO-provided numbers on a parse failure.
const configuredContactPhone =
  readPublicPhone(process.env.NEXT_PUBLIC_ALO_CONTACT_PHONE || ALO_BRAND_CONTACT_DEFAULTS.contactPhone)
  ?? readPublicPhone(ALO_BRAND_CONTACT_DEFAULTS.contactPhone);
const configuredWhatsAppPhone =
  readPublicPhone(process.env.NEXT_PUBLIC_ALO_WHATSAPP_NUMBER || ALO_BRAND_CONTACT_DEFAULTS.whatsappPhone, true)
  ?? readPublicPhone(ALO_BRAND_CONTACT_DEFAULTS.whatsappPhone, true);

export const ALO_CONTACT = {
  /** Confirm address with the owner before production publication. */
  address: 'Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.',
  addressShort: 'Barek Mansion-02 (5th Floor), Panthapath, Dhaka-1205',
  mapsUrl: 'https://share.google/aarau5V2GfBrICZTj',
  mobileDisplay: configuredContactPhone?.display || '',
  mobileHref: configuredContactPhone
    ? `tel:${configuredContactPhone.display.trim().startsWith('+') ? '+' : ''}${dialDigits(configuredContactPhone.display)}`
    : '',
  hasContactPhone: Boolean(configuredContactPhone),
  whatsappHref: configuredWhatsAppPhone ? `https://wa.me/${configuredWhatsAppPhone.digits}` : '',
  whatsappDisplay: configuredWhatsAppPhone ? `+${configuredWhatsAppPhone.digits}` : '',
  hasWhatsApp: Boolean(configuredWhatsAppPhone),
  email: 'info@aloeducation.com',
  emailHref: 'mailto:info@aloeducation.com',
  officeHours: 'Sat–Thu: 9:00 AM – 6:00 PM (Asia/Dhaka)',
};

/** Safe public CTA fallback when no operator-confirmed WhatsApp destination is configured. */
export const ALO_PUBLIC_CONTACT_CTA = {
  href: ALO_CONTACT.hasWhatsApp ? ALO_CONTACT.whatsappHref : '/contact',
  label: ALO_CONTACT.hasWhatsApp ? `WhatsApp ${ALO_CONTACT.whatsappDisplay}` : 'Contact ALO Education',
};

/** Public social profile links are configuration/content, not proof of account ownership. */
export const ALO_SOCIALS = [
  {
    id: 'facebook',
    label: 'Facebook',
    ariaLabel: 'ALO Education on Facebook',
    href: 'https://www.facebook.com/aloeducationbangladesh/',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    ariaLabel: 'ALO Education on Instagram',
    href: 'https://www.instagram.com/aloeducation.bd/',
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
    href: 'https://www.youtube.com/@aloeducationbd',
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
