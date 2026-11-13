'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, RefreshCw, Scale, UserCheck,
} from 'lucide-react';

/**
 * /crm/interview-review (spec §41)
 *
 * The human side of the interview assessment: a reviewer sees the preliminary
 * rubric result with its evidence and limitations, then confirms or overrides
 * it. The rationale is mandatory because it is the audit record of a human
 * decision, and a student-facing message is mandatory whenever the verdict
 * changes — otherwise an override would be invisible to the person it affects.
 */

interface Dimension { key: string; label: string; score: number; basis: string }

interface Assessment {
  id: string;
  sessionId: string;
  student: { studentId: string; name: string } | null;
  studentRecordId: string;
  preliminaryVerdict: string;
  confidence: string;
  overallScore: number;
  answerCount: number;
  averageWords: number;
  reviewStatus: string;
  finalVerdict: string | null;
  studentMessage: string;
  reviewedByName: string;
  reviewedAt: string | null;
  generatedAt: string;
  overridden: boolean;
  dimensions: Dimension[];
  strengths: string[];
  improvements: string[];
  evidence: string[];
  limitations: string[];
}

const VERDICT_LABEL: Record<string, string> = {
  READY: 'Ready',
  READY_WITH_IMPROVEMENT: 'Ready with improvement',
  NEEDS_MORE_PRACTICE: 'Needs more practice',
};

const VERDICT_STYLE: Record<string, string> = {
  READY: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  READY_WITH_IMPROVEMENT: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  NEEDS_MORE_PRACTICE: 'border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)]',
};

export default function CrmInterviewReviewPage() {
  const [pending, setPending] = useState<Assessment[]>([]);
  const [recent, setRecent] = useState<Assessment[]>([]);
  const [counts, setCounts] = useState({ pending: 0, reviewed: 0, withDecision: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState('READY_WITH_IMPROVEMENT');
  const [rationale, setRationale] = useState('');
  const [studentMessage, setStudentMessage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/crm/interview-review', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'The review queue is unavailable.');
      setPending(payload.pending ?? []);
      setRecent(payload.recent ?? []);
      setCounts(payload.counts ?? { pending: 0, reviewed: 0, withDecision: 0 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review queue is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const open = useMemo(() => pending.find((item) => item.id === activeId) ?? null, [pending, activeId]);

  const startReview = (item: Assessment) => {
    setActiveId(item.id);
    setVerdict(item.preliminaryVerdict);
    setRationale('');
    setStudentMessage('');
    setInternalNotes('');
    setNotice('');
    setError('');
  };

  const submit = useCallback(async () => {
    if (!activeId) return;
    if (rationale.trim().length < 20) {
      setError('Write at least 20 characters of rationale — it is the audit record of your decision.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/crm/interview-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: activeId, finalVerdict: verdict, rationale: rationale.trim(), studentMessage: studentMessage.trim(), internalNotes: internalNotes.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'The decision could not be saved.');
      setNotice(payload.note || 'Decision saved.');
      setActiveId(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The decision could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [activeId, verdict, rationale, studentMessage, internalNotes, load]);

  const card = (item: Assessment, reviewed: boolean) => (
    <Card key={item.id} className="rounded-2xl border-[var(--alo-border)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">
            {item.student ? (
              <Link href={`/crm/students/${item.studentRecordId}`} className="text-[var(--alo-brand)] underline-offset-2 hover:underline">
                {item.student.name} · {item.student.studentId}
              </Link>
            ) : 'Student record'}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={VERDICT_STYLE[reviewed ? item.finalVerdict ?? item.preliminaryVerdict : item.preliminaryVerdict] ?? ''}>
              {reviewed ? 'Final: ' : 'Preliminary: '}
              {VERDICT_LABEL[reviewed ? item.finalVerdict ?? item.preliminaryVerdict : item.preliminaryVerdict] ?? ''}
            </Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">{item.confidence.toLowerCase()} confidence</Badge>
            {item.overridden && <Badge variant="outline" className={VERDICT_STYLE.READY_WITH_IMPROVEMENT}>overrode AI</Badge>}
          </div>
        </div>
        <p className="text-[11px] text-[var(--alo-text-muted)]">
          {item.answerCount} answers · {item.averageWords} words avg · generated {new Date(item.generatedAt).toLocaleString('en-GB')}
          {reviewed && item.reviewedByName ? ` · reviewed by ${item.reviewedByName}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.dimensions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {item.dimensions.slice(0, 8).map((dimension) => (
              <div key={dimension.key} className="rounded-xl border border-[var(--alo-border)] p-2">
                <p className="text-[11px] text-[var(--alo-text-muted)]">{dimension.label}</p>
                <p className="text-sm font-semibold tabular-nums text-[var(--alo-text)]">{dimension.score}</p>
              </div>
            ))}
          </div>
        )}

        {item.strengths.length > 0 && (
          <ul className="space-y-1 text-sm text-[var(--alo-body)]">
            {item.strengths.map((entry, index) => (
              <li key={index} className="flex items-start gap-1">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--crm-success-text)]" aria-hidden />
                {entry}
              </li>
            ))}
          </ul>
        )}
        {item.improvements.length > 0 && (
          <ul className="space-y-1 text-sm text-[var(--alo-body)]">
            {item.improvements.map((entry, index) => (
              <li key={index} className="flex items-start gap-1">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--crm-warning-text)]" aria-hidden />
                {entry}
              </li>
            ))}
          </ul>
        )}
        {reviewed && item.studentMessage && (
          <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-2 text-xs text-[var(--alo-body)]">
            Told the student: “{item.studentMessage}”
          </p>
        )}
        {item.limitations[0] && <p className="text-[11px] text-[var(--alo-text-muted)]">{item.limitations[0]}</p>}

        {!reviewed && (
          <Button size="sm" variant="brand" onClick={() => startReview(item)} disabled={activeId === item.id}>
            <Scale className="mr-2 h-3.5 w-3.5" aria-hidden />
            Review this assessment
          </Button>
        )}

        {activeId === item.id && open && (
          <div className="space-y-3 rounded-xl border border-[var(--alo-brand)]/40 bg-[var(--alo-page)] p-3">
            <div className="flex flex-wrap gap-2">
              {(['READY', 'READY_WITH_IMPROVEMENT', 'NEEDS_MORE_PRACTICE'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVerdict(option)}
                  aria-pressed={verdict === option}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${verdict === option ? VERDICT_STYLE[option] : 'border-[var(--alo-border)] text-[var(--alo-body)]'}`}
                >
                  {VERDICT_LABEL[option]}
                  {option === item.preliminaryVerdict ? ' (AI)' : ''}
                </button>
              ))}
            </div>
            {verdict !== item.preliminaryVerdict && (
              <p className="text-[11px] font-semibold text-[var(--crm-warning-text)]">
                You are overriding the preliminary result — a student-facing message is required.
              </p>
            )}
            <label className="block space-y-1 text-xs font-semibold text-[var(--alo-body)]">
              Rationale (required, audit record)
              <Textarea rows={2} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Reviewed the transcript against the answers recorded on 24 Oct; financial explanation is now specific." />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-[var(--alo-body)]">
              Message to the student {verdict !== item.preliminaryVerdict ? '(required)' : '(optional)'}
              <Textarea rows={2} value={studentMessage} onChange={(event) => setStudentMessage(event.target.value)} placeholder="Explain what to keep doing and what to rehearse next." />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-[var(--alo-body)]">
              Internal notes (never shown to the student)
              <Input value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} placeholder="Optional" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="brand" onClick={() => void submit()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden /> : <UserCheck className="mr-2 h-3.5 w-3.5" aria-hidden />}
                {saving ? 'Saving…' : 'Save final decision'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActiveId(null)} disabled={saving}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">Interview intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">Assessment review</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            The preliminary result is produced by a fixed rubric over the student&apos;s written answers. Your decision is
            final and replaces it; nothing here is a visa decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={counts.pending > 0 ? VERDICT_STYLE.READY_WITH_IMPROVEMENT : 'border-[var(--alo-border)]'}>
            {counts.pending} awaiting review
          </Badge>
          <Button onClick={() => void load()} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        </div>
      </header>

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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Awaiting review</h2>
        {loading && pending.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)]" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card className="rounded-2xl border-[var(--alo-border)]">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <ClipboardCheck className="h-9 w-9 text-[var(--alo-placeholder)]" aria-hidden />
              <p className="text-sm font-semibold text-[var(--alo-text)]">Nothing waiting</p>
              <p className="max-w-md text-xs text-[var(--alo-text-muted)]">
                Assessments appear here when a student in your scope finishes a practice session.
              </p>
            </CardContent>
          </Card>
        ) : pending.map((item) => card(item, false))}
      </section>

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Recently decided</h2>
          {recent.slice(0, 10).map((item) => card(item, true))}
        </section>
      )}
    </main>
  );
}
