'use client';

import * as React from 'react';
import { Button, Card, DataTable, Empty, ErrorBox, Field, Loading, Pill, apiSend, formatDate, inputClass, useApi, verificationTone } from '../ui';

interface EvidenceRow {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  claim: string;
  sourceUrl: string | null;
  sourceAuthority: string;
  excerpt: string;
  retrievedAt: string;
  verificationStatus: string;
  nextVerificationAt: string | null;
  university: { name: string } | null;
}

interface EvidenceResponse {
  evidence: EvidenceRow[];
  total: number;
  openCount: number;
  page: number;
  pageSize: number;
}

const VERIFICATION_STATUSES = [
  'VERIFIED_OFFICIAL',
  'VERIFIED_MAY_BE_OUTDATED',
  'SECONDARY_SOURCE_ONLY',
  'NOT_YET_VERIFIED',
  'SOURCE_UNAVAILABLE',
  'PROGRAMME_NOT_FOUND',
  'CONFIRMED_UNAVAILABLE',
];

const ENTITY_TYPES = ['UNIVERSITY', 'PROGRAMME', 'SUPERVISOR', 'FUNDING', 'FEE', 'DEADLINE', 'COMMISSION', 'LITERATURE'];
const AUTHORITIES = [
  'OFFICIAL_PRIMARY',
  'OFFICIAL_SECONDARY',
  'PEER_REVIEWED',
  'SCHOLARLY_INDEX',
  'INDUSTRY',
  'GOVERNMENT',
  'SECONDARY',
  'UNKNOWN',
];

export default function VerificationPanel() {
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const queue = useApi<EvidenceResponse>(
    `/api/phd/sources?page=${page}&pageSize=25${statusFilter ? `&status=${statusFilter}` : ''}`,
  );

  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [reviewing, setReviewing] = React.useState<string | null>(null);
  const [review, setReview] = React.useState({ verificationStatus: 'VERIFIED_OFFICIAL', notes: '', conflictNotes: '' });

  const [newEvidence, setNewEvidence] = React.useState({
    entityType: 'PROGRAMME',
    entityId: '',
    fieldName: '',
    claim: '',
    sourceUrl: '',
    sourceAuthority: 'OFFICIAL_PRIMARY',
    excerpt: '',
    verificationStatus: 'NOT_YET_VERIFIED',
  });

  async function submitReview(evidenceId: string) {
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/sources/${evidenceId}`, 'PATCH', {
        verificationStatus: review.verificationStatus,
        notes: review.notes || undefined,
        conflictNotes: review.conflictNotes || undefined,
      });
      setReviewing(null);
      setReview({ verificationStatus: 'VERIFIED_OFFICIAL', notes: '', conflictNotes: '' });
      await queue.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The review could not be recorded.');
    } finally {
      setBusy(false);
    }
  }

  async function recordEvidence() {
    setBusy(true);
    setActionError(null);
    try {
      await apiSend('/api/phd/sources', 'POST', {
        entityType: newEvidence.entityType,
        entityId: newEvidence.entityId.trim(),
        fieldName: newEvidence.fieldName || undefined,
        claim: newEvidence.claim.trim(),
        sourceUrl: newEvidence.sourceUrl.trim() || null,
        sourceAuthority: newEvidence.sourceAuthority,
        excerpt: newEvidence.excerpt || undefined,
        verificationStatus: newEvidence.verificationStatus,
      });
      setNewEvidence({
        entityType: 'PROGRAMME',
        entityId: '',
        fieldName: '',
        claim: '',
        sourceUrl: '',
        sourceAuthority: 'OFFICIAL_PRIMARY',
        excerpt: '',
        verificationStatus: 'NOT_YET_VERIFIED',
      });
      await queue.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The evidence could not be recorded.');
    } finally {
      setBusy(false);
    }
  }

  const forbidden = queue.error?.toLowerCase().includes('verifier');

  return (
    <div className="space-y-4">
      <Card
        title="Source Verification Centre"
        description="Every institutional claim carries the exact URL, an excerpt and a status. A homepage being reachable never counts as verification."
      >
        {queue.loading ? (
          <Loading label="Loading the verification queue…" />
        ) : forbidden ? (
          <Empty
            title="Verifier access required"
            hint="Only a data verifier or administrator can open the verification queue. Ask an administrator for the verifier role if this is part of your work."
          />
        ) : queue.error ? (
          <ErrorBox message={queue.error} />
        ) : !queue.data || queue.data.evidence.length === 0 ? (
          <Empty
            title="Nothing in this queue"
            hint="No evidence rows match the selected status. A missing record is not evidence that a claim is false."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-[var(--alo-border)] px-2 py-1 text-xs"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {VERIFICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toLowerCase()}
                  </option>
                ))}
              </select>
              <Pill tone="warn">{queue.data.openCount} open</Pill>
              <Pill tone="info">{queue.data.total} in scope</Pill>
            </div>

            <DataTable
              head={['Claim', 'Entity', 'Source', 'Status', 'Actions']}
              rows={queue.data.evidence.map((evidence) => [
                <div key={`${evidence.id}-claim`} className="max-w-sm">
                  <p className="font-semibold text-[var(--alo-text)]">{evidence.claim}</p>
                  <p className="text-[11px] text-[var(--alo-text-muted)]">
                    {evidence.fieldName || 'record'} · retrieved {formatDate(evidence.retrievedAt)}
                    {evidence.university ? ` · ${evidence.university.name}` : ''}
                  </p>
                  {evidence.excerpt && (
                    <p className="mt-1 line-clamp-3 text-[11px] text-[var(--alo-body)]">“{evidence.excerpt}”</p>
                  )}
                  {reviewing === evidence.id && (
                    <div className="mt-2 space-y-2 rounded-lg bg-[var(--alo-page)] p-2">
                      <select
                        className="w-full rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px]"
                        value={review.verificationStatus}
                        onChange={(event) => setReview({ ...review, verificationStatus: event.target.value })}
                      >
                        {VERIFICATION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ').toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <input
                        className="w-full rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px]"
                        placeholder="Reviewer note"
                        value={review.notes}
                        onChange={(event) => setReview({ ...review, notes: event.target.value })}
                      />
                      <input
                        className="w-full rounded-lg border border-[var(--alo-border)] px-2 py-1 text-[11px]"
                        placeholder="Conflict notes (optional)"
                        value={review.conflictNotes}
                        onChange={(event) => setReview({ ...review, conflictNotes: event.target.value })}
                      />
                      <Button onClick={() => submitReview(evidence.id)} disabled={busy}>
                        Record decision
                      </Button>
                    </div>
                  )}
                </div>,
                <span key={`${evidence.id}-entity`} className="text-[11px]">
                  {evidence.entityType.toLowerCase()}
                  <br />
                  <span className="text-[var(--alo-text-muted)]">{evidence.entityId}</span>
                </span>,
                evidence.sourceUrl ? (
                  <a
                    key={`${evidence.id}-source`}
                    href={evidence.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-all text-[11px] underline"
                  >
                    {evidence.sourceAuthority.replace(/_/g, ' ').toLowerCase()}
                  </a>
                ) : (
                  <span key={`${evidence.id}-nosource`} className="text-[11px] text-amber-700">
                    no source recorded
                  </span>
                ),
                <Pill key={`${evidence.id}-status`} tone={verificationTone(evidence.verificationStatus)}>
                  {evidence.verificationStatus.replace(/_/g, ' ').toLowerCase()}
                </Pill>,
                <Button
                  key={`${evidence.id}-action`}
                  variant="outline"
                  onClick={() => setReviewing(reviewing === evidence.id ? null : evidence.id)}
                >
                  {reviewing === evidence.id ? 'Cancel' : 'Review'}
                </Button>,
              ])}
            />

            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-[11px] text-[var(--alo-text-muted)]">
                Page {queue.data.page} · {queue.data.pageSize} per page
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={queue.data.page * queue.data.pageSize >= queue.data.total}
              >
                Next
              </Button>
            </div>
          </>
        )}
        {actionError && <p className="mt-3 text-xs text-red-700">{actionError}</p>}
      </Card>

      <Card
        title="Record new evidence"
        description="Attach a claim to the exact official URL and excerpt it came from. Evidence is append-only; corrections are new events."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Entity type">
            <select
              className={inputClass}
              value={newEvidence.entityType}
              onChange={(event) => setNewEvidence({ ...newEvidence, entityType: event.target.value })}
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Entity ID" hint="The record id this claim belongs to.">
            <input
              className={inputClass}
              value={newEvidence.entityId}
              onChange={(event) => setNewEvidence({ ...newEvidence, entityId: event.target.value })}
            />
          </Field>
          <Field label="Field name" hint="Optional: e.g. closingDate, internationalFee.">
            <input
              className={inputClass}
              value={newEvidence.fieldName}
              onChange={(event) => setNewEvidence({ ...newEvidence, fieldName: event.target.value })}
            />
          </Field>
          <Field label="Source authority">
            <select
              className={inputClass}
              value={newEvidence.sourceAuthority}
              onChange={(event) => setNewEvidence({ ...newEvidence, sourceAuthority: event.target.value })}
            >
              {AUTHORITIES.map((authority) => (
                <option key={authority} value={authority}>
                  {authority.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Official URL">
            <input
              className={inputClass}
              value={newEvidence.sourceUrl}
              onChange={(event) => setNewEvidence({ ...newEvidence, sourceUrl: event.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Initial status">
            <select
              className={inputClass}
              value={newEvidence.verificationStatus}
              onChange={(event) => setNewEvidence({ ...newEvidence, verificationStatus: event.target.value })}
            >
              {VERIFICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Field label="Claim">
            <textarea
              className={inputClass}
              rows={3}
              value={newEvidence.claim}
              onChange={(event) => setNewEvidence({ ...newEvidence, claim: event.target.value })}
            />
          </Field>
          <Field label="Exact excerpt from the source">
            <textarea
              className={inputClass}
              rows={3}
              value={newEvidence.excerpt}
              onChange={(event) => setNewEvidence({ ...newEvidence, excerpt: event.target.value })}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Button
            onClick={recordEvidence}
            disabled={
              busy ||
              newEvidence.entityId.trim().length === 0 ||
              newEvidence.claim.trim().length < 5
            }
          >
            {busy ? 'Recording…' : 'Record evidence'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
