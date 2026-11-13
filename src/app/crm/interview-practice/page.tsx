'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlarmClock, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Timer } from 'lucide-react';

/**
 * /crm/interview-practice (spec §38, §76)
 *
 * Counselor control over student practice windows: who is active, who has
 * lapsed, and the extension action the specification requires once a 72-hour
 * window ends. Only students inside the caller's authorized scope are returned
 * by the API, and the extension reason is mandatory and stored.
 */

interface WindowRow {
  id: string;
  applicationId: string;
  student: { studentId: string; name: string } | null;
  studentRecordId: string;
  extensionCount: number;
  extensionReason: string;
  state: {
    status: string;
    effectiveEndsAt: string | null;
    remainingHours: number;
    expiringSoon: boolean;
    extended: boolean;
  };
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  EXTENDED: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  EXPIRING: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  EXPIRED: 'border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)]',
  CLOSED: 'border-[var(--alo-border)] bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]',
};

export default function CrmInterviewPracticePage() {
  const [rows, setRows] = useState<WindowRow[]>([]);
  const [windowHours, setWindowHours] = useState(72);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [hours, setHours] = useState('72');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/crm/interview-practice', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Practice windows are unavailable.');
      setRows(payload.windows ?? []);
      setWindowHours(payload.windowHours ?? 72);
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'Practice windows are unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = useCallback(async (row: WindowRow, action: 'extend' | 'close') => {
    if (reason.trim().length < 8) {
      setError('Enter a reason (at least 8 characters) before extending or closing a window.');
      return;
    }
    setBusyId(row.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/crm/interview-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windowId: row.id, action, hours: Number(hours), reason: reason.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'The window could not be updated.');
      setNotice(
        action === 'extend'
          ? `Extended ${payload.grantedHours}h for ${row.student?.name ?? 'student'}.`
          : `Practice closed for ${row.student?.name ?? 'student'}. Recorded sessions are untouched.`,
      );
      setReason('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The window could not be updated.');
    } finally {
      setBusyId('');
    }
  }, [hours, reason, load]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">Interview intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">Practice windows</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            Students practise for {windowHours} hours per window. When a window lapses, new sessions stop until you
            extend it — recorded sessions and assessments are never deleted.
          </p>
        </div>
        <Button onClick={() => void load()} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>

      <Card className="rounded-2xl border-[var(--alo-border)]">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
            Extension hours
            <Input type="number" min={1} max={720} value={hours} onChange={(event) => setHours(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
            Reason (required, stored in the audit trail)
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Student asked for more practice before the embassy slot" />
          </label>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] p-3 text-sm text-[var(--crm-success-text)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {notice}
        </p>
      )}

      {loading && rows.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-2xl border-[var(--alo-border)]">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Timer className="h-9 w-9 text-[var(--alo-placeholder)]" aria-hidden />
            <p className="text-sm font-semibold text-[var(--alo-text)]">No practice windows yet</p>
            <p className="max-w-md text-xs text-[var(--alo-text-muted)]">
              A window appears here the first time one of your students opens it from their interview workspace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {row.student ? (
                      <Link href={`/crm/students/${row.studentRecordId}`} className="text-[var(--alo-brand)] underline-offset-2 hover:underline">
                        {row.student.name} · {row.student.studentId}
                      </Link>
                    ) : 'Student record'}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={STATUS_STYLE[row.state.status] ?? STATUS_STYLE.CLOSED}>
                      {row.state.status.replace('_', ' ')}
                    </Badge>
                    {row.state.expiringSoon && (
                      <Badge variant="outline" className={STATUS_STYLE.EXPIRING}>
                        <AlarmClock className="mr-1 h-3 w-3" aria-hidden />
                        ending soon
                      </Badge>
                    )}
                    {row.extensionCount > 0 && (
                      <Badge variant="outline" className="border-[var(--alo-border)]">
                        extended {row.extensionCount}×
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[var(--alo-text-muted)]">
                <p>
                  {row.state.remainingHours > 0
                    ? `${row.state.remainingHours}h remaining`
                    : 'No time remaining'}
                  {row.state.effectiveEndsAt ? ` · ends ${new Date(row.state.effectiveEndsAt).toLocaleString('en-GB')}` : ''}
                </p>
                {row.extensionReason && <p>Last reason: {row.extensionReason}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="xs" variant="brand" disabled={busyId === row.id} onClick={() => void act(row, 'extend')}>
                    {busyId === row.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden /> : null}
                    Extend
                  </Button>
                  <Button size="xs" variant="outline" disabled={busyId === row.id} onClick={() => void act(row, 'close')}>
                    Close practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
