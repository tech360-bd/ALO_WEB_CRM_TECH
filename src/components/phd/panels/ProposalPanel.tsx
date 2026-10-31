'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, inputClass, useApi, useProjectId } from '../ui';

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  currentVersion: number;
  wordCount: number;
  updatedAt: string;
  programme?: { name: string } | null;
}

interface ProposalDetail {
  proposal: {
    id: string;
    title: string;
    status: string;
    currentVersion: number;
    wordCount: number;
    sections: Array<{ id: string; sectionKey: string; title: string; content: string; required: boolean; sortOrder: number }>;
    citations: Array<{ id: string; rawText: string; sectionKey: string; isValid: boolean; validationNote: string; source: { title: string; verificationStatus: string } | null }>;
    versions: Array<{ id: string; version: number; wordCount: number; changeSummary: string; createdAt: string }>;
    programme?: { name: string } | null;
    university?: { name: string } | null;
  };
}

interface QualityResponse {
  report: {
    checks: Array<{ code: string; severity: 'ERROR' | 'WARNING' | 'INFO'; message: string; sectionKey?: string }>;
    errorCount: number;
    warningCount: number;
    wordCount: number;
    citationCount: number;
    verifiedCitationCount: number;
    readiness: string;
    draftLabel: string;
    unsupportedClaims: Array<{ sectionKey: string; sentence: string; reason: string }>;
  };
  requirements: {
    wordLimit: number | null;
    referencingStyle: string;
    abstractRequired: boolean | null;
    verificationStatus: string;
    universityName?: string;
    programmeName?: string;
  };
}

export default function ProposalPanel() {
  const { projectId, error: projectError, loading: projectLoading } = useProjectId();
  const { data, error, loading, reload } = useApi<{ proposals: ProposalRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/proposals` : null,
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [draftSections, setDraftSections] = React.useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const detail = useApi<ProposalDetail>(activeId ? `/api/phd/proposals/${activeId}` : null);
  const quality = useApi<QualityResponse>(activeId ? `/api/phd/proposals/${activeId}/quality` : null);

  React.useEffect(() => {
    const sections = detail.data?.proposal?.sections;
    if (!sections) return;
    const next: Record<string, string> = {};
    for (const section of sections) next[section.sectionKey] = section.content;
    setDraftSections(next);
  }, [detail.data]);

  React.useEffect(() => {
    if (data?.proposals?.length && !activeId) setActiveId(data.proposals[0].id);
  }, [data, activeId]);

  async function createProposal() {
    if (!projectId || newTitle.trim().length < 5) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await apiSend<{ proposal: { id: string } }>(`/api/phd/projects/${projectId}/proposals`, 'POST', {
        title: newTitle.trim(),
      });
      setNewTitle('');
      await reload();
      setActiveId(result.proposal.id);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The proposal could not be created.');
    } finally {
      setBusy(false);
    }
  }

  async function saveSections() {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/proposals/${activeId}`, 'PATCH', {
        sections: Object.entries(draftSections).map(([sectionKey, content]) => ({ sectionKey, content })),
        createVersion: true,
        changeSummary: 'Edited in the proposal builder',
      });
      setSavedAt(new Date().toLocaleTimeString());
      await detail.reload();
      await quality.reload();
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The proposal could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  if (projectLoading) return <Loading label="Preparing your project…" />;
  if (projectError) return <ErrorBox message={projectError} />;

  return (
    <div className="space-y-4">
      <Card title="Your proposals" description="Each proposal carries the 20 required sections and its own version history.">
        {loading ? (
          <Loading label="Loading proposals…" />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !data || data.proposals.length === 0 ? (
          <Empty title="No proposals yet" hint="Create one below; you can rename and revise it as often as you like." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.proposals.map((proposal) => (
              <li key={proposal.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(proposal.id)}
                  className={
                    activeId === proposal.id
                      ? 'rounded-lg bg-[var(--alo-brand)] px-3 py-2 text-xs font-semibold text-white'
                      : 'rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-body)]'
                  }
                >
                  {proposal.title} · v{proposal.currentVersion}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="New proposal title">
            <input
              className={inputClass}
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="e.g. AI adoption in UK manufacturing SMEs"
            />
          </Field>
          <Button onClick={createProposal} disabled={busy || newTitle.trim().length < 5 || !projectId}>
            Create proposal
          </Button>
        </div>
        {actionError && <p className="mt-3 text-xs text-crm-danger-text">{actionError}</p>}
      </Card>

      {activeId && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card
            title="Editor"
            description="Write in your own words. Unsupported claims are flagged by the quality check, not silently accepted."
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-2">
                {savedAt && <Pill tone="ok">Saved {savedAt}</Pill>}
                <Button onClick={saveSections} disabled={busy}>
                  {busy ? 'Saving…' : 'Save sections'}
                </Button>
              </div>
            }
          >
            {detail.loading ? (
              <Loading label="Loading proposal…" />
            ) : detail.error ? (
              <ErrorBox message={detail.error} />
            ) : detail.data ? (
              <div className="space-y-3">
                {detail.data.proposal.sections.map((section) => (
                  <Field
                    key={section.sectionKey}
                    label={`${section.title}${section.required ? '' : ' (optional)'}`}
                    hint={section.required ? undefined : 'Not mandatory for every university — check the programme requirements.'}
                  >
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
            ) : null}
          </Card>

          <div className="space-y-4">
            <Card title="Quality check" description="Matches the title, problem, aim, questions and method; flags unsupported claims.">
              {quality.loading ? (
                <Loading label="Checking…" />
              ) : quality.error ? (
                <ErrorBox message={quality.error} />
              ) : quality.data ? (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={quality.data.report.errorCount > 0 ? 'bad' : 'ok'}>{quality.data.report.errorCount} errors</Pill>
                    <Pill tone={quality.data.report.warningCount > 0 ? 'warn' : 'ok'}>{quality.data.report.warningCount} warnings</Pill>
                    <Pill tone="info">{quality.data.report.readiness.replace(/_/g, ' ').toLowerCase()}</Pill>
                  </div>
                  <p className="text-[var(--alo-body)]">
                    {quality.data.report.wordCount} words · {quality.data.report.citationCount} citations (
                    {quality.data.report.verifiedCitationCount} verified)
                  </p>
                  <p className="text-[11px] text-[var(--alo-text-muted)]">{quality.data.report.draftLabel}</p>
                  {quality.data.requirements.verificationStatus !== 'VERIFIED_OFFICIAL' && (
                    <p className="rounded-lg bg-crm-warning-bg p-2 text-[11px] text-crm-warning-text">
                      This university&apos;s proposal requirements are not verified. Treat the document as a general draft
                      and check the official instructions before submitting.
                    </p>
                  )}
                  <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {quality.data.report.checks.slice(0, 12).map((check, index) => (
                      <li key={`${check.code}-${index}`} className="text-[var(--alo-body)]">
                        <span className={check.severity === 'ERROR' ? 'font-semibold text-crm-danger-text' : check.severity === 'WARNING' ? 'font-semibold text-crm-warning-text' : 'text-[var(--alo-text-muted)]'}>
                          {check.severity}
                        </span>{' '}
                        {check.message}
                      </li>
                    ))}
                  </ul>
                  {quality.data.report.unsupportedClaims.length > 0 && (
                    <div>
                      <p className="font-semibold text-[var(--alo-text)]">Claims needing a source</p>
                      <ul className="mt-1 space-y-1 text-[11px] text-[var(--alo-body)]">
                        {quality.data.report.unsupportedClaims.slice(0, 5).map((claim, index) => (
                          <li key={index}>• {claim.sentence.slice(0, 160)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </Card>

            <Card title="Versions and export" description="Exports are generated from saved content and labelled as drafts where appropriate.">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/phd/proposals/${activeId}/export?format=docx`}
                  className="rounded-lg bg-[var(--alo-brand)] px-3 py-2 text-xs font-semibold text-white"
                >
                  Download DOCX
                </a>
                <a
                  href={`/api/phd/proposals/${activeId}/export?format=pdf`}
                  className="rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-text)]"
                >
                  Download PDF
                </a>
              </div>
              {detail.data?.proposal.versions.length ? (
                <ul className="mt-3 space-y-1 text-xs text-[var(--alo-body)]">
                  {detail.data.proposal.versions.slice(0, 6).map((version) => (
                    <li key={version.id} className="flex items-center justify-between gap-2 border-b border-[var(--alo-border)]/60 pb-1">
                      <span>
                        v{version.version} · {version.wordCount} words · {version.changeSummary || 'no summary'}
                      </span>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-[var(--alo-brand)] underline"
                        onClick={async () => {
                          try {
                            await apiSend(`/api/phd/proposals/${activeId}/restore`, 'POST', { versionId: version.id });
                            await detail.reload();
                            await quality.reload();
                          } catch (cause) {
                            setActionError(cause instanceof Error ? cause.message : 'Restore failed.');
                          }
                        }}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">No saved versions yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
