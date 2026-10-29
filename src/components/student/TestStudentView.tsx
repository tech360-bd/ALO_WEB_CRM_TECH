'use client';

/**
 * Student journey self-check UI.
 *
 * Calls GET /api/student/test-check, which authenticates the caller and reads
 * real rows for that student. This page never fabricates a result: if the
 * session is anonymous the API returns 401 and we say so.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Check {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  detail: string;
  requiredFix?: string;
}

interface CheckResponse {
  success: boolean;
  student?: { studentId: string; name: string; journeyStage: string; profileComplete: number };
  verdict?: 'PASS' | 'FAIL';
  summary?: { total: number; pass: number; fail: number; skipped: number };
  checks?: Check[];
  note?: string;
  error?: string;
}

const ICONS = {
  PASS: CheckCircle2,
  FAIL: XCircle,
  SKIPPED: CircleSlash,
} as const;

const TONES = {
  PASS: 'text-emerald-600',
  FAIL: 'text-red-600',
  SKIPPED: 'text-[var(--alo-text-muted)]',
} as const;

export default function TestStudentView() {
  const [state, setState] = useState<'loading' | 'unauthorised' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<CheckResponse | null>(null);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/student/test-check', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        setState('unauthorised');
        return;
      }
      const json: CheckResponse = await res.json().catch(() => ({ success: false, error: 'Unreadable response' }));
      if (!res.ok || !json.success) {
        setError(json.error || `Request failed with ${res.status}`);
        setState('error');
        return;
      }
      setData(json);
      setState('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Network error');
      setState('error');
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pb-16 pt-24 text-[var(--alo-text)]">
      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">Student journey self-check</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Is this student account wired end to end?</h1>
          <p className="mt-2 text-sm text-[var(--alo-body)]">
            Every row below is read from the database for the signed-in student. A missing record is
            reported as FAIL with the fix named; SKIPPED means the step is genuinely not applicable
            yet, never a silent pass.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={run} disabled={state === 'loading'} className="bg-[var(--alo-brand)] font-semibold text-white">
              {state === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Re-run checks
            </Button>
            <Link href="/student/dashboard">
              <Button variant="outline" className="border-[var(--alo-border)]">Student dashboard</Button>
            </Link>
          </div>
        </div>

        {state === 'loading' && (
          <Card className="flex items-center gap-3 rounded-2xl border-[var(--alo-border)] bg-white p-6 text-sm text-[var(--alo-body)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Running checks against the live records…
          </Card>
        )}

        {state === 'unauthorised' && (
          <Card className="rounded-2xl border-[var(--alo-border)] bg-white p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold">Sign in as a student to run this check.</p>
                <p className="mt-1 text-sm text-[var(--alo-body)]">
                  The endpoint authenticates the caller and only inspects that student&apos;s own record, so there is
                  no anonymous or cross-student variant of this page.
                </p>
                <div className="mt-3 flex gap-3">
                  <Link href="/student-login"><Button className="bg-[var(--alo-brand)] font-semibold text-white">Student login</Button></Link>
                  <Link href="/student-register"><Button variant="outline" className="border-[var(--alo-border)]">Create account</Button></Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        {state === 'error' && (
          <Card className="rounded-2xl border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-semibold">The check could not run.</p>
            <p className="mt-1">{error}</p>
          </Card>
        )}

        {state === 'ready' && data && (
          <>
            <Card className="rounded-2xl border-[var(--alo-border)] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {data.student?.name || 'Student'} <span className="text-[var(--alo-text-muted)]">({data.student?.studentId})</span>
                  </p>
                  <p className="text-xs text-[var(--alo-body)]">
                    stage {data.student?.journeyStage || 'unset'} · profile {data.student?.profileComplete ?? 0}%
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${data.verdict === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {data.verdict}
                </span>
              </div>
              {data.summary && (
                <p className="mt-3 text-xs text-[var(--alo-body)]">
                  {data.summary.pass} pass · {data.summary.fail} fail · {data.summary.skipped} skipped · {data.summary.total} total
                </p>
              )}
            </Card>

            <div className="space-y-2">
              {data.checks?.map((check) => {
                const Icon = ICONS[check.status];
                return (
                  <Card key={check.id} className="rounded-2xl border-[var(--alo-border)] bg-white p-4">
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONES[check.status]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{check.label}</p>
                        <p className="mt-0.5 break-words text-xs text-[var(--alo-body)]">{check.detail}</p>
                        {check.requiredFix && (
                          <p className="mt-1 text-xs font-medium text-amber-700">{check.requiredFix}</p>
                        )}
                      </div>
                      <span className="ml-auto shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">{check.status}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {data.note && <p className="text-xs text-[var(--alo-text-muted)]">{data.note}</p>}
          </>
        )}
      </div>
    </div>
  );
}
