'use client';

/**
 * Shared building blocks for student portal pages.
 *
 * The portal must not look like the marketing site: dense, functional, with
 * explicit loading, error-with-retry and empty states (spec §86, §87). Every
 * page that lists student data uses these so no page invents its own.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type ResourceState = 'idle' | 'loading' | 'ready' | 'error';

export interface ResourceResult<T> {
  data: T | null;
  state: ResourceState;
  error: string | null;
  reload: () => void;
}

/**
 * Fetch a student-scoped resource once, with retry. Credentials are included so
 * the HttpOnly session cookie is sent; no token is ever read from storage here.
 */
export function useStudentResource<T>(path: string, deps: unknown[] = []): ResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<ResourceState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // A dynamic route can render before its params resolve. Stay in a loading
    // state rather than issuing a request to the page's own URL.
    if (!path) {
      setState('idle');
      return;
    }

    const controller = new AbortController();
    setState('loading');
    setError(null);

    (async () => {
      try {
        const response = await fetch(path, { credentials: 'include', signal: controller.signal });
        if (response.status === 401 || response.status === 403) {
          throw new Error('You need to sign in again to view this.');
        }
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || `Request failed with status ${response.status}.`);
        }
        if (!mounted.current) return;
        setData(payload as T);
        setState('ready');
      } catch (caught) {
        if (!mounted.current || (caught as Error).name === 'AbortError') return;
        setError((caught as Error).message || 'Something interrupted the request.');
        setState('error');
      }
    })();

    return () => controller.abort();
  }, [path, attempt, ...deps]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, state, error, reload };
}

export function PortalPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-[var(--alo-text)]">{title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-text-muted)]">{description}</p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function PortalCard({
  title,
  description,
  action,
  icon,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional leading icon rendered inside the card heading. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-[var(--alo-border)] bg-white', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center text-[14px] font-semibold text-[var(--alo-text)]">
                {icon}
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Heading for a section rendered inside a PortalCard without its own title. */
export function PortalSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center border-b border-[var(--alo-border)] px-5 py-4 text-[14px] font-semibold text-[var(--alo-text)]">
      {children}
    </h2>
  );
}

export function PortalLoading({ rows = 4, label }: { rows?: number; label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="text-[12px] font-medium text-[var(--alo-text-muted)]">{label ?? 'Loading…'}</p>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PortalError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-5 sm:flex-row sm:items-center">
      <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-red-900">We could not load this</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-red-800">{message}</p>
      </div>
      <Button variant="outline" className=" shrink-0 rounded-button border-red-300 bg-white px-4 text-[13px] font-semibold text-red-700" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
        Try Again
      </Button>
    </div>
  );
}

export function PortalEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Inbox className="h-8 w-8 text-[var(--alo-placeholder)]" aria-hidden="true" />
      <h3 className="text-[15px] font-semibold text-[var(--alo-text)]">{title}</h3>
      <p className="max-w-[460px] text-[13px] leading-relaxed text-[var(--alo-text-muted)]">{description}</p>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  in_progress: 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  IN_PROGRESS: 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
  overdue: 'border-red-200 bg-red-50 text-red-800',
  refunded: 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]',
};

/**
 * Status is never communicated by colour alone — the text is always rendered
 * next to the tone (spec §84).
 */
export function StatusBadge({ value }: { value: string }) {
  const tone = STATUS_TONE[value] ?? 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]';
  const label = value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return (
    <span className={cn('inline-flex items-center rounded-button border px-2 py-0.5 text-[11px] font-semibold', tone)}>
      {label}
    </span>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  URGENT: 'border-red-200 bg-red-50 text-red-800',
  HIGH: 'border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  MEDIUM: 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  LOW: 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]',
};

export function PriorityBadge({ value }: { value: string }) {
  const tone = PRIORITY_TONE[value?.toUpperCase()] ?? 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]';
  const label = (value || 'Medium').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return (
    <span className={cn('inline-flex items-center rounded-button border px-2 py-0.5 text-[11px] font-semibold', tone)}>
      {label}
    </span>
  );
}
