'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, formatDate, inputClass, useApi, useProjectId } from '../ui';
import { SOP_STATUS_LABELS, type SopStatus } from '@/lib/phd/sop/constants';

interface SopListRow {
  id: string;
  title: string;
  status: string;
  version: number;
  targetWords: number;
  wordLimit: number | null;
  aiDisclosureRequired: boolean | null;
  universityName: string | null;
  programmeName: string | null;
  wordCount: number;
  filledSections: number;
  updatedAt: string;
  universityId: string | null;
  programmeId: string | null;
}

interface SopSection {
  id: string;
  sectionKey: string;
  title: string;
  sortOrder: number;
  content: string;
  aiAssisted: boolean;
}

interface SopDetail {
  sop: {
    id: string;
    title: string;
    status: string;
    version: number;
    targetWords: number;
    wordLimit: number | null;
    aiDisclosureRequired: boolean | null;
    personalFacts: {
      motivation: string;
      whyProgramme: string;
      whyUniversity: string;
      achievements: string[];
      careerPlan: string;
      professionalContext: string;
      aiUse: string;
      reviewerNotes: string;
    };
    notes: string;
    university: { id: string; name: string } | null;
    programme: { id: string; name: string } | null;
    sections: SopSection[];
    versions: Array<{ id: string; version: number; changeSummary: string; createdAt: string }>;
    reviews: Array<{ id: string; decision: string; reviewerRole: string; comments: string; createdAt: string }>;
  };
}

interface ReviewReport {
  report: {
    checks: Array<{ code: string; severity: 'ERROR' | 'WARNING' | 'INFO'; message: string; sectionKey?: string }>;
    errorCount: number;
    warningCount: number;
    wordCount: number;
    emptySections: string[];
    genericPhrases: string[];
    unsupportedClaims: Array<{ sectionKey: string; sentence: string; reason: string }>;
    universityMismatches: string[];
    aiDisclosure: { required: boolean | null; included: boolean; status: string };
    wordLimit: { limit: number | null; actual: number; status: string; target: number };
    readiness: string;
    detectorStatement: string;
  };
}

interface CatalogueProgramme {
  id: string;
  name: string;
  award: string;
  university: { name: string; slug: string };
}

const STATUS_TONE: Record<string, 'default' | 'ok' | 'warn' | 'bad' | 'info'> = {
  DRAFT: 'warn',
  STUDENT_REVIEWED: 'info',
  FINAL_APPROVED: 'ok',
  REQUIREMENTS_VERIFIED: 'ok',
  EXPORT_VERIFIED: 'ok',
};

export default function SopPanel() {
  const { projectId, error: projectError, loading: projectLoading } = useProjectId();
  const list = useApi<{ sops: SopListRow[] }>(projectId ? `/api/phd/projects/${projectId}/sops` : null);
  const catalogue = useApi<{ programmes: CatalogueProgramme[] }>('/api/research/programmes?pageSize=48');

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [programmeId, setProgrammeId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [draftSections, setDraftSections] = React.useState<Record<string, string>>({});
  const [facts, setFacts] = React.useState({
    motivation: '',
    whyProgramme: '',
    whyUniversity: '',
    achievements: '',
    careerPlan: '',
    professionalContext: '',
    aiUse: '',
  });

  const detail = useApi<SopDetail>(activeId ? `/api/phd/sops/${activeId}` : null);
  const review = useApi<ReviewReport>(activeId ? `/api/phd/sops/${activeId}/review` : null);

  React.useEffect(() => {
    if (list.data?.sops.length && !activeId) setActiveId(list.data.sops[0].id);
  }, [list.data, activeId]);

  React.useEffect(() => {
    const sop = detail.data?.sop;
    if (!sop) return;
    const next: Record<string, string> = {};
    for (const section of sop.sections) next[section.sectionKey] = section.content;
    setDraftSections(next);
    setFacts({
      motivation: sop.personalFacts.motivation,
      whyProgramme: sop.personalFacts.whyProgramme,
      whyUniversity: sop.personalFacts.whyUniversity,
      achievements: sop.personalFacts.achievements.join('\n'),
      careerPlan: sop.personalFacts.careerPlan,
      professionalContext: sop.personalFacts.professionalContext,
      aiUse: sop.personalFacts.aiUse,
    });
  }, [detail.data]);

  const sop = detail.data?.sop;

  async function createStatement() {
    if (!projectId || !programmeId) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await apiSend<{ sop: { id: string } }>(`/api/phd/projects/${projectId}/sops`, 'POST', {
        programmeId,
      });
      setProgrammeId('');
      await list.reload();
      setActiveId(result.sop.id);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The statement could not be created.');
    } finally {
      setBusy(false);
    }
  }

  async function saveFacts() {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await apiSend(`/api/phd/sops/${activeId}`, 'PATCH', {
        personalFacts: {
          motivation: facts.motivation,
          whyProgramme: facts.whyProgramme,
          whyUniversity: facts.whyUniversity,
          achievements: facts.achievements.split('\n').map((line) => line.trim()).filter(Boolean),
          careerPlan: facts.careerPlan,
          professionalContext: facts.professionalContext,
          aiUse: facts.aiUse,
        },
      });
      setNotice('Personal facts saved.');
      await detail.reload();
      await review.reload();
      await list.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The facts could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const result = await apiSend<{ sectionsWritten: number; sectionsPreserved: number; notes: string[] }>(
        `/api/phd/sops/${activeId}/generate`,
        'POST',
        { overwrite: false },
      );
      setNotice(
        `Draft generated: ${result.sectionsWritten} section(s) written, ${result.sectionsPreserved} preserved. ${result.notes.join(' ')}`,
      );
      await detail.reload();
      await review.reload();
      await list.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The draft could not be generated.');
    } finally {
      setBusy(false);
    }
  }

  async function saveSections() {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await apiSend(`/api/phd/sops/${activeId}/sections`, 'PATCH', {
        sections: Object.entries(draftSections).map(([sectionKey, content]) => ({ sectionKey, content })),
        changeSummary: 'Edited in the SOP builder',
      });
      setNotice('Sections saved as a new version.');
      await detail.reload();
      await review.reload();
      await list.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The sections could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function moveTo(status: string) {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await apiSend(`/api/phd/sops/${activeId}/status`, 'POST', { status });
      setNotice(`Status updated to ${status.replace(/_/g, ' ').toLowerCase()}.`);
      await detail.reload();
      await review.reload();
      await list.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The status could not be changed.');
    } finally {
      setBusy(false);
    }
  }

  if (projectLoading) return <Loading label="Preparing your project…" />;
  if (projectError) return <ErrorBox message={projectError} />;

  const approved = sop ? ['FINAL_APPROVED', 'REQUIREMENTS_VERIFIED', 'EXPORT_VERIFIED'].includes(sop.status) : false;

  return (
    <div className="space-y-4">
      <Card
        title="Statements of purpose"
        description="One statement per programme. Drafts are built only from facts you supply — never from invented achievements or a shared template."
      >
        {list.loading ? (
          <Loading label="Loading statements…" />
        ) : list.error ? (
          <ErrorBox message={list.error} />
        ) : !list.data || list.data.sops.length === 0 ? (
          <Empty title="No statement yet" hint="Choose a verified programme below; you can draft, edit and review it here." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {list.data.sops.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(row.id)}
                  className={
                    activeId === row.id
                      ? 'rounded-lg bg-[var(--alo-brand)] px-3 py-2 text-left text-xs font-semibold text-white'
                      : 'rounded-lg border border-[var(--alo-border)] px-3 py-2 text-left text-xs font-semibold text-[var(--alo-body)]'
                  }
                >
                  {row.universityName ?? 'No university'}
                  {row.programmeName ? ` — ${row.programmeName}` : ''}
                  <span className="block text-[11px] font-normal">
                    {row.status.replace(/_/g, ' ').toLowerCase()} · {row.wordCount} words
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <Field label="Add a statement for a programme">
              <select className={inputClass} value={programmeId} onChange={(event) => setProgrammeId(event.target.value)}>
                <option value="">{catalogue.loading ? 'Loading programmes…' : 'Select a verified programme'}</option>
                {(catalogue.data?.programmes ?? []).map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.university.name} — {programme.name} ({programme.award})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button onClick={createStatement} disabled={busy || !programmeId || !projectId}>
            Create statement
          </Button>
        </div>
        {actionError && <p className="mt-3 text-xs text-crm-danger-text">{actionError}</p>}
        {notice && <p className="mt-3 text-[11px] text-[var(--alo-body)]">{notice}</p>}
      </Card>

      {sop && (
        <>
          <Card
            title={sop.title}
            description="Everything written here is your own content or comes from a fact in your workspace. The review report checks content, never authorship scores."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={STATUS_TONE[sop.status] ?? 'default'}>
                  {SOP_STATUS_LABELS[sop.status as SopStatus] ?? sop.status.replace(/_/g, ' ').toLowerCase()}
                </Pill>
                <Pill tone="info">v{sop.version}</Pill>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={generate} disabled={busy}>
                {busy ? 'Working…' : 'Generate draft from my facts'}
              </Button>
              <Button variant="outline" onClick={saveFacts} disabled={busy}>
                Save personal facts
              </Button>
              {sop.status === 'DRAFT' && (
                <Button onClick={() => moveTo('STUDENT_REVIEWED')} disabled={busy}>
                  Confirm my review
                </Button>
              )}
              {sop.status === 'STUDENT_REVIEWED' && (
                <Button onClick={() => moveTo('FINAL_APPROVED')} disabled={busy}>
                  Approve as final (adviser)
                </Button>
              )}
              {(sop.status === 'FINAL_APPROVED' || sop.status === 'REQUIREMENTS_VERIFIED') && (
                <Button onClick={() => moveTo('REQUIREMENTS_VERIFIED')} disabled={busy}>
                  Confirm requirements verified
                </Button>
              )}
              <a
                href={`/api/phd/sops/${sop.id}/export?format=report`}
                className="rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-text)]"
              >
                Review report (PDF)
              </a>
              {approved && (
                <>
                  <a
                    href={`/api/phd/sops/${sop.id}/export?format=docx`}
                    className="rounded-lg bg-[var(--alo-brand)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Student_SOP_Final.docx
                  </a>
                  <a
                    href={`/api/phd/sops/${sop.id}/export?format=pdf`}
                    className="rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-text)]"
                  >
                    Student_SOP_Final.pdf
                  </a>
                </>
              )}
            </div>
            {!approved && (
              <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">
                Final documents are locked until a human reviewer approves the statement. The review report is always
                available.
              </p>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              title="Your facts"
              description="These fields are the only source of personal claims. Nothing here is ever invented for you."
              className="lg:col-span-1"
            >
              <div className="space-y-3">
                <Field label="Motivation" hint="Why this research, in your words.">
                  <textarea className={inputClass} rows={3} value={facts.motivation} onChange={(event) => setFacts({ ...facts, motivation: event.target.value })} />
                </Field>
                <Field label="Why this programme">
                  <textarea className={inputClass} rows={2} value={facts.whyProgramme} onChange={(event) => setFacts({ ...facts, whyProgramme: event.target.value })} />
                </Field>
                <Field label="Why this university">
                  <textarea className={inputClass} rows={2} value={facts.whyUniversity} onChange={(event) => setFacts({ ...facts, whyUniversity: event.target.value })} />
                </Field>
                <Field label="Professional context">
                  <textarea className={inputClass} rows={2} value={facts.professionalContext} onChange={(event) => setFacts({ ...facts, professionalContext: event.target.value })} />
                </Field>
                <Field label="Achievements" hint="One per line. Only list things that are true and checkable.">
                  <textarea className={inputClass} rows={3} value={facts.achievements} onChange={(event) => setFacts({ ...facts, achievements: event.target.value })} />
                </Field>
                <Field label="Career plan">
                  <textarea className={inputClass} rows={2} value={facts.careerPlan} onChange={(event) => setFacts({ ...facts, careerPlan: event.target.value })} />
                </Field>
                <Field label="How you used drafting tools" hint="Only needed where the institution asks for a disclosure.">
                  <textarea className={inputClass} rows={2} value={facts.aiUse} onChange={(event) => setFacts({ ...facts, aiUse: event.target.value })} />
                </Field>
              </div>
            </Card>

            <Card
              title="Statement sections"
              description="Ten parts. Empty sections stay empty until you write them — the builder will not fill them with filler."
              className="lg:col-span-2"
              action={
                <Button onClick={saveSections} disabled={busy}>
                  {busy ? 'Saving…' : 'Save sections'}
                </Button>
              }
            >
              {detail.loading ? (
                <Loading label="Loading statement…" />
              ) : detail.error ? (
                <ErrorBox message={detail.error} />
              ) : (
                <div className="space-y-3">
                  {sop.sections.map((section) => (
                    <Field key={section.sectionKey} label={section.title}>
                      <textarea
                        className={inputClass}
                        rows={3}
                        value={draftSections[section.sectionKey] ?? ''}
                        onChange={(event) =>
                          setDraftSections((current) => ({ ...current, [section.sectionKey]: event.target.value }))
                        }
                      />
                    </Field>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Review" description="Blocking issues must be fixed before the statement can leave draft." className="lg:col-span-2">
              {review.loading ? (
                <Loading label="Checking…" />
              ) : review.error ? (
                <ErrorBox message={review.error} />
              ) : review.data ? (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={review.data.report.errorCount ? 'bad' : 'ok'}>{review.data.report.errorCount} blocking</Pill>
                    <Pill tone={review.data.report.warningCount ? 'warn' : 'ok'}>{review.data.report.warningCount} warnings</Pill>
                    <Pill tone="info">{review.data.report.readiness.replace(/_/g, ' ').toLowerCase()}</Pill>
                    <Pill tone={review.data.report.wordLimit.status === 'EXCEEDED' ? 'bad' : 'default'}>
                      {review.data.report.wordCount} words
                      {review.data.report.wordLimit.limit ? ` / ${review.data.report.wordLimit.limit}` : ' (limit not published)'}
                    </Pill>
                  </div>
                  <ul className="max-h-80 space-y-1 overflow-y-auto">
                    {review.data.report.checks.map((check, index) => (
                      <li key={`${check.code}-${index}`} className="text-[var(--alo-body)]">
                        <span
                          className={
                            check.severity === 'ERROR'
                              ? 'font-semibold text-crm-danger-text'
                              : check.severity === 'WARNING'
                                ? 'font-semibold text-crm-warning-text'
                                : 'text-[var(--alo-text-muted)]'
                          }
                        >
                          {check.severity}
                        </span>{' '}
                        {check.message}
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-lg bg-[var(--alo-page)] p-3 text-[11px] text-[var(--alo-text-muted)]">
                    {review.data.report.detectorStatement}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card title="Versions and review trail">
              <p className="text-[11px] font-semibold text-[var(--alo-text)]">Versions</p>
              <ul className="mt-1 space-y-1 text-[11px] text-[var(--alo-body)]">
                {sop.versions.length === 0 && <li>No saved versions.</li>}
                {sop.versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between gap-2 border-b border-[var(--alo-border)]/60 pb-1">
                    <span>
                      v{version.version} · {version.changeSummary || 'change'} · {formatDate(version.createdAt)}
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[var(--alo-brand)] underline"
                      onClick={async () => {
                        setBusy(true);
                        setActionError(null);
                        try {
                          await apiSend(`/api/phd/sops/${sop.id}/versions`, 'POST', { versionId: version.id });
                          setNotice(`Restored version ${version.version}.`);
                          await detail.reload();
                          await review.reload();
                        } catch (cause) {
                          setActionError(cause instanceof Error ? cause.message : 'Restore failed.');
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] font-semibold text-[var(--alo-text)]">Reviews</p>
              <ul className="mt-1 space-y-1 text-[11px] text-[var(--alo-body)]">
                {sop.reviews.length === 0 && <li>No review recorded yet.</li>}
                {sop.reviews.map((row) => (
                  <li key={row.id}>
                    {formatDate(row.createdAt)} — {row.decision.replace(/_/g, ' ').toLowerCase()} ({row.reviewerRole.toLowerCase()})
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
