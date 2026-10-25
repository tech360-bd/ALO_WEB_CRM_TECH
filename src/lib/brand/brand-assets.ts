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
 *   • The official seal is deliberately NOT a public asset and has no entry
 *     here: a `/public` URL would let anyone download the company seal
 *     without any authorisation. The seal bytes live server-side only
 *     (`src/lib/documents/assets/alo-official-seal.png`) and reach a document
 *     exclusively through `src/lib/documents/official-documents.ts` (server
 *     rendering) or the audited `GET /api/official-documents/seal` route —
 *     both gated on `OFFICIAL_SEAL.requiredAuthority`.
 *
 * Public assets live under /public/images/brand, which is inside the Next.js
 * image optimizer allowlist (`/images/**` in next.config.ts localPatterns).
 */

export const ALO_BRAND_ASSETS = {
  /** Primary ALO Education mark used in the public header and footer. */
  logo: '/images/brand/alo-education-logo.webp',
  /** Square favicon-style mark (already derived from the logo). */
  mark: '/icons/icon-192x192.png',
  /** A4 official letterhead artwork (header + footer already printed on it). */
  letterhead: '/images/brand/alo-edu-pad.jpg',
  // No `seal` entry: the official seal must never have a public URL (above).
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

/**
 * Client-safe authority check shared by the server seal policy
 * (`isSealAuthorized`) and UI hints that merely decide whether to *offer*
 * the seal. UI use is never the security boundary — the server re-checks,
 * denies acting-as sessions, and audits access.
 */
export function hasSuperAdminAuthority(values: Array<string | null | undefined>): boolean {
  return values.some(
    (value) => typeof value === 'string' && value.trim().toUpperCase() === OFFICIAL_SEAL.requiredAuthority,
  );
}
