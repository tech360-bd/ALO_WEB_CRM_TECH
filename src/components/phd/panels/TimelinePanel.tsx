'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, formatDate, inputClass, useApi, useProjectId } from '../ui';

interface Milestone {
  id: string;
  name: string;
  category: string;
  sortOrder: number;
  startDate: string;
  endDate: string;
  status: string;
  isOfficialDeadline: boolean;
  sourceUrl: string | null;
  notes: string;
}

interface TimelineRow {
  id: string;
  name: string;
  mode: string;
  startDate: string;
  totalMonths: number;
  status: string;
  milestones: Milestone[];
}

const MILESTONE_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETE', 'AT_RISK', 'MISSED', 'CANCELLED'];
const MODES = ['FULL_TIME', 'PART_TIME'] as const;

export default function TimelinePanel() {
  const { projectId, error: projectError, loading: projectLoading } = useProjectId();
  const { data, error, loading, reload } = useApi<{ timelines: TimelineRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/timeline` : null,
  );

  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = React.useState<'FULL_TIME' | 'PART_TIME'>('FULL_TIME');
  const [totalMonths, setTotalMonths] = React.useState(36);
  const [methodology, setMethodology] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function build() {
    if (!projectId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/timeline`, 'POST', {
        startDate,
        mode,
        totalMonths,
        ...(methodology ? { methodology } : {}),
      });
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The plan could not be built.');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(milestoneId: string, status: string) {
    setActionError(null);
    try {
      await apiSend(`/api/phd/timeline/${milestoneId}`, 'PATCH', { status });
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The milestone could not be updated.');
    }
  }

  if (projectLoading) return <Loading label="Preparing your project…" />;
  if (projectError) return <ErrorBox message={projectError} />;

  return (
    <div className="space-y-4">
      <Card
        title="Build a study plan"
        description="A suggested structure only. Official university dates are never replaced by this plan — verified deadlines stay in the funding section."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Start date">
            <input type="date" className={inputClass} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="Mode">
            <select className={inputClass} value={mode} onChange={(event) => setMode(event.target.value as 'FULL_TIME' | 'PART_TIME')}>
              {MODES.map((option) => (
                <option key={option} value={option}>
                  {option.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total months" hint="12–96.">
            <input
              type="number"
              min={12}
              max={96}
              className={inputClass}
              value={totalMonths}
              onChange={(event) => setTotalMonths(Math.min(96, Math.max(12, Number(event.target.value) || 36)))}
            />
          </Field>
          <Field label="Methodology" hint="Optional; the plan adapts its phases.">
            <input className={inputClass} value={methodology} onChange={(event) => setMethodology(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button onClick={build} disabled={busy || !projectId}>
              {busy ? 'Building…' : 'Build plan'}
            </Button>
          </div>
        </div>
        {actionError && <p className="mt-3 text-xs text-crm-danger-text">{actionError}</p>}
      </Card>

      {loading ? (
        <Loading label="Loading timelines…" />
      ) : error ? (
        <ErrorBox message={error} />
      ) : !data || data.timelines.length === 0 ? (
        <Empty title="No timeline yet" hint="Build a plan above; you can build a revised version at any time." />
      ) : (
        data.timelines.map((timeline, index) => (
          <Card
            key={timeline.id}
            title={`${timeline.name}${index === 0 ? ' (latest)' : ''}`}
            description={`${timeline.mode.replace('_', ' ').toLowerCase()} · ${timeline.totalMonths} months from ${formatDate(timeline.startDate)}`}
          >
            <ol className="space-y-2">
              {timeline.milestones.map((milestone) => (
                <li key={milestone.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--alo-border)] p-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--alo-text)]">
                      {milestone.name}
                      {milestone.isOfficialDeadline && (
                        <span className="ml-2 align-middle">
                          <Pill tone="info">official deadline</Pill>
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      {formatDate(milestone.startDate)} → {formatDate(milestone.endDate)} · {milestone.category.toLowerCase()}
                    </p>
                    {milestone.notes && <p className="mt-1 max-w-2xl text-[11px] text-[var(--alo-body)]">{milestone.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px]"
                      value={milestone.status}
                      onChange={(event) => setStatus(milestone.id, event.target.value)}
                    >
                      {MILESTONE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ').toLowerCase()}
                        </option>
                      ))}
                    </select>
                    {milestone.sourceUrl && (
                      <a
                        href={milestone.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[11px] font-semibold underline"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ))
      )}
    </div>
  );
}
