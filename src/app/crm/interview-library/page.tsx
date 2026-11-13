'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, BookOpenCheck, Info, PlusCircle, RefreshCw, Search, ShieldAlert } from 'lucide-react';

/**
 * /crm/interview-library (spec §30/§76/§77)
 *
 * The interview preparation workspace's evidence library. It renders exactly
 * what /api/interview-questions publishes: sourced, dated, confidence-labelled
 * questions inside the rolling research window — plus a visible list of what
 * was withheld and why. Nothing is invented if the library is empty.
 */

interface PreparedQuestion {
  id: string;
  category: string;
  question: string;
  theme: string | null;
  universitySlug: string | null;
  countrySlug: string | null;
  guidance: string | null;
  source: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  daysSinceVerified: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  freshness: 'FRESH' | 'STALE';
  frequency: number;
}

interface ExcludedQuestion {
  id: string;
  question: string;
  reason: string;
  detail?: string;
}

interface PackResponse {
  questions: PreparedQuestion[];
  groups: Array<{ category: string; questions: PreparedQuestion[] }>;
  meta: {
    generatedAt?: string;
    researchWindowMonths?: number;
    counts?: {
      total: number;
      publishable: number;
      fresh: number;
      stale: number;
      expired: number;
      unverified: number;
    };
    excluded?: ExcludedQuestion[];
    disclaimers?: string[];
    error?: string;
  };
}

const CONFIDENCE_STYLE: Record<string, string> = {
  HIGH: 'border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]',
  MEDIUM: 'border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]',
  LOW: 'border-[var(--alo-border)] bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)]',
};

function formatDate(value: string | null): string {
  if (!value) return 'not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'not recorded' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CrmInterviewLibraryPage() {
  const [data, setData] = useState<PackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [university, setUniversity] = useState('');
  const [includeStale, setIncludeStale] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [draft, setDraft] = useState({
    category: 'COURSE',
    question: '',
    theme: '',
    source: '',
    sourceType: 'OFFICIAL_UNIVERSITY',
    sourceUrl: '',
    lastVerifiedAt: new Date().toISOString().slice(0, 10),
    confidence: 'MEDIUM',
    frequency: '0',
    guidance: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ includeStale: String(includeStale) });
      if (university.trim()) params.set('universitySlug', university.trim());
      const response = await fetch(`/api/interview-questions?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.meta?.error || payload?.error || 'Interview library is unavailable.');
      setData(payload as PackResponse);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Interview library is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [includeStale, university]);

  useEffect(() => { void load(); }, [load]);

  const submitEvidence = useCallback(async () => {
    setSaving(true);
    setFormError('');
    setFormNotice('');
    try {
      const response = await fetch('/api/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: draft.category.trim().toUpperCase(),
          question: draft.question.trim(),
          theme: draft.theme.trim() || null,
          source: draft.source.trim(),
          sourceType: draft.sourceType,
          sourceUrl: draft.sourceUrl.trim() || null,
          lastVerifiedAt: draft.lastVerifiedAt ? new Date(draft.lastVerifiedAt).toISOString() : null,
          confidence: draft.confidence,
          frequency: Number(draft.frequency) || 0,
          guidance: draft.guidance.trim() || null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          response.status === 422 && Array.isArray(payload?.violations) && payload.violations.length > 0
            ? `Blocked by the honesty policy: ${payload.violations.join(', ')}`
            : payload?.error || 'The evidence could not be saved.',
        );
      }
      setFormNotice('Evidence recorded. It will appear once a source and verification date are present.');
      setDraft((current) => ({ ...current, question: '', theme: '', guidance: '' }));
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The evidence could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [draft, load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const question of data?.questions ?? []) set.add(question.category);
    return [...set].sort();
  }, [data]);

  const visibleQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.questions ?? []).filter((question) => {
      if (category && question.category !== category) return false;
      if (!term) return true;
      return `${question.question} ${question.theme ?? ''} ${question.source}`.toLowerCase().includes(term);
    });
  }, [data, search, category]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">Interview intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">Interview evidence library</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            Only questions with a named source and a verification date inside the rolling research window are shown as
            current. Everything else is listed as withheld, with its reason.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setFormOpen((open) => !open)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
            {formOpen ? 'Close form' : 'Record evidence'}
          </Button>
          <Button onClick={() => void load()} disabled={loading} variant="default">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </header>

      <Card className="rounded-2xl border-[var(--alo-border)]">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--alo-text-muted)]" aria-hidden />
            <Input
              aria-label="Search questions"
              placeholder="Search question, theme or source"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 rounded-xl border border-[var(--alo-border)] bg-white px-3 text-sm text-[var(--alo-text)]"
          >
            <option value="">All categories</option>
            {categories.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
          <Input
            aria-label="University slug"
            placeholder="University slug (optional)"
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
          />
          <label className="flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-[var(--alo-border)] px-3 text-sm text-[var(--alo-body)]">
            <input type="checkbox" checked={includeStale} onChange={(event) => setIncludeStale(event.target.checked)} />
            Include stale evidence
          </label>
        </CardContent>
      </Card>

      {formOpen && (
        <Card className="rounded-2xl border-[var(--alo-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Record verified evidence</CardTitle>
            <p className="text-xs text-[var(--alo-text-muted)]">
              A question is only publishable when it names a real source and a verification date. Guidance that claims
              guaranteed outcomes or leaked questions is rejected by the server.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => { event.preventDefault(); void submitEvidence(); }}
            >
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Category
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  className="h-12 w-full rounded-xl border border-[var(--alo-border)] bg-white px-3 text-sm font-normal"
                >
                  {['UNIVERSITY', 'COURSE', 'COUNTRY', 'VISA', 'FINANCIAL', 'FUTURE_PLAN', 'ACADEMIC', 'CREDIBILITY', 'PERSONAL', 'ENGLISH'].map((entry) => (
                    <option key={entry} value={entry}>{entry}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Source type
                <select
                  value={draft.sourceType}
                  onChange={(event) => setDraft({ ...draft, sourceType: event.target.value })}
                  className="h-12 w-full rounded-xl border border-[var(--alo-border)] bg-white px-3 text-sm font-normal"
                >
                  {['OFFICIAL_UNIVERSITY', 'OFFICIAL_GOVERNMENT', 'OFFICIAL_IMMIGRATION', 'ALO_VERIFIED_REPORT', 'COUNSELOR_APPROVED', 'PUBLIC_RELIABLE'].map((entry) => (
                    <option key={entry} value={entry}>{entry.replaceAll('_', ' ').toLowerCase()}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)] sm:col-span-2">
                Question
                <Input
                  required
                  maxLength={500}
                  value={draft.question}
                  onChange={(event) => setDraft({ ...draft, question: event.target.value })}
                  placeholder="Why did you choose this course?"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Theme (optional)
                <Input value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Source name
                <Input required value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="University of Birmingham admissions guidance" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Source URL (optional)
                <Input type="url" value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Last verified
                <Input type="date" required value={draft.lastVerifiedAt} onChange={(event) => setDraft({ ...draft, lastVerifiedAt: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Confidence
                <select
                  value={draft.confidence}
                  onChange={(event) => setDraft({ ...draft, confidence: event.target.value })}
                  className="h-12 w-full rounded-xl border border-[var(--alo-border)] bg-white px-3 text-sm font-normal"
                >
                  {['HIGH', 'MEDIUM', 'LOW'].map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)]">
                Reported frequency
                <Input type="number" min={0} value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-semibold text-[var(--alo-body)] sm:col-span-2">
                Guidance (optional, no guaranteed-outcome claims)
                <Input value={draft.guidance} onChange={(event) => setDraft({ ...draft, guidance: event.target.value })} />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving} variant="default">
                  {saving ? 'Saving…' : 'Save evidence'}
                </Button>
              </div>
            </form>
            {formError && (
              <p role="alert" className="rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-3 text-sm text-[var(--crm-danger-text)]">{formError}</p>
            )}
            {formNotice && (
              <p role="status" className="rounded-xl border border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] p-3 text-sm text-[var(--crm-success-text)]">{formNotice}</p>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-4 text-sm text-[var(--crm-danger-text)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Library unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading interview library">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)]" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)]">
            <Badge variant="outline" className="border-[var(--alo-border)]">
              {data.meta.counts?.publishable ?? 0} publishable of {data.meta.counts?.total ?? 0}
            </Badge>
            <Badge variant="outline" className="border-[var(--crm-success-border)] bg-[var(--crm-success-bg)] text-[var(--crm-success-text)]">
              {data.meta.counts?.fresh ?? 0} fresh
            </Badge>
            <Badge variant="outline" className="border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]">
              {data.meta.counts?.stale ?? 0} stale
            </Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">{data.meta.counts?.expired ?? 0} expired</Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">{data.meta.counts?.unverified ?? 0} unverified</Badge>
            <span>Research window: {data.meta.researchWindowMonths ?? 6} months</span>
          </div>

          {visibleQuestions.length === 0 ? (
            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <BookOpenCheck className="h-10 w-10 text-[var(--alo-placeholder)]" aria-hidden />
                <p className="text-sm font-semibold text-[var(--alo-text)]">No sourced questions match this view</p>
                <p className="max-w-md text-xs text-[var(--alo-text-muted)]">
                  A question only appears here once a counselor records its source and verification date. The system
                  will not display unsourced questions as current evidence.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleQuestions.map((question) => (
                <Card key={question.id} className="rounded-2xl border-[var(--alo-border)]">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-snug text-[var(--alo-text)]">{question.question}</CardTitle>
                      <div className="flex shrink-0 gap-2">
                        <Badge variant="outline" className={CONFIDENCE_STYLE[question.confidence]}>{question.confidence} confidence</Badge>
                        <Badge variant="outline" className={question.freshness === 'FRESH' ? CONFIDENCE_STYLE.HIGH : CONFIDENCE_STYLE.MEDIUM}>
                          {question.freshness}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-[var(--alo-text-muted)]">
                    <p>
                      <span className="font-semibold text-[var(--alo-body)]">{question.category}</span>
                      {question.theme ? ` · ${question.theme}` : ''}
                      {question.frequency > 0 ? ` · reported ${question.frequency}×` : ''}
                    </p>
                    {question.guidance && <p className="text-sm text-[var(--alo-body)]">{question.guidance}</p>}
                    <p>
                      Source: {question.sourceUrl
                        ? <a href={question.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">{question.source}</a>
                        : question.source}
                      {' · '}{question.sourceLabel ?? 'Source type not recorded'}
                      {' · '}verified {formatDate(question.lastVerifiedAt)}
                      {question.daysSinceVerified !== null ? ` (${question.daysSinceVerified} days ago)` : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(data.meta.excluded?.length ?? 0) > 0 && (
            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-[var(--crm-warning-text)]" aria-hidden />
                  Withheld from this pack ({data.meta.excluded?.length})
                </CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">Shown for transparency — these are never served as current evidence.</p>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-[var(--alo-text-muted)]">
                {data.meta.excluded?.slice(0, 25).map((entry) => (
                  <p key={`${entry.id}-${entry.reason}`}>
                    <span className="font-semibold text-[var(--alo-body)]">{entry.reason}</span>
                    {entry.detail ? ` (${entry.detail})` : ''} — {entry.question}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
            <CardContent className="space-y-2 p-5 text-xs text-[var(--alo-body)]">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
                <Info className="h-4 w-4" aria-hidden />
                What this library does and does not claim
              </p>
              {(data.meta.disclaimers ?? []).map((line) => <p key={line}>• {line}</p>)}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
