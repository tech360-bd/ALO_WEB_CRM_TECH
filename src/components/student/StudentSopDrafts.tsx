'use client';

/**
 * SOP drafts — /student/sop
 *
 * Lists GET /api/student/sop drafts and creates new ones via the matching POST.
 * Review runs the deterministic local rule engine in lib/advisory-review.ts —
 * no model call, no claim about what an admissions officer will decide.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Sparkles, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import {
  reviewStatementOfPurpose, type Finding,
} from '@/lib/advisory-review';

interface SopDraft {
  id: string;
  title?: string;
  universityName: string;
  courseName: string;
  country: string;
  content: string;
  version: number;
  status: string;
  reviewRequested: boolean;
  reviewerNote: string;
  updatedAt: string;
}

const SEVERITY_ICON = {
  error: XCircle,
  warning: Info,
  info: CheckCircle2,
} as const;

const SEVERITY_STYLE = {
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-[var(--alo-text-muted)]',
} as const;

export default function StudentSop() {
  const { data, state, error, reload } = useStudentResource<{ drafts: SopDraft[] }>('/api/student/sop');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', universityName: '', courseName: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const drafts = data?.drafts ?? [];
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0] ?? null;

  const review = useMemo(() => {
    if (!selected?.content?.trim()) return null;
    return reviewStatementOfPurpose(selected.content, {
      university: selected.universityName,
      programme: selected.courseName,
    });
  }, [selected]);

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!form.title.trim()) {
      setSubmitError('Give this draft a title, usually the university name.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/student/sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Could not save that draft');
      setCreating(false);
      setForm({ title: '', universityName: '', courseName: '', content: '' });
      await reload();
    } catch (createError) {
      setSubmitError(createError instanceof Error ? createError.message : 'Something went wrong saving that draft.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="Statement of Purpose"
          description="Draft your SOPs here and get structure feedback before your counselor reviews them."
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
                <Link href="/ai/sop-helper">
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Open SOP Helper
                </Link>
              </Button>
              <Button
 type="button"
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-[var(--alo-cta)]"
 onClick={() => setCreating((value) => !value)}
              >
                {creating ? 'Cancel' : 'New Draft'}
              </Button>
            </div>
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your drafts…" />}

        {state === 'error' && <PortalError message={error ?? 'Your SOP drafts could not be loaded.'} onRetry={reload} />}

        {creating && (
          <PortalCard className="mb-6" title="New SOP draft" description="You can keep editing it afterwards">
            <form className="space-y-3 px-5 py-4" onSubmit={createDraft}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sop-title" className="text-[12px] font-semibold text-[var(--alo-body)]">Title</Label>
                  <Input
                    id="sop-title"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="SOP — MSc Data Science"
                    className="h-9 rounded-input"
                    maxLength={191}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sop-uni" className="text-[12px] font-semibold text-[var(--alo-body)]">University</Label>
                  <Input
                    id="sop-uni"
                    value={form.universityName}
                    onChange={(event) => setForm((prev) => ({ ...prev, universityName: event.target.value }))}
                    placeholder="University name"
                    className="h-9 rounded-input"
                    maxLength={191}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sop-course" className="text-[12px] font-semibold text-[var(--alo-body)]">Course</Label>
                  <Input
                    id="sop-course"
                    value={form.courseName}
                    onChange={(event) => setForm((prev) => ({ ...prev, courseName: event.target.value }))}
                    placeholder="Course name"
                    className="h-9 rounded-input"
                    maxLength={191}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sop-content" className="text-[12px] font-semibold text-[var(--alo-body)]">Draft</Label>
                <Textarea
                  id="sop-content"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Start writing, or paste what you have so far."
                  className="min-h-40 rounded-input text-[13px] leading-relaxed"
                />
              </div>
              {submitError && (
                <p className="rounded-input border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
                  {submitError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
 type="submit"
 disabled={submitting}
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-[var(--alo-cta)]"
 >
                  {submitting ? 'Saving…' : 'Save Draft'}
                </Button>
                <Button
 type="button"
 variant="outline"
 className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold"
 onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </PortalCard>
        )}

        {state === 'ready' && drafts.length === 0 && !creating && (
          <PortalCard>
            <PortalEmpty
              title="No SOP drafts yet"
              description="Create a blank draft here, or use the SOP Helper to build one from your background first."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
 type="button"
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-[var(--alo-cta)]"
 onClick={() => setCreating(true)}
                  >
                    Create Blank Draft
                  </Button>
                  <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                    <Link href="/ai/sop-helper">Use SOP Helper</Link>
                  </Button>
                </div>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && drafts.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <PortalCard>
              <div className="border-b border-[var(--alo-border)] px-5 py-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">
                  Drafts ({drafts.length})
                </h2>
              </div>
              <ul className="divide-y divide-[var(--alo-border)]">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      type="button"
                      className={`w-full px-5 py-3 text-left transition-colors hover:bg-[var(--alo-page)] ${
                        selected?.id === draft.id ? 'bg-[var(--alo-brand-pale)]' : ''
                      }`}
                      onClick={() => setSelectedId(draft.id)}
                    >
                      <p className="text-[13px] font-semibold text-[var(--alo-text)]">
                        {draft.universityName || 'Untitled draft'}
                      </p>
                      {draft.courseName && (
                        <p className="mt-0.5 truncate text-[12px] text-[var(--alo-text-muted)]">{draft.courseName}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <StatusBadge value={draft.status} />
                        <span className="text-[11px] text-[var(--alo-text-muted)]">v{draft.version}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </PortalCard>

            <div className="space-y-4">
              {selected && (
                <>
                  <PortalCard
                    title={selected.universityName || 'Untitled draft'}
                    description={
                      [selected.courseName, selected.country].filter(Boolean).join(' · ') ||
                      `Updated ${new Date(selected.updatedAt).toLocaleDateString('en-GB')}`
                    }
                  >
                    {selected.reviewerNote && (
                      <div className="border-b border-[var(--alo-border)] bg-amber-50 px-5 py-3">
                        <p className="text-[12px] font-semibold text-amber-800">Counselor note</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-amber-900">{selected.reviewerNote}</p>
                      </div>
                    )}
                    {selected.content?.trim() ? (
                      <pre className="whitespace-pre-wrap px-5 py-4 font-sans text-[13px] leading-relaxed text-[var(--alo-body)]">
                        {selected.content}
                      </pre>
                    ) : (
                      <div className="px-5 py-4">
                        <PortalEmpty
                          title="This draft is empty"
                          description="Add your statement in the SOP Helper, or ask your counselor to start it with you."
                        />
                      </div>
                    )}
                  </PortalCard>

                  {review && (
                    <PortalCard
                      title="Structure review"
                      description={`Automatic checks · completeness ${review.completenessScore}/100`}
                    >
                      <div className="border-b border-[var(--alo-border)] px-5 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[13px] font-semibold text-[var(--alo-body)]">
                            {review.wordCount} words
                          </span>
                          <span className="text-[12px] text-[var(--alo-text-muted)]">
                            {review.findings.length} point{review.findings.length === 1 ? '' : 's'} raised
                          </span>
                        </div>
                      </div>
                      <ul className="divide-y divide-[var(--alo-border)]">
                        {review.findings.map((finding: Finding, index: number) => {
                          const Icon = SEVERITY_ICON[finding.severity];
                          return (
                            <li key={finding.id || index} className="flex gap-3 px-5 py-3">
                              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_STYLE[finding.severity]}`} aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--alo-text)]">{finding.label}</p>
                                <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{finding.detail}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="px-5 py-3 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                        These are automatic structure checks, not a judgment on whether your statement will be
                        accepted. Your counselor reviews the final version.
                      </p>
                    </PortalCard>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
          <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          A well-structured statement helps, but admission decisions rest with the university. Nothing here is a
          guarantee of acceptance.
        </p>
      </div>
    </div>
  );
}
