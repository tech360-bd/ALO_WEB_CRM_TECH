'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlarmClock, CheckCircle2, Loader2, Lock, PlayCircle, Timer } from 'lucide-react';

/**
 * 72-hour practice window panel (spec §38).
 *
 * Shows the real remaining time from the server, ticked locally once per
 * second. The state is re-fetched when the countdown reaches zero so the panel
 * moves to the counselor-extension state instead of silently reading 00:00:00
 * forever. Practice history is never hidden or deleted by expiry.
 */

export interface PracticeWindowState {
  status: 'NOT_STARTED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'EXTENDED' | 'CLOSED';
  effectiveEndsAt: string | null;
  startsAt: string | null;
  remainingMs: number;
  remainingHours: number;
  expiringSoon: boolean;
  extended: boolean;
  expired: boolean;
  historyRetained: true;
}

export interface PracticeWindowResponse {
  window: PracticeWindowState;
  windowHours: number;
  canPractise: boolean;
  practice: { sessions: number; completed: number };
  extensionPolicy?: string;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  EXTENDED: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  EXPIRING: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  EXPIRED: 'border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)]',
  CLOSED: 'border-[var(--alo-border)] bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]',
  NOT_STARTED: 'border-[var(--alo-border)] bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]',
};

function splitCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

export default function PracticeWindowPanel({ applicationId }: { applicationId?: string | null }) {
  const [data, setData] = useState<PracticeWindowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : '';
      const response = await fetch(`/api/student/interview-practice/window${query}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Practice window is unavailable.');
      setData(payload as PracticeWindowResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Practice window is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = useMemo(() => {
    const end = data?.window.effectiveEndsAt ? new Date(data.window.effectiveEndsAt).getTime() : null;
    if (!end) return 0;
    return Math.max(0, end - now);
  }, [data, now]);

  // Re-fetch exactly once when the local countdown crosses zero, so the server
  // decides the authoritative state (it may already have been extended).
  const [refetchedFor, setRefetchedFor] = useState<string | null>(null);
  useEffect(() => {
    const end = data?.window.effectiveEndsAt;
    if (!end || remainingMs > 0) return;
    if (data?.window.status === 'EXPIRED' || data?.window.status === 'CLOSED') return;
    if (refetchedFor === end) return;
    setRefetchedFor(end);
    void load();
  }, [remainingMs, data, refetchedFor, load]);

  const openWindow = useCallback(async (action: 'start' | 'restart') => {
    setOpening(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/student/interview-practice/window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, applicationId: applicationId ?? '' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'The practice window could not be opened.');
      setNotice(payload.alreadyOpen ? 'Your practice window was already open.' : 'Your practice window is open.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The practice window could not be opened.');
    } finally {
      setOpening(false);
    }
  }, [applicationId, load]);

  if (loading && !data) {
    return (
      <Card className="rounded-2xl border-[var(--alo-border)]" aria-busy="true">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-[var(--alo-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking your practice window…
        </CardContent>
      </Card>
    );
  }

  const state = data?.window;
  const countdown = splitCountdown(remainingMs);
  const active = Boolean(data?.canPractise);

  return (
    <Card className="rounded-2xl border-[var(--alo-border)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-[var(--alo-brand)]" aria-hidden />
            Interview practice window
          </CardTitle>
          {state && (
            <Badge variant="outline" className={STATUS_STYLE[state.status] ?? STATUS_STYLE.NOT_STARTED}>{state.status.replace('_', ' ')}</Badge>
          )}
        </div>
        <p className="text-xs text-[var(--alo-text-muted)]">
          Access runs for {data?.windowHours ?? 72} hours once you open it. Your practice history stays available after it ends.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {state?.status === 'NOT_STARTED' ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--alo-body)]">
              Open your practice window when you are ready to start practising — the clock begins immediately.
            </p>
            <Button onClick={() => void openWindow('start')} disabled={opening} variant="brand">
              {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <PlayCircle className="mr-2 h-4 w-4" aria-hidden />}
              {opening ? 'Opening…' : `Start ${data?.windowHours ?? 72}-hour practice`}
            </Button>
          </div>
        ) : active ? (
          <div className="space-y-3">
            <div className="flex items-end gap-2" role="timer" aria-live="off" aria-label="Time remaining">
              {[countdown.hours, countdown.minutes, countdown.seconds].map((value, index) => (
                <div key={index} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] px-3 py-2 text-center">
                  <p className="font-mono text-2xl font-bold tabular-nums text-[var(--alo-text)]">{pad(value)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--alo-text-muted)]">{['hrs', 'min', 'sec'][index]}</p>
                </div>
              ))}
              {state?.expiringSoon && (
                <p className="flex items-center gap-1 pb-2 text-xs font-semibold text-[var(--crm-warning-text)]">
                  <AlarmClock className="h-3.5 w-3.5" aria-hidden />
                  Ending soon
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--alo-text-muted)]">
              <span>{data?.practice.sessions ?? 0} session{(data?.practice.sessions ?? 0) === 1 ? '' : 's'} recorded</span>
              <span>·</span>
              <span>{data?.practice.completed ?? 0} completed</span>
              {state?.extended && <Badge variant="outline" className={STATUS_STYLE.EXTENDED}>Extended by your counselor</Badge>}
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">
            <p className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4" aria-hidden />
              {state?.status === 'CLOSED' ? 'Practice closed by your counselor' : 'Practice window ended'}
            </p>
            <p className="text-xs">
              {data?.extensionPolicy ?? 'Ask your counselor for an extension. Your practice history is kept.'}
            </p>
            <p className="text-xs">
              {data?.practice.sessions ?? 0} recorded session{(data?.practice.sessions ?? 0) === 1 ? '' : 's'} remain saved.
            </p>
          </div>
        )}

        {notice && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] p-3 text-sm text-[var(--crm-success-text)]">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
