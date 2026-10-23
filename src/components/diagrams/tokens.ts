/**
 * Diagram design tokens — ALO Education editorial skin.
 *
 * Source: cathrynlavery/diagram-design (style-guide.md). That skill ships a
 * default "cool editorial" skin (paper #f5f5f5, ink #2d3142, accent #eb6c36)
 * and its own onboarding rule: never ship default-skinned diagrams into a
 * branded project — re-skin the semantic tokens to the project brand first.
 *
 * This file is that re-skin. Roles are semantic (paper / ink / muted /
 * accent / link …), never raw hexes at call sites. Values map to the ALO
 * brand palette defined in src/app/globals.css (--alo-navy, --alo-brand,
 * --alo-cta …) so diagrams always match the site.
 *
 * Rules carried over from the source skill:
 *  - `accent` is editorial, not a flag: 1–2 focal elements per diagram max.
 *  - Mono is for technical content (ports, codes, labels); names go in sans.
 *  - Hairlines use the `rule` token; stronger borders use `ruleSolid`.
 */

export const diagramTokens = {
  /** Page background / default node fill */
  paper: '#FFFFFF',
  /** Diagram container background / secondary fill */
  paper2: '#F8FAFC',
  /** Primary text + primary stroke (ALO navy) */
  ink: '#0F172A',
  /** Secondary text + default arrow stroke */
  muted: '#64748B',
  /** Sublabels, boundary labels */
  soft: '#94A3B8',
  /** Hairline borders */
  rule: 'rgba(15, 23, 42, 0.12)',
  /** Stronger borders, baselines */
  ruleSolid: '#CBD5E1',
  /** Focal — 1–2 per diagram max (ALO CTA orange) */
  accent: '#E8501A',
  /** Fill for accent-bordered boxes */
  accentTint: 'rgba(249, 115, 22, 0.08)',
  /** External / API / link arrows (ALO brand blue) */
  link: '#0057B8',
  /** Success / positive state */
  success: '#10B981',
  /**
   * Series palette — multi-series charts only. Fills at 0.18 opacity,
   * strokes full color. Never backfill to non-chart diagram types.
   */
  series: ['#7C8F6F', '#5E7A9B', '#B8915A', '#9C6B50', '#6E6479'] as const,
} as const;

export type DiagramToken = keyof typeof diagramTokens;

/** Typography roles (mirrors the source skill's type scale). */
export const diagramType = {
  /** Human-readable node names — sans, 12px, 600 */
  nodeName: { size: 12, weight: 600, family: 'sans' },
  /** Ports, codes, field types — mono, 9px */
  sublabel: { size: 9, weight: 400, family: 'mono' },
  /** Type tags, axis labels — mono, 8px, uppercase, tracked 0.18em */
  eyebrow: { size: 8, weight: 500, family: 'mono' },
  /** Arrow annotations — mono, 8px, tracked 0.06em */
  arrowLabel: { size: 8, weight: 400, family: 'mono' },
} as const;

/**
 * Tailwind class fragments for SVG <text> elements. SVG text accepts Tailwind
 * utilities, which keeps diagrams consistent with the site type scale.
 */
export const diagramTypeClasses = {
  nodeName: 'font-sans text-[12px] font-semibold fill-current',
  sublabel: 'font-mono text-[11px] fill-current',
  eyebrow: 'font-mono text-[11px] font-medium uppercase tracking-[0.18em] fill-current',
  arrowLabel: 'font-mono text-[11px] uppercase tracking-[0.06em] fill-current',
} as const;
