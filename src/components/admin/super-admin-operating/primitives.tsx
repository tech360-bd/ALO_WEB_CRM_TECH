'use client';

// ============================================================
// ALO EDUCATION — Super Admin dashboard primitives
//
// Small presentational building blocks shared by every section of the
// operating dashboard. Keeping them here means the loading / empty /
// error states are identical everywhere instead of re-invented per panel.
// ============================================================

import * as React from 'react';

export const TOKENS = {
  primary: '#0057B8',
  cta: '#E8501A',
  text: '#0F172A',
  soft: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export function Section({
  id,
  title,
  description,
  badge,
  right,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="col-span-12 rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
      style={{ borderColor: TOKENS.border }}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold sm:text-lg" style={{ color: TOKENS.text }}>{title}</h2>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">{description}</p>
          ) : null}
        </div>
        {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function Skeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-9 w-full animate-pulse rounded-md"
          style={{ backgroundColor: TOKENS.soft }}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="rounded-xl border border-dashed px-4 py-6 text-center"
      style={{ borderColor: TOKENS.border, backgroundColor: TOKENS.soft }}
    >
      <p className="text-sm font-medium" style={{ color: TOKENS.text }}>{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{ borderColor: TOKENS.danger, backgroundColor: '#FEF2F2' }}
      role="alert"
    >
      <p className="text-sm font-medium" style={{ color: TOKENS.danger }}>Could not load this section</p>
      <p className="mt-1 text-xs text-slate-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
          style={{ borderColor: TOKENS.border, color: TOKENS.text }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  ok: { bg: '#ECFDF5', fg: '#047857' },
  positive: { bg: '#ECFDF5', fg: '#047857' },
  attention: { bg: '#FFFBEB', fg: '#B45309' },
  warning: { bg: '#FFFBEB', fg: '#B45309' },
  critical: { bg: '#FEF2F2', fg: '#B91C1C' },
  danger: { bg: '#FEF2F2', fg: '#B91C1C' },
  unknown: { bg: '#F1F5F9', fg: '#475569' },
  neutral: { bg: '#F1F5F9', fg: '#475569' },
  info: { bg: '#EFF6FF', fg: '#1D4ED8' },
};

export function StatusPill({ tone = 'neutral', children }: { tone?: keyof typeof STATUS_TONES | string; children: React.ReactNode }) {
  const style = STATUS_TONES[tone] || STATUS_TONES.neutral;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {children}
    </span>
  );
}

export function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  const color = tone === 'danger' ? TOKENS.danger
    : tone === 'warning' ? TOKENS.warning
      : tone === 'positive' ? TOKENS.success
        : TOKENS.text;
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed py-1 last:border-0" style={{ borderColor: TOKENS.border }}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  type = 'button',
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'cta' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: TOKENS.primary, color: '#FFFFFF', borderColor: TOKENS.primary },
    cta: { backgroundColor: TOKENS.cta, color: '#FFFFFF', borderColor: TOKENS.cta },
    secondary: { backgroundColor: '#FFFFFF', color: TOKENS.text, borderColor: TOKENS.border },
    danger: { backgroundColor: '#FFFFFF', color: TOKENS.danger, borderColor: TOKENS.danger },
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

/** Human sentence for a KPI that could not be computed. */
export function unavailableText(reason?: string): string {
  return reason ? `Not available — ${reason}` : 'Not available';
}
