'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, inputClass, useApi, useProjectId } from '../ui';

interface TopicRow {
  id: string;
  workingTitle: string;
  areaCode: string;
  researchField: string;
  researchSubfield: string;
  mainQuestion: string;
  isSelected: boolean;
  confidence: string;
  noveltyStatus: string;
  evidenceQuality: string;
  createdAt: string;
  evaluations: Array<{ criterion: string; score: number; explanation: string }>;
  questionCount: number;
  objectiveCount: number;
}

export default function TopicsPanel() {
  const { projectId, error: projectError, loading: projectLoading } = useProjectId();
  const { data, error, loading, reload } = useApi<{ topics: TopicRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/topics` : null,
  );
  const [discipline, setDiscipline] = React.useState('UNDECIDED');
  const [count, setCount] = React.useState(8);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [selecting, setSelecting] = React.useState<string | null>(null);

  async function generate() {
    if (!projectId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/topics`, 'POST', {
        ...(discipline !== 'UNDECIDED' ? { discipline } : {}),
        maxCandidates: count,
      });
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Topic generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function select(topicId: string) {
    setSelecting(topicId);
    setActionError(null);
    try {
      await apiSend(`/api/phd/topics/${topicId}/select`, 'POST');
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The topic could not be selected.');
    } finally {
      setSelecting(null);
    }
  }

  if (projectLoading) return <Loading label="Preparing your project…" />;
  if (projectError) return <ErrorBox message={projectError} />;

  return (
    <div className="space-y-4">
      <Card
        title="Generate topic candidates"
        description="Candidates are built deterministically from your profile and the catalogue of Business and Engineering areas. Novelty is never claimed from a missing search result."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Discipline focus" hint="Leave as undecided to use your profile.">
            <select className={inputClass} value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
              <option value="UNDECIDED">From my profile</option>
              <option value="BUSINESS">Business</option>
              <option value="ENGINEERING">Engineering</option>
            </select>
          </Field>
          <Field label="Number of candidates" hint="Between 5 and 24.">
            <input
              type="number"
              min={5}
              max={24}
              className={inputClass}
              value={count}
              onChange={(event) => setCount(Math.min(24, Math.max(5, Number(event.target.value) || 8)))}
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={generate} disabled={busy || !projectId}>
              {busy ? 'Generating…' : 'Generate candidates'}
            </Button>
          </div>
        </div>
        {actionError && <p className="mt-3 text-xs text-crm-danger-text">{actionError}</p>}
        <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">
          Each candidate records its provisional gap and an explicit &quot;unverified&quot; novelty status until you find
          literature that supports the claim.
        </p>
      </Card>

      <Card title="Candidates" description="Select one topic to drive the proposal, supervisor matching and timeline.">
        {loading ? (
          <Loading label="Loading candidates…" />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !data || data.topics.length === 0 ? (
          <Empty title="No candidates yet" hint="Generate a first set above — 8 candidates is a good starting point." />
        ) : (
          <ul className="space-y-3">
            {data.topics.map((topic) => (
              <li key={topic.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--alo-text)]">{topic.workingTitle}</h3>
                      {topic.isSelected && <Pill tone="ok">Selected</Pill>}
                      <Pill tone={topic.confidence === 'HIGH' ? 'ok' : topic.confidence === 'MEDIUM' ? 'warn' : 'default'}>
                        confidence {topic.confidence.toLowerCase()}
                      </Pill>
                    </div>
                    <p className="mt-1 text-xs text-[var(--alo-text-muted)]">
                      {topic.researchField}
                      {topic.researchSubfield ? ` · ${topic.researchSubfield}` : ''} · {topic.questionCount} questions ·{' '}
                      {topic.objectiveCount} objectives
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/student/phd/topics?topic=${topic.id}`} className="text-xs font-semibold text-[var(--alo-brand)] underline">
                      Details
                    </Link>
                    {!topic.isSelected && (
                      <Button variant="outline" onClick={() => select(topic.id)} disabled={selecting === topic.id}>
                        {selecting === topic.id ? 'Selecting…' : 'Select'}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--alo-body)]">{topic.mainQuestion}</p>
                {topic.evaluations.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {topic.evaluations.map((evaluation) => (
                      <div key={evaluation.criterion} className="rounded-lg bg-[var(--alo-page)] p-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">
                          {evaluation.criterion}
                        </p>
                        <p className="text-sm font-bold text-[var(--alo-text)]">{evaluation.score}/5</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">
                  Novelty status: {topic.noveltyStatus.replace(/_/g, ' ').toLowerCase()} · evidence: {topic.evidenceQuality.toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
