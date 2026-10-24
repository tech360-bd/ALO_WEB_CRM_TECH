'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, Loader2, UserCheck } from 'lucide-react';

/**
 * The student's own practice assessments (spec §41).
 *
 * A preliminary result is never dressed up as a result: it is labelled
 * "Preliminary", carries a "waiting for counselor review" badge, and says that
 * a human may change it. Once reviewed, the counselor's verdict and message
 * lead, and any change from the preliminary score is stated plainly.
 */

interface Dimension {
  key: string;
  label: string;
  score: number;
  basis: string;
}

interface Assessment {
  id: string;
  sessionId: string;
  status: 'PENDING' | 'REVIEWED';
  preliminary: {
    verdict: string;
    label: string;
    score: number;
    confidence: string;
    strengths: string[];
    improvements: string[];
    dimensions: Dimension[];
    limitations: string[];
    generatedAt: string;
  };
  final: {
    verdict: string;
    counselor: string;
    reviewedAt: string | null;
    message: string;
    changedFromPreliminary: boolean;
  } | null;
  answerCount: number;
  averageWords: number;
}

const VERDICT_TEXT: Record<string, string> = {
  READY: 'Ready',
  READY_WITH_IMPROVEMENT: 'Ready with improvement',
  NEEDS_MORE_PRACTICE: 'Needs more practice',
};

const VERDICT_STYLE: Record<string, string> = {
  READY: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  READY_WITH_IMPROVEMENT: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  NEEDS_MORE_PRACTICE: 'border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)]',
};

export default function InterviewAssessmentPanel() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/student/interview-assessment', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Your assessments are unavailable.');
      setItems(payload.assessments ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your assessments are unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && items.length === 0) {
    return (
      <Card className="rounded-2xl border-[var(--alo-border)]" aria-busy="true">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-[var(--alo-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading your practice results…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-[var(--alo-border)]">
        <CardContent className="p-5">
          <p role="alert" className="rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="rounded-2xl border-[var(--alo-border)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-[var(--alo-brand)]" aria-hidden />
          Practice results
        </CardTitle>
        <p className="text-xs text-[var(--alo-text-muted)]">
          A counselor reviews every practice assessment before it is final, and can change it.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 3).map((item) => {
          const shownVerdict = item.final?.verdict ?? item.preliminary.verdict;
          return (
            <div key={item.id} className="space-y-2 rounded-xl border border-[var(--alo-border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={VERDICT_STYLE[shownVerdict] ?? ''}>
                    {VERDICT_TEXT[shownVerdict] ?? shownVerdict}
                  </Badge>
                  {item.final ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--crm-success-text)]">
                      <UserCheck className="h-3 w-3" aria-hidden />
                      Final · {item.final.counselor || 'counselor'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--crm-warning-text)]">
                      <Clock3 className="h-3 w-3" aria-hidden />
                      Preliminary — awaiting counselor review
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--alo-text-muted)]">
                  {item.answerCount} answer{item.answerCount === 1 ? '' : 's'} · {item.preliminary.confidence.toLowerCase()} confidence
                </span>
              </div>

              {item.final ? (
                <div className="space-y-1">
                  {item.final.message && <p className="text-sm text-[var(--alo-body)]">{item.final.message}</p>}
                  {item.final.changedFromPreliminary && (
                    <p className="flex items-start gap-1 text-[11px] text-[var(--alo-text-muted)]">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                      Your counselor changed the preliminary result ({VERDICT_TEXT[item.preliminary.verdict] ?? item.preliminary.verdict} → {VERDICT_TEXT[shownVerdict] ?? shownVerdict}).
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">{item.preliminary.label}</p>
                  {item.preliminary.strengths[0] && (
                    <p className="flex items-start gap-1 text-sm text-[var(--alo-body)]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--crm-success-text)]" aria-hidden />
                      {item.preliminary.strengths[0]}
                    </p>
                  )}
                  {item.preliminary.improvements[0] && (
                    <p className="flex items-start gap-1 text-sm text-[var(--alo-body)]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--crm-warning-text)]" aria-hidden />
                      {item.preliminary.improvements[0]}
                    </p>
                  )}
                </div>
              )}

              {item.preliminary.limitations[0] && (
                <p className="text-[11px] text-[var(--alo-text-muted)]">{item.preliminary.limitations[0]}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
