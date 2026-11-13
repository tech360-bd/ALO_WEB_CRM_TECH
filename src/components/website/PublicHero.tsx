'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Public page hero (Master §08).
 *
 * One implementation of the inner-page band, shared by every public route so
 * the site has a single hero system instead of a dozen hand-rolled headers:
 *
 *   • pale-blue surface, never a dark photo overlay or black section
 *   • 11px uppercase eyebrow with a status dot (colour + dot, never colour alone)
 *   • 30 → 42px Montserrat headline, 1.12 line-height
 *   • 15–16px body deck capped at 62 characters per line
 *   • optional `slot` for the variant-specific content:
 *       Variant B — the course finder itself
 *       Variant C — destination tiles
 *   • honours `prefers-reduced-motion`
 *
 * Route pages that wrap content in their own <main> can use this directly;
 * `PublicShell` (public-pages/PublicPages.tsx) uses it for the pages that also
 * need the back link and content column.
 */
export function PublicHero({
  title,
  subtitle,
  badge,
  accent = 'brand',
  slot,
  above,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: 'brand' | 'cta';
  /** Variant-specific content rendered inside the band (finder, tiles…). */
  slot?: React.ReactNode;
  /** Breadcrumb / back link rendered at the top of the band. */
  above?: React.ReactNode;
  /** Free-form content rendered under the deck (kept for backwards compatibility). */
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const dot = accent === 'cta' ? 'bg-[var(--alo-cta)]' : 'bg-[var(--alo-brand)]';
  const label = accent === 'cta' ? 'text-[var(--alo-cta-active)]' : 'text-[var(--alo-brand)]';

  return (
    <section className="border-b border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
        {above && <div className="mb-6">{above}</div>}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="max-w-4xl"
        >
          {badge && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-secondary)] ring-1 ring-inset ring-[var(--alo-border)]">
              <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
              <span className={label}>{badge}</span>
            </span>
          )}
          <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--alo-text)] sm:text-[36px] lg:text-[42px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-[var(--alo-body)] sm:text-base">
              {subtitle}
            </p>
          )}
          {slot && <div className="mt-7">{slot}</div>}
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export default PublicHero;
