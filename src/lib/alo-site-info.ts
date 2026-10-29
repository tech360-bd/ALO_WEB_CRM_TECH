/**
 * ALO Education — shared public contact details, social accounts and policy links.
 * Public phone/WhatsApp links are deployment configuration. Blank values are
 * intentionally omitted. Configuration does not prove phone ownership or Meta
 * connectivity; the separate sender registry/provider check controls sending.
 */
function readPublicPhone(value: string | undefined, requireInternational = false): { display: string; digits: string } | null {
  const raw = (value || '').trim();
  if (!raw || !/^[+()\d\s.-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15 || (requireInternational && digits.startsWith('0'))) return null;
  return { display: raw, digits };
}

const configuredContactPhone = readPublicPhone(process.env.NEXT_PUBLIC_ALO_CONTACT_PHONE);
const configuredWhatsAppPhone = readPublicPhone(process.env.NEXT_PUBLIC_ALO_WHATSAPP_NUMBER, true);

export const ALO_CONTACT = {
  /** Confirm address with the owner before production publication. */
  address: 'Barek Mansion-02 (5th Floor), 58/9 Box Culvert Road, Panthapath, Dhaka-1205, Bangladesh.',
  addressShort: 'Barek Mansion-02 (5th Floor), Panthapath, Dhaka-1205',
  mapsUrl: 'https://share.google/aarau5V2GfBrICZTj',
  mobileDisplay: configuredContactPhone?.display || '',
  mobileHref: configuredContactPhone
    ? `tel:${configuredContactPhone.display.trim().startsWith('+') ? '+' : ''}${configuredContactPhone.digits}`
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
