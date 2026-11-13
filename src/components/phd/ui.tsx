'use client';

import * as React from 'react';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/** Small fetch hook with explicit loading / error / empty handling. */
export function useApi<T>(url: string | null) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(url));

  const load = React.useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as { error?: string }).error;
        throw new Error(message || `The request failed (${res.status}).`);
      }
      setData(json as T);
      setError(null);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'The request failed.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

/** Sends JSON and returns the parsed body, throwing the server's message on error. */
export async function apiSend<T = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const payload = json as { error?: string; issues?: Array<{ path: string; message: string }> };
    const detail = payload.issues?.length
      ? ` (${payload.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')})`
      : '';
    throw new Error((payload.error || `The request failed (${res.status}).`) + detail);
  }
  return json as T;
}

/** The applicant's default project, provisioned on first use. */
export function useProjectId() {
  const { data, error, loading } = useApi<{ projects: Array<{ id: string; title: string }> }>('/api/phd/projects');
  const project = data?.projects?.[0] ?? null;
  return { projectId: project?.id ?? null, project, error, loading };
}

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-2xl border border-[var(--alo-border)] bg-white p-5', className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-[var(--alo-text)]">{title}</h2>}
            {description && <p className="mt-1 text-xs text-[var(--alo-text-muted)]">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-[var(--alo-brand)] text-white',
    outline: 'border border-[var(--alo-border)] text-[var(--alo-text)]',
    ghost: 'text-[var(--alo-body)] hover:bg-[var(--alo-page)]',
    danger: 'border border-crm-danger-border text-crm-danger-text',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold text-[var(--alo-text)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[var(--alo-text-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-[var(--alo-border)] bg-white px-3 py-2 text-sm text-[var(--alo-text)]';

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'ok' | 'warn' | 'bad' | 'info' }) {
  const tones: Record<string, string> = {
    default: 'bg-[var(--alo-page)] text-[var(--alo-text)]',
    ok: 'bg-crm-success-bg text-crm-success-text',
    warn: 'bg-crm-warning-bg text-crm-warning-text',
    bad: 'bg-crm-danger-bg text-crm-danger-text',
    info: 'bg-sky-50 text-sky-800',
  };
  return <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', tones[tone])}>{children}</span>;
}

export function verificationTone(status: string): 'ok' | 'warn' | 'bad' | 'default' {
  const value = status.toUpperCase();
  if (value === 'VERIFIED_OFFICIAL' || value === 'VERIFIED') return 'ok';
  if (value === 'PARTIALLY_VERIFIED' || value === 'CONFIRMED_UNVERIFIED' || value === 'NEEDS_REVIEW') return 'warn';
  if (value === 'SOURCE_UNAVAILABLE' || value === 'CONFLICT' || value === 'REJECTED') return 'bad';
  return 'default';
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--alo-border)] p-6 text-center">
      <p className="text-sm font-semibold text-[var(--alo-text)]">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-xs text-[var(--alo-text-muted)]">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-crm-danger-border bg-crm-danger-bg p-4 text-sm text-crm-danger-text">
      {message}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-6 text-center text-sm text-[var(--alo-text-muted)]">{label}</p>;
}

export function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--alo-border)] text-[11px] uppercase tracking-wide text-[var(--alo-text-muted)]">
            {head.map((cell) => (
              <th key={cell} className="py-2 pr-4 font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--alo-border)]/60 align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
}

export function formatMoney(amountMinor: number | null | undefined, currency: string | null | undefined): string {
  if (amountMinor === null || amountMinor === undefined) return 'Unknown';
  const code = (currency || 'GBP').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toLocaleString('en-GB')} ${code}`;
  }
}
