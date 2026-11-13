'use client';

/**
 * Reusable "Take the English Test" call-to-action.
 *
 * Every variant links to ENGLISH_EXAM_PLATFORM_URL in the SAME tab (no
 * target="_blank") and tracks the click without blocking navigation. The
 * exam itself lives on the English Test Platform, not in this site.
 */

import Link from 'next/link';
import type { AriaRole, ReactNode } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { trackEnglishExamCtaClick } from '@/lib/analytics/cta-tracking';
import {
  ENGLISH_EXAM_COPY,
  ENGLISH_EXAM_PLATFORM_HOST,
  ENGLISH_EXAM_PLATFORM_URL,
  type EnglishExamCtaLocation,
} from '@/lib/english-exam';

const COPY = ENGLISH_EXAM_COPY;

function makeClickHandler(location: EnglishExamCtaLocation, onNavigate?: () => void) {
  return () => {
    // Tracking first; it never blocks, and we never call preventDefault().
    trackEnglishExamCtaClick(location);
    onNavigate?.();
  };
}

/* ─────────────────────────── Generic button / link ─────────────────────────── */

export interface EnglishExamButtonProps {
  location: EnglishExamCtaLocation;
  /** Visible label. Pass a translated string from navigation contexts. */
  label?: string;
  className?: string;
  children?: ReactNode;
  onNavigate?: () => void;
  role?: AriaRole;
}

/** Plain same-tab anchor to the English Test Platform. Caller supplies styling. */
export function EnglishExamButton({ location, label, className, children, onNavigate, role }: EnglishExamButtonProps) {
  return (
    <a
      href={ENGLISH_EXAM_PLATFORM_URL}
      onClick={makeClickHandler(location, onNavigate)}
      data-cta="english-exam"
      data-location={location}
      role={role}
      className={className}
    >
      {children ?? label ?? COPY.en.button}
    </a>
  );
}

/* ─────────────────────────────── Homepage banner ───────────────────────────── */

export function EnglishExamBanner({ location = 'homepage_banner' }: { location?: EnglishExamCtaLocation }) {
  return (
    <section aria-labelledby="english-exam-banner-title" className="bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--alo-brand)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            {COPY.en.preparationLabel}
          </span>
          <h2 id="english-exam-banner-title" className="mt-3 text-xl font-bold sm:text-2xl text-[var(--alo-text)]">
            {COPY.bn.question}
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--alo-body)] sm:text-base">{COPY.en.question}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--alo-body)]">{COPY.bn.promotion}</p>
          <p className="mt-1 text-xs text-[var(--alo-text-muted)]">{COPY.en.promotion}</p>
          <Link href="/student/english-test" className="mt-2 inline-flex items-center text-sm font-semibold underline underline-offset-4 text-[var(--alo-brand)] hover:text-[var(--alo-brand-hover)]">Open student English-test page →</Link>
          <p className="mt-2 text-xs text-[var(--alo-text-muted)]">{COPY.en.leaving}</p>
        </div>
        <EnglishExamButton
          location={location}
          className="inline-flex min-h-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white px-6 py-3 text-center text-[var(--alo-brand)] shadow-sm transition hover:bg-[var(--alo-brand-light)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--alo-brand-border)]"
        >
          <span className="text-base font-bold">{COPY.bn.button}</span>
          <span className="text-xs font-semibold">
            {COPY.en.button} <span aria-hidden="true">→</span>
          </span>
        </EnglishExamButton>
      </div>
    </section>
  );
}

/* ──────────────────── Preparation vs real exam (hub + detail pages) ─────────── */

export function PrepVsExamSplit({
  location,
  prepHref,
  prepTitle,
  prepCta,
}: {
  location: EnglishExamCtaLocation;
  prepHref: string;
  prepTitle: string;
  prepCta: string;
}) {
  return (
    <section aria-label="Preparation and real exam" className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm">
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--alo-brand-pale)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--alo-brand)]">
          {COPY.en.preparationLabel}
        </span>
        <h3 className="mt-3 text-lg font-bold text-[var(--alo-text)]">{prepTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--alo-body)]">{COPY.en.preparationBody}</p>
        <Link
 href={prepHref}
 className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 pt-4 text-sm font-semibold text-[var(--alo-brand)] hover:text-[var(--alo-brand-hover)]"
 >
          {prepCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col rounded-3xl border border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)] p-6 shadow-sm">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--alo-cta)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
          {COPY.en.realExamLabel}
        </span>
        <h3 className="mt-3 text-lg font-bold text-[var(--alo-text)]">{COPY.en.question}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--alo-body)]">{COPY.en.realExamBody}</p>
        <p className="mt-2 text-xs text-[var(--alo-text-muted)]">{COPY.en.leaving}</p>
        <EnglishExamButton
          location={location}
          className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-[var(--alo-cta)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--alo-cta-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--alo-brand-border)]"
        >
          {COPY.bn.button} · {COPY.en.button} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </EnglishExamButton>
      </div>
    </section>
  );
}

/* ───────────────────────────── Sidebar / inline card ───────────────────────── */

export function EnglishExamCard({ location, testName }: { location: EnglishExamCtaLocation; testName?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)] p-5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--alo-cta)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        <GraduationCap className="h-3 w-3" aria-hidden="true" />
        {COPY.en.realExamLabel}
      </span>
      <p className="mt-3 text-sm font-bold text-[var(--alo-text)]">
        {testName ? `Ready to sit the ${testName}?` : COPY.en.question}
      </p>
      <p className="mt-1 text-xs text-[var(--alo-body)]">{COPY.en.realExamBody}</p>
      <EnglishExamButton
        location={location}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--alo-cta)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--alo-cta-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--alo-brand-border)]"
      >
        {COPY.en.button} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </EnglishExamButton>
      <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">{ENGLISH_EXAM_PLATFORM_HOST}</p>
    </div>
  );
}

