/**
 * ALO Education — canonical brand asset registry.
 *
 * Every surface that shows the ALO mark (public header/footer, portal footer,
 * letterhead, official documents) reads the path from here. Before this file
 * the same logo was referenced by three different filenames — including
 * `/images/landing/Copy of logo.webp`, whose spaces are re-encoded differently
 * by browsers, proxies and PDF renderers — so the brand could render three
 * different marks across the site and the printed paperwork.
 *
 * Rules encoded here:
 *   • The primary mark is `alo-education-logo.webp` (transparent, colour).
 *   • The official letterhead is `alo-edu-pad.jpg` — the A4 artwork supplied by
 *     ALO Education. Every official document is rendered on this letterhead.
 *   • The official seal is `alo-official-seal.png`. It is NEVER rendered for a
 *     public visitor: `OFFICIAL_SEAL.requiresSuperAdmin` is enforced by
 *     src/lib/documents/official-documents.ts, not by the caller.
 *
 * Assets live under /public/images/brand, which is inside the Next.js image
 * optimizer allowlist (`/images/**` in next.config.ts localPatterns).
 */

export const ALO_BRAND_ASSETS = {
  /** Primary ALO Education mark used in the public header and footer. */
  logo: '/images/brand/alo-education-logo.webp',
  /** Square favicon-style mark (already derived from the logo). */
  mark: '/icons/icon-192x192.png',
  /** A4 official letterhead artwork (header + footer already printed on it). */
  letterhead: '/images/brand/alo-edu-pad.jpg',
  /** ALO Education official company seal. Super Admin authority only. */
  seal: '/images/brand/alo-official-seal.png',
} as const;

export const ALO_BRAND_ALT = {
  logo: 'ALO Education logo',
  letterhead: 'ALO Education official letterhead',
  seal: 'ALO Education official seal',
} as const;

/**
 * Seal policy. Read-only facts so tests and UI copy agree with the server-side
 * authorisation check instead of each re-stating the rule.
 */
export const OFFICIAL_SEAL = {
  /** Only this authority may render the seal on any document. */
  requiredAuthority: 'SUPER_ADMIN',
  /** Document families the seal is used on. */
  appliesTo: ['salary-slip', 'offer-letter', 'employment-contract', 'experience-letter', 'partnership-agreement'] as const,
  /** Shown wherever a seal is intentionally withheld. */
  withheldNotice: 'Official seal withheld — issued without Super Admin authorisation.',
} as const;

export type SealDocumentKind = (typeof OFFICIAL_SEAL.appliesTo)[number];
