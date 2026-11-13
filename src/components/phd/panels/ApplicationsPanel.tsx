'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, formatDate, inputClass, useApi, useProjectId } from '../ui';

interface ApplicationRow {
  id: string;
  status: string;
  fundingStatus: string;
  offerStatus: string;
  nextAction: string;
  nextActionDueAt: string | null;
  submittedAt: string | null;
  interviewAt: string | null;
  closingDate: string | null;
  applicationReference: string;
  verificationStatus: string;
  university: { name: string };
  programme: { id: string; name: string; award: string };
  tasks: Array<{ id: string; title: string; category: string; dueAt: string | null; status: string }>;
  documents: Array<{ id: string; name: string; documentType: string; status: string }>;
  deadlines: Array<{ id: string; title: string; dueDate: string | null; kind: string }>;
  supervisor: { id: string; fullName: string } | null;
  proposal: { id: string; title: string; currentVersion: number } | null;
}

interface CatalogueProgramme {
  id: string;
  name: string;
  award: string;
  university: { name: string };
}

const STATUSES = [
  'RESEARCHING',
  'PREPARING',
  'DOCUMENTS_PENDING',
  'SUBMITTED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'DEFERRED',
];

const KANBAN_COLUMNS = ['RESEARCHING', 'PREPARING', 'SUBMITTED', 'INTERVIEW', 'OFFER'];

export default function ApplicationsPanel() {
  const { projectId } = useProjectId();
  const { data, error, loading, reload } = useApi<{ applications: ApplicationRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/applications` : null,
  );
  const catalogue = useApi<{ programmes: CatalogueProgramme[]; total: number }>(
    '/api/research/programmes?pageSize=48',
  );

  const [view, setView] = React.useState<'list' | 'kanban' | 'calendar'>('list');
  const [programmeId, setProgrammeId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [taskDraft, setTaskDraft] = React.useState<Record<string, { title: string; dueAt: string }>>({});

  async function addApplication() {
    if (!projectId || !programmeId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/applications`, 'POST', { programmeId });
      setProgrammeId('');
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The programme could not be added.');
    } finally {
      setBusy(false);
    }
  }

  async function updateField(applicationId: string, body: Record<string, unknown>) {
    setActionError(null);
    try {
      await apiSend(`/api/phd/applications/${applicationId}`, 'PATCH', body);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The change could not be saved.');
    }
  }

  async function addTask(applicationId: string) {
    const draft = taskDraft[applicationId];
    if (!draft || draft.title.trim().length < 3) return;
    setActionError(null);
    try {
      await apiSend(`/api/phd/applications/${applicationId}/tasks`, 'POST', {
        title: draft.title.trim(),
        dueAt: draft.dueAt || null,
      });
      setTaskDraft((current) => ({ ...current, [applicationId]: { title: '', dueAt: '' } }));
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The task could not be added.');
    }
  }

  const applications = data?.applications ?? [];
  const calendarRows = applications
    .flatMap((application) => [
      ...(application.nextActionDueAt
        ? [{ date: application.nextActionDueAt, label: `${application.university.name} — ${application.nextAction || 'next action'}` }]
        : []),
      ...application.tasks
        .filter((task) => task.dueAt && task.status === 'OPEN')
        .map((task) => ({ date: task.dueAt as string, label: `${application.university.name} — ${task.title}` })),
    ])
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <Card
        title="Add a verified programme"
        description="Only programmes verified against an official university page appear here. Adding one starts a RESEARCHING entry — it is not an application submission."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <Field label="Programme">
              <select className={inputClass} value={programmeId} onChange={(event) => setProgrammeId(event.target.value)}>
                <option value="">
                  {catalogue.loading
                    ? 'Loading verified programmes…'
                    : catalogue.error
                      ? 'Catalogue unavailable'
                      : (catalogue.data?.programmes.length ?? 0) === 0
                        ? 'No verified programmes in the catalogue yet'
                        : 'Select a programme'}
                </option>
                {(catalogue.data?.programmes ?? []).map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.university.name} — {programme.name} ({programme.award})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button onClick={addApplication} disabled={busy || !programmeId || !projectId}>
            Add to my applications
          </Button>
        </div>
        {catalogue.error && <p className="mt-2 text-[11px] text-crm-warning-text">{catalogue.error}</p>}
        {actionError && <p className="mt-2 text-xs text-crm-danger-text">{actionError}</p>}
      </Card>

      <Card
        title="My applications"
        description="Status is what you record. Nothing is submitted, emailed or shared from this platform."
        action={
          <div className="flex gap-1">
            {(['list', 'kanban', 'calendar'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={
                  view === option
                    ? 'rounded-lg bg-[var(--alo-brand)] px-2 py-1 text-[11px] font-semibold text-white'
                    : 'rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px] font-semibold text-[var(--alo-body)]'
                }
              >
                {option}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <Loading label="Loading applications…" />
        ) : error ? (
          <ErrorBox message={error} />
        ) : applications.length === 0 ? (
          <Empty title="No applications yet" hint="Add a verified programme above to start tracking requirements and dates." />
        ) : view === 'kanban' ? (
          <div className="grid gap-3 md:grid-cols-5">
            {KANBAN_COLUMNS.map((column) => (
              <div key={column} className="rounded-xl bg-[var(--alo-page)] p-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">
                  {column.replace(/_/g, ' ').toLowerCase()}
                </p>
                <ul className="space-y-2">
                  {applications
                    .filter((application) => application.status === column)
                    .map((application) => (
                      <li key={application.id} className="rounded-lg bg-white p-2 text-[11px]">
                        <p className="font-semibold text-[var(--alo-text)]">{application.university.name}</p>
                        <p className="text-[var(--alo-text-muted)]">{application.programme.name}</p>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : view === 'calendar' ? (
          calendarRows.length === 0 ? (
            <Empty title="Nothing scheduled" hint="Add a next action or a task with a date and it will appear here." />
          ) : (
            <ul className="divide-y divide-[var(--alo-border)]/60 text-xs">
              {calendarRows.map((row, index) => (
                <li key={index} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-medium text-[var(--alo-text)]">{formatDate(row.date)}</span>
                  <span className="text-[var(--alo-body)]">{row.label}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="space-y-3">
            {applications.map((application) => (
              <li key={application.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--alo-text)]">
                      {application.university.name} — {application.programme.name}
                    </p>
                    <p className="text-xs text-[var(--alo-text-muted)]">
                      {application.programme.award} · added as {application.status.replace(/_/g, ' ').toLowerCase()} ·{' '}
                      verification {application.verificationStatus.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={application.offerStatus === 'UNCONDITIONAL' ? 'ok' : application.offerStatus === 'REJECTED' ? 'bad' : 'default'}>
                      offer {application.offerStatus.replace(/_/g, ' ').toLowerCase()}
                    </Pill>
                    <select
                      className="rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px]"
                      value={application.status}
                      onChange={(event) => updateField(application.id, { status: event.target.value })}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ').toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-[11px] text-[var(--alo-body)] sm:grid-cols-3">
                  <p>Submitted: {formatDate(application.submittedAt)}</p>
                  <p>Interview: {formatDate(application.interviewAt)}</p>
                  <p>Reference: {application.applicationReference || '—'}</p>
                  <p>Funding: {application.fundingStatus.replace(/_/g, ' ').toLowerCase()}</p>
                  <p>
                    Supervisor:{' '}
                    {application.supervisor ? application.supervisor.fullName : 'not linked yet'}
                  </p>
                  <p>
                    Proposal:{' '}
                    {application.proposal ? `${application.proposal.title} (v${application.proposal.currentVersion})` : 'not linked yet'}
                  </p>
                </div>

                {application.tasks.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Tasks</p>
                    <ul className="mt-1 space-y-1 text-[11px]">
                      {application.tasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-2">
                          <span className="text-[var(--alo-body)]">
                            {task.status === 'DONE' ? '✓ ' : ''}
                            {task.title} · {task.category.toLowerCase()} · {formatDate(task.dueAt)}
                          </span>
                          {task.status !== 'DONE' && (
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-[var(--alo-brand)] underline"
                              onClick={() => apiSend(`/api/phd/tasks/${task.id}`, 'PATCH', { status: 'DONE' }).then(reload).catch((cause: unknown) => setActionError(cause instanceof Error ? cause.message : 'Update failed.'))}
                            >
                              Mark done
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <input
                    className={`${inputClass} max-w-xs`}
                    placeholder="New task"
                    value={taskDraft[application.id]?.title ?? ''}
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        [application.id]: { title: event.target.value, dueAt: current[application.id]?.dueAt ?? '' },
                      }))
                    }
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-[var(--alo-border)] px-2 py-2 text-xs"
                    value={taskDraft[application.id]?.dueAt ?? ''}
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        [application.id]: { title: current[application.id]?.title ?? '', dueAt: event.target.value },
                      }))
                    }
                  />
                  <Button variant="outline" onClick={() => addTask(application.id)}>
                    Add task
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
