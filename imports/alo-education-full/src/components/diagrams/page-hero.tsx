'use client';

import React from 'react';
import { COLORS, RADIUS, type PageHeroConfig } from '@/lib/design-system';
import { ArrowRight, ChevronRight } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageHeroProps {
  /** Hero configuration */
  config?: PageHeroConfig;
  /** Overline text */
  overline?: string;
  /** Title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Visual variant */
  variant?: 'coral' | 'ink' | 'paper';
  /** Breadcrumbs */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Primary CTA label */
  primaryLabel?: string;
  /** Primary CTA click handler */
  onPrimaryClick?: () => void;
  /** Secondary CTA label */
  secondaryLabel?: string;
  /** Secondary CTA click handler */
  onSecondaryClick?: () => void;
  /** Custom class */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHero({
  config,
  overline,
  title,
  subtitle,
  backgroundImage,
  variant = 'ink',
  breadcrumbs,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
  className = '',
}: PageHeroProps) {
  const o = config?.overline ?? overline;
  const t = config?.title ?? title ?? 'Page Title';
  const st = config?.subtitle ?? subtitle;
  const bg = config?.backgroundImage ?? backgroundImage;
  const v = config?.variant ?? variant;
  const bc = config?.breadcrumbs ?? breadcrumbs;
  const pLabel = config?.primaryAction?.label ?? primaryLabel;
  const pClick = config?.primaryAction?.onClick ?? onPrimaryClick;
  const sLabel = config?.secondaryAction?.label ?? secondaryLabel;
  const sClick = config?.secondaryAction?.onClick ?? onSecondaryClick;

  // Variant colors
  const variantColors = {
    coral: { bg: COLORS.coral, text: COLORS.white, overline: COLORS.coralLight },
    ink: { bg: COLORS.ink, text: COLORS.white, overline: COLORS.coral },
    paper: { bg: COLORS.paper, text: COLORS.ink, overline: COLORS.coral },
  };
  const colors = variantColors[v];

  return (
    <section
      className={`relative w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
      style={{
        backgroundColor: bg ? undefined : colors.bg,
        backgroundImage: bg ? `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}cc), url(${bg})` : undefined,
        backgroundSize: bg ? 'cover' : undefined,
        backgroundPosition: bg ? 'center' : undefined,
      }}
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        {bc && bc.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm" style={{ color: colors.text }} >
              {bc.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  <li>
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className={i === bc.length - 1 ? 'font-semibold' : 'opacity-70'}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}

        {/* Overline */}
        {o && (
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: colors.overline, letterSpacing: '0.1em' }}
          >
            {o}
          </span>
        )}

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4"
          style={{ color: colors.text }}
        >
          {t}
        </h1>

        {/* Subtitle */}
        {st && (
          <p
            className="text-base sm:text-lg lg:text-xl leading-relaxed mb-8 opacity-85 max-w-2xl"
            style={{ color: colors.text }}
          >
            {st}
          </p>
        )}

        {/* CTA Buttons */}
        {(pLabel || sLabel) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {pLabel && (
              <button
                onClick={pClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-[6px] transition-all hover:opacity-90"
                style={{
                  backgroundColor: v === 'paper' ? COLORS.coral : COLORS.white,
                  color: v === 'paper' ? COLORS.white : COLORS.coral,
                }}
              >
                {pLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {sLabel && (
              <button
                onClick={sClick}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-[6px] border-2 transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  borderColor: v === 'paper' ? COLORS.ink : COLORS.white,
                }}
              >
                {sLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Decorative bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: COLORS.coral, opacity: 0.3 }}
      />
    </section>
  );
}

// ─── Convenience: Student Journey Hero ────────────────────────────────────────

export function StudentJourneyHero({ className }: { className?: string }) {
  return (
    <PageHero
      overline="Your Path to Global Education"
      title="The ALO Student Journey"
      subtitle="From your first inquiry to university enrolment — every step guided by expert counselors, proven processes, and personalized support."
      variant="ink"
      primaryLabel="Start Your Application"
      secondaryLabel="Explore Programs"
      breadcrumbs={[
        { label: 'Home', href: '#' },
        { label: 'Student Journey' },
      ]}
      className={className}
    />
  );
}
