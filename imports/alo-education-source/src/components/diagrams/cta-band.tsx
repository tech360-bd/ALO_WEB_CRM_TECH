'use client';

import React from 'react';
import { COLORS, RADIUS, type CtaBandConfig } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CtaBandProps {
  /** CTA configuration */
  config?: CtaBandConfig;
  /** Heading text */
  heading?: string;
  /** Description text */
  description?: string;
  /** Primary button label */
  primaryLabel?: string;
  /** Primary button click handler */
  onPrimaryClick?: () => void;
  /** Secondary button label */
  secondaryLabel?: string;
  /** Secondary button click handler */
  onSecondaryClick?: () => void;
  /** Visual variant */
  variant?: 'coral' | 'ink' | 'paper';
  /** Custom class */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CtaBand({
  config,
  heading,
  description,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
  variant = 'coral',
  className = '',
}: CtaBandProps) {
  const cfg = config;
  const h = cfg?.heading ?? heading ?? 'Start Your Application Today';
  const d = cfg?.description ?? description ?? 'Join thousands of students who have achieved their study abroad dreams with ALO Education. Our expert counselors are ready to guide you every step of the way.';
  const pLabel = cfg?.primaryAction.label ?? primaryLabel ?? 'Start Your Application';
  const pClick = cfg?.primaryAction.onClick ?? onPrimaryClick;
  const sLabel = cfg?.secondaryAction?.label ?? secondaryLabel;
  const sClick = cfg?.secondaryAction?.onClick ?? onSecondaryClick;
  const v = cfg?.variant ?? variant;

  // Variant styles
  const variantStyles = {
    coral: {
      bg: COLORS.coral,
      text: COLORS.white,
      secondaryBg: 'transparent',
      secondaryText: COLORS.white,
      secondaryBorder: COLORS.white,
    },
    ink: {
      bg: COLORS.ink,
      text: COLORS.white,
      secondaryBg: 'transparent',
      secondaryText: COLORS.white,
      secondaryBorder: COLORS.white,
    },
    paper: {
      bg: COLORS.paper,
      text: COLORS.ink,
      secondaryBg: 'transparent',
      secondaryText: COLORS.ink,
      secondaryBorder: COLORS.ink,
    },
  };

  const style = variantStyles[v];

  return (
    <div
      className={`w-full py-16 px-4 sm:px-6 lg:px-8 ${className}`}
      style={{ backgroundColor: style.bg }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-4"
          style={{ color: style.text }}
        >
          {h}
        </h2>
        {d && (
          <p
            className="text-base sm:text-lg mb-8 opacity-90"
            style={{ color: style.text }}
          >
            {d}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary button */}
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

          {/* Secondary button */}
          {sLabel && (
            <button
              onClick={sClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold rounded-[6px] border-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: style.secondaryBg,
                color: style.secondaryText,
                borderColor: style.secondaryBorder,
              }}
            >
              {sLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Convenience: Default Student CTA ────────────────────────────────────────

export function StudentCtaBand({ className }: { className?: string }) {
  return (
    <CtaBand
      heading="Ready to Begin Your Journey?"
      description="From first consultation to university enrolment — ALO Education guides you through every step with expert care and proven results."
      primaryLabel="Start Your Application"
      secondaryLabel="Book a Free Consultation"
      variant="coral"
      className={className}
    />
  );
}
