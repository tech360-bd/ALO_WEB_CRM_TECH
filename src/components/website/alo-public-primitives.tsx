'use client';

/**
 * ALO Education — shared public-page primitives.
 *
 * Every new public surface (English Test Hub, Country Comparison, AI tools,
 * Visa Support) is built from these pieces so the typography scale, spacing,
 * radius, status colours and trust/verification treatment stay identical
 * across the site.
 *
 * Rules enforced here (and therefore everywhere these are used):
 *   • No fabricated data. AsyncBlock renders a real empty state when an API
 *     returns nothing, and a real error state with retry when it fails.
 *   • Every factual panel can carry a source + last-verified line.
 *   • Status is never colour-only: StatusPill always renders text too.
 *   • Motion is limited to a short fade/rise and honours prefers-reduced-motion.
 */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, Info,
  Loader2, RefreshCw, Search, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Layout ─────────────────────────────────────────────────────── */

export const PUBLIC_MAX_WIDTH = 'max-w-[1280px]';

export function PublicFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', PUBLIC_MAX_WIDTH, className)}>
      {children}
    </div>
  );
}

export function PublicSection({
  className,
  children,
  as: Tag = 'section',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'section' | 'div';
}) {
  return (
    <Tag className={cn('py-12 sm:py-16', className)}>
      <PublicFrame>{children}</PublicFrame>
    </Tag>
  );
}

/* ── Breadcrumbs ────────────────────────────────────────────────── */

export interface Crumb {
  label: string;
  href?: string;
}

export function BreadcrumbTrail({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-alo-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-alo-brand transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'font-medium text-alo-text')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 text-alo-border-strong" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Headings ───────────────────────────────────────────────────── */

export function PageHeading({
  eyebrow,
  title,
  lede,
  className,
  maxWidth = 'max-w-[760px]',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <header className={cn(maxWidth, className)}>
      {eyebrow && (
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-alo-brand">
          {eyebrow}
        </p>
      )}
      <h1 className="text-h1 font-bold tracking-[-0.02em] text-alo-navy sm:text-[48px] sm:leading-[1.1]">
        {title}
      </h1>
      {lede && <p className="mt-4 text-body-lg text-alo-text-secondary">{lede}</p>}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn('mb-8 max-w-[760px]', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-alo-brand">
          {eyebrow}
        </p>
      )}
      <h2 className="text-h2 font-bold tracking-[-0.02em] text-alo-navy">{title}</h2>
      {lede && <p className="mt-3 text-[16px] leading-relaxed text-alo-text-secondary">{lede}</p>}
    </div>
  );
}

/* ── Panels ─────────────────────────────────────────────────────── */

export function Panel({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-alo-border bg-white shadow-sm',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-alo-border px-5 py-4 sm:px-6', className)}>
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold text-alo-navy">{title}</h3>
        {description && <p className="mt-1 text-[13px] text-alo-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Verification / trust ───────────────────────────────────────── */

/**
 * Renders the source + last-verified line that every data-driven page must
 * carry. If no verified date exists it says so instead of inventing one.
 */
export function VerificationNote({
  source,
  lastVerifiedAt,
  className,
}: {
  source?: string | null;
  lastVerifiedAt?: string | Date | null;
  className?: string;
}) {
  const hasSource = Boolean(source);
  const verified = formatDate(lastVerifiedAt);
  if (!hasSource && !verified) return null;
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-alo-text-muted', className)}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-alo-success" aria-hidden="true" />
      {verified && <span>Verified: {verified}</span>}
      {verified && hasSource && <span aria-hidden="true">·</span>}
      {hasSource && (
        <span className="truncate">
          Source: {source}
        </span>
      )}
    </p>
  );
}

export function DataDisclaimer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <p className={cn('flex gap-2 text-[12px] leading-relaxed text-alo-text-muted', className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {children ??
          'Information can change. Always verify final requirements with the university or the official government source.'}
      </span>
    </p>
  );
}

/* ── Status ─────────────────────────────────────────────────────── */

export type StatusTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const STATUS_TONES: Record<StatusTone, string> = {
  success: 'bg-alo-success-soft text-alo-success-dark border-alo-success/25',
  warning: 'bg-alo-warning-soft text-alo-warning border-alo-warning/25',
  info: 'bg-alo-brand-light text-alo-brand-deep border-alo-brand-border',
  danger: 'bg-alo-error-soft text-alo-error border-alo-error/25',
  neutral: 'bg-alo-surface-muted text-alo-text-secondary border-alo-border',
};

const STATUS_ICONS: Record<StatusTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  danger: CircleAlert,
  neutral: Info,
};

/** Status badge. Never colour-only — always renders a label and an icon. */
export function StatusPill({
  tone,
  label,
  className,
  showIcon = true,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = STATUS_ICONS[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-button border px-2 py-0.5 text-[12px] font-semibold',
        STATUS_TONES[tone],
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {label}
    </span>
  );
}

/* ── Metrics ────────────────────────────────────────────────────── */

/**
 * Compact metric tile. Follows the dashboard card spec: 14px label,
 * 28–36px value, 13px description, 20–24px padding.
 */
export function MetricTile({
  label,
  value,
  description,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Panel className={cn('p-5 sm:p-6', className)}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">{label}</p>
      <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.02em] text-alo-navy">{value}</p>
      {description && <p className="mt-2 text-[13px] text-alo-text-secondary">{description}</p>}
      {tone !== 'neutral' && (
        <span className="mt-3 block">
          <StatusPill tone={tone} label={description ? 'Updated' : 'Live'} showIcon={false} />
        </span>
      )}
    </Panel>
  );
}

/* ── Async states ───────────────────────────────────────────────── */

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'empty'; title: string; description?: string; action?: React.ReactNode }
  | { status: 'ready'; data: T };

/**
 * Single component for loading / error / empty / ready so no page can ship
 * without a proper state. The error copy is always actionable — never a bare
 * "Something went wrong."
 */
export function AsyncBlock<T>({
  state,
  loadingRows = 4,
  errorTitle = "We couldn't load this section.",
  resetAction,
  children,
}: {
  state: AsyncState<T>;
  loadingRows?: number;
  errorTitle?: string;
  resetAction?: { label: string; onClick: () => void };
  children: (data: T) => React.ReactNode;
}) {
  if (state.status === 'loading') {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading…</span>
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <Panel className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-alo-error-soft">
            <CircleAlert className="h-5 w-5 text-alo-error" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-alo-navy">{errorTitle}</h3>
            <p className="mt-0.5 text-[13px] text-alo-text-muted">{state.message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {state.onRetry && (
            <Button onClick={state.onRetry} className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
          )}
          {resetAction && (
            <Button variant="outline" onClick={resetAction.onClick} className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              {resetAction.label}
            </Button>
          )}
        </div>
      </Panel>
    );
  }

  if (state.status === 'empty') {
    return (
      <Panel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-alo-surface-muted">
          <Search className="h-5 w-5 text-alo-text-muted" aria-hidden="true" />
        </span>
        <h3 className="text-[16px] font-semibold text-alo-navy">{state.title}</h3>
        {state.description && <p className="max-w-[520px] text-[14px] text-alo-text-secondary">{state.description}</p>}
        {state.action}
      </Panel>
    );
  }

  return <>{children(state.data)}</>;
}

/** Renders a spinner-labelled row for inline (non-panel) loading states. */
export function InlineLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-alo-text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

/* ── Motion ─────────────────────────────────────────────────────── */

/**
 * Entrance wrapper: a short fade + 8px rise, once, when the element first
 * enters the viewport. Fully disabled for prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The pre-reveal state lives behind `motion-safe:` so a reduced-motion
  // preference never sees a hidden element or an animation.
  return (
    <div
      ref={ref}
      data-reveal={shown ? 'in' : 'out'}
      className={cn(
        'motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out',
        "motion-safe:data-[reveal='out']:translate-y-2 motion-safe:data-[reveal='out']:opacity-0",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

export function formatDate(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return `${count.toLocaleString('en-GB')} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}
