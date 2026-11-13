'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, AlertCircle, CheckCircle2, Siren, TimerOff } from 'lucide-react';
import { evaluateSlaClock, resolveSlaPolicy, toSlaChannel, toSlaPriority, toSlaIntent, type SlaState } from '@/lib/communications/sla-policy';

interface SlaCountdownBadgeProps {
  slaDueAt: string | Date | null;
  slaTriggeredAt?: string | Date | null;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Server-computed values. When the API already resolved the clock (it knows the
   * channel, priority and intent), passing them here keeps the badge and the
   * server from disagreeing — they are the same policy, this is just the cached
   * answer. Without them the badge resolves the policy itself from the channel.
   */
  channel?: string;
  priority?: string;
  intent?: string;
  slaState?: SlaState | 'none';
  slaDisplay?: string;
  /** True once staff have replied — the countdown is stopped and shown as such. */
  responded?: boolean;
}

type BadgeState = SlaState | 'none' | 'responded';

const STATE_ICONS: Record<BadgeState, React.ReactNode> = {
  // Icon + word carry the urgency as well as colour (spec §148) — colour alone is
  // never the signal.
  normal: <Clock className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  overdue: <AlertCircle className="w-3 h-3" />,
  critical: <Siren className="w-3 h-3" />,
  responded: <CheckCircle2 className="w-3 h-3" />,
  none: <Clock className="w-3 h-3" />,
};

const STATE_WORDS: Record<BadgeState, string> = {
  normal: 'WITHIN SLA',
  warning: 'WARNING',
  overdue: 'OVERDUE',
  critical: 'CRITICAL',
  responded: 'RESPONDED',
  none: 'NO SLA',
};

const STATE_CLASSES: Record<BadgeState, string> = {
  normal: 'bg-crm-success-bg text-crm-success-text border border-crm-success-border',
  warning: 'bg-crm-warning-bg text-crm-warning-text border border-crm-warning-border',
  overdue: 'bg-crm-danger-bg text-crm-danger-text border border-crm-danger-border',
  critical: 'bg-[var(--alo-error)] text-white border border-crm-danger-border font-extrabold',
  responded: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border border-[var(--alo-border-strong)]',
  none: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]',
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export default function SlaCountdownBadge({
  slaDueAt,
  slaTriggeredAt,
  size = 'md',
  channel,
  priority,
  intent,
  slaState,
  slaDisplay,
  responded = false,
}: SlaCountdownBadgeProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // 30s is enough for a minute-precision countdown and avoids re-rendering a
    // table of dozens of rows every second.
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!slaDueAt) {
    return (
      <Badge className={`${STATE_CLASSES.none} text-[11px] font-bold gap-1`}>
        <Clock className="w-3 h-3" /> NO SLA
      </Badge>
    );
  }

  const dueAt = new Date(slaDueAt);
  const sizeClasses = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : size === 'lg' ? 'text-xs px-3 py-1' : 'text-[11px] px-2 py-0.5';

  // A replied conversation shows its frozen outcome, not a live countdown.
  if (responded) {
    const respondedInTime = now.getTime() >= dueAt.getTime();
    return (
      <Badge className={`${STATE_CLASSES.responded} ${sizeClasses} font-mono font-bold flex items-center gap-1 whitespace-nowrap`}>
        {respondedInTime ? <CheckCircle2 className="w-3 h-3" /> : <TimerOff className="w-3 h-3" />}
        <span className="font-bold uppercase tracking-wide">{slaState === 'overdue' || slaState === 'critical' ? 'ANSWERED LATE' : 'RESPONDED'}</span>
      </Badge>
    );
  }

  // Prefer the server's answer; otherwise resolve exactly the same policy locally
  // so the two can never drift.
  let state: BadgeState = 'normal';
  let display = '';

  if (slaState && slaDisplay && slaState !== 'none') {
    state = slaState;
    display = slaDisplay;
  } else {
    const policy = resolveSlaPolicy({
      channel: toSlaChannel(channel),
      priority: toSlaPriority(priority),
      intent: toSlaIntent(intent),
    });
    const clock = evaluateSlaClock(dueAt, now, policy);
    state = clock.state;
    display = clock.display;
    if (!slaTriggeredAt) {
      // Without a trigger timestamp the fraction-of-allowance thresholds cannot be
      // trusted — fall back to the raw deadline comparison rather than showing a
      // warning the server would disagree with.
      const diffMs = dueAt.getTime() - now.getTime();
      if (diffMs > 0) {
        state = 'normal';
        display = `RESPONSE DUE IN: ${formatDuration(diffMs)}`;
      } else {
        const policyMs = policy.minutes * 60000;
        state = -diffMs >= policyMs * (policy.escalationAt - 1) ? 'critical' : 'overdue';
        display = `OVERDUE BY: ${formatDuration(diffMs)}`;
      }
    }
  }

  const ariaLabel = `${STATE_WORDS[state]}. ${display}`;

  return (
    <Badge
      className={`${STATE_CLASSES[state]} ${sizeClasses} font-mono font-bold flex items-center gap-1 whitespace-nowrap`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {STATE_ICONS[state]}
      <span className="font-bold uppercase tracking-wide">{STATE_WORDS[state]}:</span>
      <span>{display.replace(/^[A-Z ]+:\s*/, '')}</span>
    </Badge>
  );
}
