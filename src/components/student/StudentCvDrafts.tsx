'use client';

/**
 * CV drafts — /student/cv
 *
 * Lists GET /api/student/cv drafts and creates new ones via the matching POST.
 * Review runs the deterministic rule engine in lib/advisory-review.ts, which
 * scores structural completeness only.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Info, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { reviewCv, type Finding } from '@/lib/advisory-review';

interface CvDraft {
  id: string;
  content: string;
  version: number;
  status: string;
  reviewRequested: boolean;
  reviewerNote: string;
  exportedPdfUrl: string;
  exportedDocxUrl: string;
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

/**
 * The stored draft is free text, so the completeness check needs the fields the
 * rule engine expects. Anything that cannot be read from the text is left
 * undefined rather than invented, so the review reports it as missing instead
 * of passing on data we do not have.
 */
function deriveProfile(content: string) {
  const lower = content.toLowerCase();
  const has = (...needles: string[]) => needles.some((needle) => lower.includes(needle));

  const email = (content.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0];
  const phone = (content.match(/\+?[0-9][0-9\s().-]{6,20}/) || [])[0];

  // The full name is deliberately omitted: it cannot be read reliably from free
  // text, so the review reports it as missing rather than guessing.
  return {
    email,
    phone,
    education: has('bachelor', 'bsc', 'b.sc', 'hsc', 'ssc', 'diploma', 'education', 'university', 'college')
      ? [{ institution: undefined, qualification: undefined }]
      : [],
    experience: has('experience', 'intern', 'employed', 'worked at', 'assistant', 'engineer', 'officer', 'executive')
      ? [{ role: undefined, organisation: undefined }]
      : [],
    skills: has('skill', 'proficient', 'python', 'excel', 'communication', 'leadership')
      ? ['listed']
      : [],
    achievements: has('award', 'scholarship', 'published', 'first class', 'competition', 'certification')
      ? ['listed']
      : [],
    languages: has('english', 'bangla', 'bengali', 'language', 'ielts') ? ['listed'] : [],
  };
}

export default function StudentCv() {
  const { data, state, error, reload } = useStudentResource<{ drafts: CvDraft[] }>('/api/student/cv');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const drafts = data?.drafts ?? [];
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0] ?? null;

  const review = useMemo(() => {
    if (!selected?.content?.trim()) return null;
    return reviewCv(deriveProfile(selected.content));
  }, [selected]);

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!form.title.trim()) {
      setSubmitError('Give this draft a title, usually the course you are applying to.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/student/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Could not save that draft');
      setCreating(false);
      setForm({ title: '', content: '' });
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
          title="Academic CV"
          description="Build the CV your university applications will use, with automatic completeness checks."
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
                <Link href="/ai/cv-helper">
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Open CV Helper
                </Link>
              </Button>
              <Button
 type="button"
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]"
 onClick={() => setCreating((value) => !value)}
              >
                {creating ? 'Cancel' : 'New Draft'}
              </Button>
            </div>
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your CV drafts…" />}

        {state === 'error' && <PortalError message={error ?? 'Your CV drafts could not be loaded.'} onRetry={reload} />}

        {creating && (
          <PortalCard className="mb-6" title="New CV draft" description="You can keep editing it afterwards">
            <form className="space-y-3 px-5 py-4" onSubmit={createDraft}>
              <div className="space-y-1.5">
                <Label htmlFor="cv-title" className="text-[12px] font-semibold text-[var(--alo-body)]">Title</Label>
                <Input
                  id="cv-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="CV — MSc Computer Science applications"
                  className="h-9 rounded-input"
                  maxLength={191}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cv-content" className="text-[12px] font-semibold text-[var(--alo-body)]">Content</Label>
                <Textarea
                  id="cv-content"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Education, work experience, skills and achievements."
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
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]"
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
              title="No CV drafts yet"
              description="The CV Helper builds one from your education and experience, or you can start a blank draft here."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]">
                    <Link href="/ai/cv-helper">Build CV with Helper</Link>
                  </Button>
                  <Button
 type="button"
 variant="outline"
 className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold"
 onClick={() => setCreating(true)}
                  >
                    Create Blank Draft
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
                        {draft.content ? draft.content.split('\n')[0].slice(0, 40) || 'Untitled draft' : 'Untitled draft'}
                      </p>
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
                    title={`Draft v${selected.version}`}
                    description={`Updated ${new Date(selected.updatedAt).toLocaleDateString('en-GB')}`}
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
                          description="Build it in the CV Helper, or ask your counselor to start it with you."
                        />
                      </div>
                    )}
                    {(selected.exportedPdfUrl || selected.exportedDocxUrl) && (
                      <div className="flex flex-wrap gap-2 border-t border-[var(--alo-border)] px-5 py-3">
                        {selected.exportedPdfUrl && (
                          <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                            <a href={selected.exportedPdfUrl}>Download PDF</a>
                          </Button>
                        )}
                        {selected.exportedDocxUrl && (
                          <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                            <a href={selected.exportedDocxUrl}>Download DOCX</a>
                          </Button>
                        )}
                      </div>
                    )}
                  </PortalCard>

                  {review && (
                    <PortalCard
                      title="Completeness review"
                      description={`Automatic checks · completeness ${review.completenessScore}/100`}
                    >
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
                        This measures whether the usual sections are present. It reads your draft as plain text, so it
                        cannot judge the quality of what you have written.
                      </p>
                    </PortalCard>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
