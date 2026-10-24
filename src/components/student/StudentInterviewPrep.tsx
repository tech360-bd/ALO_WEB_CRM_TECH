'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PracticeWindowPanel from '@/components/student/PracticeWindowPanel';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Loader2,
  Save,
  Video,
} from 'lucide-react';

/**
 * Student interview preparation workspace (spec §30, §33, §38, §71).
 *
 * Replaces the previous mis-wiring where /student/interview rendered the SOP/CV
 * studio. Everything shown here comes from /api/student/interview-prep, which is
 * scoped to the authenticated student: sourced questions only, an explicit
 * "withheld" count, and answer frameworks that stay empty until the student
 * supplies the fact a question needs.
 */

interface FactSet {
  reasonUniversity: string;
  reasonCourse: string;
  fundingSource: string;
  futurePlan: string;
}

interface Framework {
  ready: boolean;
  missingFacts: string[];
  anchors: Array<{ key: string; label: string; value: string }>;
  structure: string[];
  shortAnswerDraft: string | null;
  expandedAnswerDraft: string | null;
  followUps: string[];
  avoid: string[];
  note: string;
}

interface PreparedQuestion {
  id: string;
  category: string;
  question: string;
  theme: string | null;
  source: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  freshness: string;
}

interface PrepPayload {
  student: { studentCode: string; name: string };
  applications: Array<{
    id: string;
    serial: string;
    universityName: string;
    courseName: string;
    country: string;
    intake: string;
    stage: string;
  }>;
  selectedApplicationId: string | null;
  facts: FactSet;
  factsUpdatedAt: string | null;
  packs: {
    questions: PreparedQuestion[];
    groups: Array<{ category: string; questions: PreparedQuestion[] }>;
    counts: { total: number; publishable: number; fresh: number; stale: number; expired: number; unverified: number };
    withheld: number;
  };
  frameworks: Array<{ questionId: string; category: string; question: string; framework: Framework }>;
  practice: { sessions: number; lastSessionAt: string | null; latestReadiness: string | null };
  meta: { researchWindowMonths: number; disclaimers: string[]; frameworkLimit: number };
  error?: string;
}

const FACT_FIELDS: Array<{ key: keyof FactSet; label: string; hint: string; placeholder: string }> = [
  {
    key: 'reasonUniversity',
    label: 'Why this university?',
    hint: 'Use only what you can prove from your documents or the official course page.',
    placeholder: 'The modules on the official course page, the campus, the placement support…',
  },
  {
    key: 'reasonCourse',
    label: 'Why this course?',
    hint: 'Name the modules or skills you actually read about.',
    placeholder: 'The data-engineering modules build on my undergraduate project in…',
  },
  {
    key: 'fundingSource',
    label: 'Who funds your studies?',
    hint: 'Only state a sponsor whose documents exist. Do not estimate amounts you cannot evidence.',
    placeholder: 'My father sponsors me from his documented savings and business income…',
  },
  {
    key: 'futurePlan',
    label: 'What will you do after graduation?',
    hint: 'A realistic plan that connects to your course.',
    placeholder: 'Return to Dhaka and work as a data analyst in…',
  },
];

const CONFIDENCE_STYLE: Record<string, string> = {
  HIGH: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  MEDIUM: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  LOW: 'border-[var(--alo-border)] bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]',
};

const FACT_LABELS: Record<string, string> = {
  reasonUniversity: 'Why this university',
  reasonCourse: 'Why this course',
  fundingSource: 'Who funds your studies',
  futurePlan: 'What you plan to do after graduation',
};

function formatDate(value: string | null): string {
  if (!value) return 'not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'not recorded' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentInterviewPrep() {
  const [data, setData] = useState<PrepPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [facts, setFacts] = useState<FactSet>({ reasonUniversity: '', reasonCourse: '', fundingSource: '', futurePlan: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const load = useCallback(async (applicationId?: string | null) => {
    setLoading(true);
    setError('');
    try {
      const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : '';
      const response = await fetch(`/api/student/interview-prep${query}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Interview preparation is unavailable.');
      setData(payload as PrepPayload);
      setFacts(payload.facts as FactSet);
      setActiveQuestionId((current) => current ?? payload.frameworks?.[0]?.questionId ?? null);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Interview preparation is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const saveFacts = useCallback(async () => {
    setSaving(true);
    setSaveError('');
    setSaved('');
    try {
      const response = await fetch('/api/student/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facts),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Your facts could not be saved.');
      setSaved('Saved. The answer frameworks below now use these facts.');
      await load(data?.selectedApplicationId ?? null);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Your facts could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [facts, load, data?.selectedApplicationId]);

  const active = useMemo(
    () => data?.frameworks.find((entry) => entry.questionId === activeQuestionId) ?? data?.frameworks[0] ?? null,
    [data, activeQuestionId],
  );

  const answeredCount = data?.packs.counts.publishable ?? 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">Interview preparation</p>
        <h1 className="text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">Your interview workspace</h1>
        <p className="max-w-2xl text-sm text-[var(--alo-text-muted)]">
          Questions here come from official and counselor-verified sources inside a {data?.meta.researchWindowMonths ?? 6}
          -month research window. Your answers are built only from facts you enter — nothing is invented for you.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-4 text-sm text-[var(--crm-danger-text)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Workspace unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading interview workspace">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)]" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)]">
            <Badge variant="outline" className="border-[var(--alo-border)]">{data.student.studentCode}</Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">
              {answeredCount} sourced question{answeredCount === 1 ? '' : 's'}
            </Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">{data.packs.withheld} withheld as unverified or expired</Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">
              {data.practice.sessions} practice session{data.practice.sessions === 1 ? '' : 's'}
            </Badge>
            {data.practice.latestReadiness && (
              <Badge variant="outline" className={CONFIDENCE_STYLE.MEDIUM}>{data.practice.latestReadiness}</Badge>
            )}
          </div>

          {data.applications.length > 1 && (
            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardContent className="flex flex-wrap gap-2 p-4">
                {data.applications.map((application) => (
                  <Button
                    key={application.id}
                    variant={application.id === data.selectedApplicationId ? 'brand' : 'outline'}
                    onClick={() => void load(application.id)}
                    className="h-12"
                  >
                    {application.serial} · {application.universityName || 'University'}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <PracticeWindowPanel applicationId={data.selectedApplicationId} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">1. Your facts</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  The coach can only use what you write here. Blank fields stay blank — no answer will be generated for them.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {FACT_FIELDS.map((field) => (
                  <label key={field.key} className="block space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                    {field.label}
                    <Textarea
                      value={facts[field.key]}
                      onChange={(event) => setFacts({ ...facts, [field.key]: event.target.value })}
                      maxLength={1200}
                      rows={3}
                      placeholder={field.placeholder}
                      className="text-sm font-normal"
                    />
                    <span className="block text-[11px] font-normal text-[var(--alo-text-muted)]">{field.hint}</span>
                  </label>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void saveFacts()} disabled={saving} variant="default">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}
                    {saving ? 'Saving…' : 'Save facts'}
                  </Button>
                  <span className="text-[11px] text-[var(--alo-text-muted)]">Last saved {formatDate(data.factsUpdatedAt)}</span>
                </div>
                {saveError && (
                  <p role="alert" className="rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">{saveError}</p>
                )}
                {saved && (
                  <p role="status" className="rounded-xl border border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] p-3 text-sm text-[var(--crm-success-text)]">{saved}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">2. Answer framework</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  Pick a question. If it needs a fact you have not entered yet, it says so instead of inventing one.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.frameworks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--alo-border)] p-6 text-center">
                    <BookOpenCheck className="mx-auto h-9 w-9 text-[var(--alo-placeholder)]" aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-[var(--alo-text)]">No sourced questions yet</p>
                    <p className="mt-1 text-xs text-[var(--alo-text-muted)]">
                      Your counselor adds verified questions with a source and verification date. Until then the
                      workspace stays empty rather than showing unverified questions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {data.frameworks.map((entry) => (
                        <Button
                          key={entry.questionId}
                          size="xs"
                          variant={entry.questionId === active?.questionId ? 'brand' : 'outline'}
                          onClick={() => setActiveQuestionId(entry.questionId)}
                        >
                          {entry.category}
                        </Button>
                      ))}
                    </div>

                    {active && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[var(--alo-text)]">{active.question}</p>

                        {active.framework.ready ? (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Short answer (your words)</p>
                              <p className="mt-1 text-sm text-[var(--alo-text)]">{active.framework.shortAnswerDraft}</p>
                            </div>
                            <div className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Expanded answer (your words)</p>
                              <p className="mt-1 text-sm text-[var(--alo-text)]">{active.framework.expandedAnswerDraft}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Structure</p>
                              <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs text-[var(--alo-body)]">
                                {active.framework.structure.map((line) => <li key={line}>{line}</li>)}
                              </ol>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">What not to say</p>
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[var(--alo-body)]">
                                {active.framework.avoid.map((line) => <li key={line}>{line}</li>)}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] p-3 text-sm text-[var(--crm-warning-text)]">
                            <p className="font-semibold">This question needs facts you have not entered</p>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                              {active.framework.missingFacts.map((key) => <li key={key}>{FACT_LABELS[key] ?? key}</li>)}
                            </ul>
                            <p className="mt-2 text-xs">Fill them in on the left and save — nothing is generated until then.</p>
                          </div>
                        )}

                        <p className="text-[11px] text-[var(--alo-text-muted)]">{active.framework.note}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-[var(--alo-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sourced questions for {data.applications[0]?.universityName || 'your application'}</CardTitle>
              <p className="text-xs text-[var(--alo-text-muted)]">
                Confidence reflects the strength of the source, not your chance of success.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.packs.questions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--alo-border)] p-4 text-sm text-[var(--alo-text-muted)]">
                  No verified questions for this application yet. You can still practise with the AI interviewer below.
                </p>
              ) : data.packs.questions.map((question) => (
                <div key={question.id} className="rounded-xl border border-[var(--alo-border)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--alo-text)]">{question.question}</p>
                    <Badge variant="outline" className={CONFIDENCE_STYLE[question.confidence]}>{question.confidence}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                    {question.category}
                    {question.theme ? ` · ${question.theme}` : ''} · verified {formatDate(question.lastVerifiedAt)}
                    {question.sourceUrl
                      ? <> · <a className="text-[var(--alo-brand)] underline" href={question.sourceUrl} target="_blank" rel="noopener noreferrer">{question.source}</a></>
                      : ` · ${question.source}`}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
            <CardContent className="space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <Info className="h-4 w-4" aria-hidden />
                Practise next
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="brand">
                  <Link href="/student/ai-interview">
                    <Video className="mr-2 h-4 w-4" aria-hidden />
                    Start AI interview practice
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/student/credibility-interview">
                    <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden />
                    My credibility interview
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/student/visa">
                    Check visa readiness
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
              <div className="space-y-1 text-[11px] text-[var(--alo-body)]">
                {data.meta.disclaimers.map((line) => (
                  <p key={line} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    {line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
