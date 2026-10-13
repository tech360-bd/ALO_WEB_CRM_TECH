'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, Timer } from 'lucide-react';

interface SlaCountdownProps {
  /** When the SLA is due. Null = no SLA configured. */
  dueAt: Date | string | null;
  /** When the SLA clock started (used to compute remaining % of total time). */
  createdAt: Date | string;
  /** Optional className override. */
  className?: string;
  /** Show the verbose label (e.g. "Response due in"). Default true. */
  verbose?: boolean;
}

type SlaState = 'NO_SLA' | 'NORMAL' | 'WARNING' | 'OVERDUE' | 'CRITICAL';

interface SlaBreakdown {
  state: SlaState;
  /** Positive = time remaining; negative = time overdue (seconds). */
  diffSeconds: number;
  /** Total SLA window in seconds (dueAt - createdAt). */
  totalSeconds: number;
  /** Human label e.g. "Response due in: 02:34:11" or "OVERDUE BY: 00:15:00". */
  label: string;
  /** Tailwind classes for the badge. */
  badgeClass: string;
  /** Icon to display. */
  Icon: typeof Clock;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatHMS(totalSecondsRaw: number): string {
  const total = Math.max(0, Math.floor(totalSecondsRaw));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function toDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

function computeBreakdown(
  dueAt: Date | null,
  createdAt: Date,
  now: Date
): SlaBreakdown {
  if (!dueAt) {
    return {
      state: 'NO_SLA',
      diffSeconds: 0,
      totalSeconds: 0,
      label: 'No SLA',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      Icon: Clock,
    };
  }

  const totalSeconds = Math.max(
    1,
    Math.floor((dueAt.getTime() - createdAt.getTime()) / 1000)
  );
  const diffSeconds = Math.floor((dueAt.getTime() - now.getTime()) / 1000);
  const isOverdue = diffSeconds < 0;
  const remainingRatio = diffSeconds / totalSeconds;

  if (isOverdue) {
    // Critical = overdue by more than 100% of the original window (i.e. >2x overdue)
    const overdueRatio = Math.abs(diffSeconds) / totalSeconds;
    if (overdueRatio >= 1) {
      return {
        state: 'CRITICAL',
        diffSeconds,
        totalSeconds,
        label: `OVERDUE BY: ${formatHMS(Math.abs(diffSeconds))}`,
        badgeClass:
          'bg-red-600 text-white border-red-700 font-bold animate-pulse',
        Icon: AlertTriangle,
      };
    }
    return {
      state: 'OVERDUE',
      diffSeconds,
      totalSeconds,
      label: `OVERDUE BY: ${formatHMS(Math.abs(diffSeconds))}`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
      Icon: AlertTriangle,
    };
  }

  // Warning: <50% of total time remaining
  if (remainingRatio <= 0.5) {
    return {
      state: 'WARNING',
      diffSeconds,
      totalSeconds,
      label: `Response due in: ${formatHMS(diffSeconds)}`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      Icon: Timer,
    };
  }

  // Normal: more than 50% remaining
  return {
    state: 'NORMAL',
    diffSeconds,
    totalSeconds,
    label: `Response due in: ${formatHMS(diffSeconds)}`,
    badgeClass: 'bg-blue-50 text-[#0057B8] border-blue-100 font-medium',
    Icon: Clock,
  };
}

/**
 * SlaCountdown — small badge-style countdown for an SLA deadline.
 *
 * Visual states (text labels, not just color, for accessibility):
 *  - NO SLA (gray)   — "No SLA"
 *  - NORMAL (blue)   — "Response due in: HH:MM:SS"
 *  - WARNING (yellow)— "Response due in: HH:MM:SS" (under 50% time left)
 *  - OVERDUE (red)   — "OVERDUE BY: HH:MM:SS"
 *  - CRITICAL (red bold, pulsing) — overdue by more than 100% of SLA window
 */
export function SlaCountdown({
  dueAt,
  createdAt,
  className,
  verbose = true,
}: SlaCountdownProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Tick every second. Only runs after mount to avoid SSR/CSR mismatch.
  // The initial setNow is deferred via setTimeout(0) so the effect body does
  // not call setState synchronously (avoids cascading renders warning).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const startTimer = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, 0);
    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, []);

  const createdDate = toDate(createdAt);
  const dueDate = dueAt ? toDate(dueAt) : null;
  const breakdown = computeBreakdown(dueDate, createdDate, now ?? createdDate);

  const { label, badgeClass, Icon } = breakdown;

  if (breakdown.state === 'NO_SLA' && !verbose) {
    return null;
  }

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight whitespace-nowrap',
        badgeClass,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default SlaCountdown;
