'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Loading, Pill, apiSend, inputClass, useApi, useProjectId } from '../ui';

interface SupervisorRow {
  id: string;
  fullName: string;
  roleTitle: string;
  department: string;
  profileUrl: string;
  availabilityStatus: string;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  university: { name: string };
}

interface MatchRow {
  id: string;
  supervisorId: string;
  supervisorName: string;
  universityName: string;
  profileUrl: string;
  verificationStatus: string;
  fitScore: number;
  fitLabel: string;
  rationale: string;
  mismatches: string[];
  missingEvidence: string[];
  availabilityAtMatch: string;
}

interface ContactRow {
  id: string;
  supervisorId: string;
  supervisorName: string;
  universityName: string;
  subject: string;
  body: string;
  status: string;
  nextFollowUpAt: string | null;
  updatedAt: string;
}

const OUTREACH_STATUSES = [
  'DRAFTED',
  'REVIEWED',
  'SENT',
  'REPLIED',
  'FOLLOW_UP_DUE',
  'INTERESTED',
  'UNAVAILABLE',
  'CLOSED',
];

export default function SupervisorsPanel() {
  const { projectId } = useProjectId();
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const directory = useApi<{ supervisors: SupervisorRow[]; total: number }>(
    `/api/phd/supervisors?pageSize=25${query ? `&search=${encodeURIComponent(query)}` : ''}`,
  );
  const matches = useApi<{ matches: MatchRow[]; note: string }>(
    projectId ? `/api/phd/projects/${projectId}/supervisors/match` : null,
  );
  const outreach = useApi<{ contacts: ContactRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/supervisors/outreach` : null,
  );

  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [openDraft, setOpenDraft] = React.useState<string | null>(null);

  async function runMatching() {
    if (!projectId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/supervisors/match`, 'POST', {});
      await matches.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Matching failed.');
    } finally {
      setBusy(false);
    }
  }

  async function draftFor(supervisorId: string) {
    if (!projectId) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/supervisors/outreach`, 'POST', { supervisorId });
      await outreach.reload();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'The draft could not be created. Select a topic before drafting an email.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(contactId: string, status: string) {
    if (!projectId) return;
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/supervisors/outreach`, 'PATCH', { contactId, status });
      await outreach.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The status could not be saved.');
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Supervisor fit"
        description="Scored only from recorded evidence: research interests, methods and verified publications. A score is not an offer to supervise."
        action={
          <Button onClick={runMatching} disabled={busy || !projectId}>
            {busy ? 'Working…' : 'Re-run matching'}
          </Button>
        }
      >
        {matches.loading ? (
          <Loading label="Loading matches…" />
        ) : matches.error ? (
          <ErrorBox message={matches.error} />
        ) : !matches.data || matches.data.matches.length === 0 ? (
          <Empty
            title="No matches yet"
            hint="Select a topic, then run matching. Supervisors are only considered when their profile has been verified."
          />
        ) : (
          <ul className="space-y-3">
            {matches.data.matches.slice(0, 10).map((match) => (
              <li key={match.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--alo-text)]">{match.supervisorName}</p>
                    <p className="text-xs text-[var(--alo-text-muted)]">{match.universityName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={match.fitScore >= 70 ? 'ok' : match.fitScore >= 45 ? 'warn' : 'default'}>
                      fit {match.fitScore}/100 · {match.fitLabel.toLowerCase()}
                    </Pill>
                    {match.profileUrl && (
                      <a
                        href={match.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-xs font-semibold underline"
                      >
                        Official profile
                      </a>
                    )}
                    <Button variant="outline" onClick={() => draftFor(match.supervisorId)} disabled={busy}>
                      Draft email
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--alo-body)]">{match.rationale}</p>
                {match.mismatches.length > 0 && (
                  <p className="mt-1 text-[11px] text-crm-warning-text">Mismatches: {match.mismatches.join('; ')}</p>
                )}
                {match.missingEvidence.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                    Missing evidence: {match.missingEvidence.join('; ')}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                  Availability at match: {match.availabilityAtMatch.replace(/_/g, ' ').toLowerCase()} · profile status{' '}
                  {match.verificationStatus.replace(/_/g, ' ').toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        )}
        {matches.data?.note && <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">{matches.data.note}</p>}
        {actionError && <p className="mt-3 text-xs text-crm-danger-text">{actionError}</p>}
      </Card>

      <Card
        title="Outreach drafts"
        description="Nothing is sent from this platform. Review the draft, then send it from your own mailbox and record what happened."
      >
        {outreach.loading ? (
          <Loading label="Loading outreach…" />
        ) : outreach.error ? (
          <ErrorBox message={outreach.error} />
        ) : !outreach.data || outreach.data.contacts.length === 0 ? (
          <Empty title="No outreach yet" hint="Draft an email from a match above, then record when you sent it." />
        ) : (
          <ul className="space-y-3">
            {outreach.data.contacts.map((contact) => (
              <li key={contact.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--alo-text)]">
                    {contact.supervisorName} ·{' '}
                    <span className="font-normal text-[var(--alo-text-muted)]">{contact.universityName}</span>
                  </p>
                  <select
                    className="rounded-lg border border-[var(--alo-border)] px-2 py-1 text-xs"
                    value={contact.status}
                    onChange={(event) => setStatus(contact.id, event.target.value)}
                  >
                    {OUTREACH_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ').toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs font-medium text-[var(--alo-body)]">{contact.subject}</p>
                <button
                  type="button"
                  onClick={() => setOpenDraft(openDraft === contact.id ? null : contact.id)}
                  className="mt-2 text-[11px] font-semibold text-[var(--alo-brand)] underline"
                >
                  {openDraft === contact.id ? 'Hide draft' : 'Show draft'}
                </button>
                {openDraft === contact.id && (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--alo-page)] p-3 text-[11px] text-[var(--alo-body)]">
                    {contact.body}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Supervisor directory"
        description="Every record shows its verification status; an unverified profile is not evidence of availability."
      >
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} max-w-sm`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, interest or department"
          />
          <Button variant="outline" onClick={() => setQuery(search.trim())}>
            Search
          </Button>
        </div>
        {directory.loading ? (
          <Loading label="Loading directory…" />
        ) : directory.error ? (
          <ErrorBox message={directory.error} />
        ) : !directory.data || directory.data.supervisors.length === 0 ? (
          <div className="mt-3">
            <Empty
              title="No supervisor records match"
              hint="The directory holds verified official pages only. An empty result is not evidence that nobody works in this area."
            />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--alo-border)]/60 text-xs">
            {directory.data.supervisors.map((supervisor) => (
              <li key={supervisor.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-semibold text-[var(--alo-text)]">{supervisor.fullName}</p>
                  <p className="text-[var(--alo-text-muted)]">
                    {supervisor.roleTitle || 'Role not recorded'} · {supervisor.university.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={supervisor.verificationStatus === 'VERIFIED_OFFICIAL' ? 'ok' : 'warn'}>
                    {supervisor.verificationStatus.replace(/_/g, ' ').toLowerCase()}
                  </Pill>
                  <Pill tone={supervisor.availabilityStatus === 'ACCEPTING_STUDENTS' ? 'ok' : 'default'}>
                    {supervisor.availabilityStatus.replace(/_/g, ' ').toLowerCase()}
                  </Pill>
                  <a href={supervisor.profileUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                    Official profile
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">
          &quot;Accepting students&quot; appears only when a current official source says so. A published profile never
          implies availability.
        </p>
      </Card>
    </div>
  );
}
