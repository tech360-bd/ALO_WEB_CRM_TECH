/**
 * ALO Education — B2B partner branding (logo + colour scheme).
 *
 * A student who was recruited through a B2B partner belongs to two organisations
 * at once: ALO Education (the consultancy that owns the CRM) and the partner
 * agency that introduced them. The brand brief settles what that means on
 * screen:
 *
 *   • An ALO student or an ALO employee sees the general footer only.
 *   • A student linked to a B2B partner sees the general footer PLUS a footer
 *     block for their partner, using that partner's own logo and colours.
 *   • A partner Super Admin may customise that logo and colour scheme.
 *
 * This module is deliberately pure: it validates and normalises the branding a
 * partner submits, and derives a theme that is safe to render. Database reads
 * and writes live in `partner-branding-service.ts` so the rules below can be
 * unit-tested without a database.
 */

/** ALO Education brand tokens — the fallback for every partner. */
export const ALO_BRAND_COLORS = {
  primary: '#0066CC',
  secondary: '#F37021',
  accent: '#FFB347',
  text: '#000000',
  textMuted: '#555555',
} as const;

export const PARTNER_BRANDING_LIMITS = {
  displayName: 120,
  tagline: 160,
  logoUrl: 500,
  websiteUrl: 300,
  supportEmail: 190,
  supportPhone: 40,
  /** Largest accepted base64 logo payload, in decoded bytes. */
  logoBytes: 96 * 1024,
} as const;

export interface PartnerBrandingInput {
  displayName?: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  websiteUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  showInFooter?: boolean;
}

export interface PartnerBrandingView {
  partnerId: string;
  displayName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  websiteUrl: string;
  supportEmail: string;
  supportPhone: string;
  showInFooter: boolean;
  updatedAt: string | null;
}

export interface PartnerFooterTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Text colour that stays readable on the partner primary colour. */
  onPrimary: string;
  /** Soft tint of the primary colour for panels. */
  tint: string;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const SAFE_EMAIL = /^[^\s@<>()[\]]{1,64}@[^\s@<>()[\]]{1,190}\.[A-Za-z]{2,}$/;
const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value.toUpperCase() : fallback;
}

/**
 * Accepts either an https logo URL or a small inline image data URI.
 *
 * Nothing else is allowed: `javascript:`, `data:text/html`, protocol-relative
 * URLs and http:// (mixed content) are all rejected so a partner cannot inject
 * script through the footer that every one of their students sees.
 */
export function sanitizeLogoUrl(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return { ok: true, value: '' };
  if (raw.length > 40_000) return { ok: false, error: 'Logo image is too large.' };

  const dataMatch = raw.match(DATA_IMAGE);
  if (dataMatch) {
    const bytes = Buffer.from(dataMatch[2], 'base64');
    if (bytes.length === 0) return { ok: false, error: 'Logo image is empty.' };
    if (bytes.length > PARTNER_BRANDING_LIMITS.logoBytes) {
      return { ok: false, error: `Logo image must be ${Math.round(PARTNER_BRANDING_LIMITS.logoBytes / 1024)} KB or smaller.` };
    }
    return { ok: true, value: raw };
  }
  if (raw.length > PARTNER_BRANDING_LIMITS.logoUrl) return { ok: false, error: 'Logo URL is too long.' };
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return { ok: false, error: 'Logo URL must start with https://.' };
    if (parsed.username || parsed.password) return { ok: false, error: 'Logo URL must not contain credentials.' };
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, error: 'Logo must be an https:// image URL or an uploaded PNG/JPEG/WebP image.' };
  }
}

export function sanitizeWebsiteUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  try {
    const parsed = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    if (parsed.username || parsed.password) return '';
    return parsed.toString().slice(0, PARTNER_BRANDING_LIMITS.websiteUrl);
  } catch {
    return '';
  }
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // Strip control characters that would corrupt the rendered footer.
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Relative luminance (WCAG 2.1) so footer text keeps a readable contrast. */
function relativeLuminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Black or white — whichever reads better on the supplied colour. */
export function readableTextOn(hex: string): '#000000' | '#FFFFFF' {
  if (!isHexColor(hex)) return '#000000';
  return relativeLuminance(hex) > 0.45 ? '#000000' : '#FFFFFF';
}

export function buildPartnerFooterTheme(input: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}): PartnerFooterTheme {
  const primaryColor = normalizeHexColor(input.primaryColor, ALO_BRAND_COLORS.primary);
  const secondaryColor = normalizeHexColor(input.secondaryColor, ALO_BRAND_COLORS.secondary);
  const accentColor = normalizeHexColor(input.accentColor, ALO_BRAND_COLORS.accent);
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    onPrimary: readableTextOn(primaryColor),
    tint: `${primaryColor}14`, // 8% alpha, always a valid 8-digit hex
  };
}

export type BrandingValidation =
  | { ok: true; value: Required<Omit<PartnerBrandingInput, 'logoUrl'>> & { logoUrl: string } }
  | { ok: false; error: string; field?: string };

/**
 * Validates a partner's submitted branding. Unknown input is dropped rather
 * than stored, and every field is bounded so the footer cannot be used as an
 * unbounded content store.
 */
export function validatePartnerBranding(input: unknown): BrandingValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Branding payload must be an object.' };
  }
  const raw = input as Record<string, unknown>;

  for (const field of ['primaryColor', 'secondaryColor', 'accentColor'] as const) {
    if (raw[field] !== undefined && raw[field] !== '' && !isHexColor(raw[field])) {
      return { ok: false, error: 'Brand colours must be 6-digit hex values, e.g. #0066CC.', field };
    }
  }

  const logo = sanitizeLogoUrl(raw.logoUrl);
  if (!logo.ok) return { ok: false, error: logo.error, field: 'logoUrl' };

  const supportEmail = cleanText(raw.supportEmail, PARTNER_BRANDING_LIMITS.supportEmail);
  if (supportEmail && !SAFE_EMAIL.test(supportEmail)) {
    return { ok: false, error: 'Support email is not a valid address.', field: 'supportEmail' };
  }

  const primaryColor = normalizeHexColor(raw.primaryColor, ALO_BRAND_COLORS.primary);
  const secondaryColor = normalizeHexColor(raw.secondaryColor, ALO_BRAND_COLORS.secondary);
  // A partner accent that equals one of their other two colours makes the
  // footer look flat, so fall back to the ALO accent in that case.
  const requestedAccent = normalizeHexColor(raw.accentColor, ALO_BRAND_COLORS.accent);
  const accentColor = requestedAccent === primaryColor || requestedAccent === secondaryColor
    ? ALO_BRAND_COLORS.accent
    : requestedAccent;

  return {
    ok: true,
    value: {
      displayName: cleanText(raw.displayName, PARTNER_BRANDING_LIMITS.displayName),
      tagline: cleanText(raw.tagline, PARTNER_BRANDING_LIMITS.tagline),
      logoUrl: logo.value,
      primaryColor,
      secondaryColor,
      accentColor,
      websiteUrl: sanitizeWebsiteUrl(raw.websiteUrl),
      supportEmail,
      supportPhone: cleanText(raw.supportPhone, PARTNER_BRANDING_LIMITS.supportPhone),
      showInFooter: raw.showInFooter !== false,
    },
  };
}
