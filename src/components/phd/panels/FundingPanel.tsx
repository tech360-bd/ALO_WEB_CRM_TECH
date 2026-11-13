'use client';

import * as React from 'react';
import { Button, Card, Empty, ErrorBox, Field, Loading, Pill, apiSend, formatDate, formatMoney, inputClass, useApi, useProjectId } from '../ui';

interface FundingRow {
  id: string;
  name: string;
  department: string;
  fundingType: string;
  tuitionCoverage: string;
  stipendAmountMinor: number | null;
  currency: string;
  closingDate: string | null;
  verificationStatus: string;
  officialUrl: string;
  university: { name: string } | null;
  assessment: {
    canBeDescribedAsFullyFunded: boolean;
    fundingType: string;
    deadlineStatus: string;
    isExpired: boolean;
    isOpen: boolean;
    eligibilityVerified: boolean;
    internationalEligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION';
    stipendDisplay: string;
    warnings: string[];
    missingEvidence: string[];
  };
}

interface DeadlineRow {
  id: string;
  title: string;
  kind: string;
  dueDate: string | null;
  timezone: string;
  verificationStatus: string;
  sourceUrl: string | null;
  university: { name: string } | null;
  programme: { name: string } | null;
  assessment: { status: string; label: string; isExpired: boolean; isOpen: boolean; needsVerification: boolean; note: string; daysRemaining: number | null };
}

const KIND_OPTIONS = ['APPLICATION', 'FUNDING', 'DOCUMENT', 'INTERVIEW', 'PERSONAL'];

export default function FundingPanel() {
  const { projectId } = useProjectId();
  const [includeExpired, setIncludeExpired] = React.useState(false);
  const funding = useApi<{ opportunities: FundingRow[] }>(
    `/api/phd/funding${includeExpired ? '?includeExpired=true' : ''}`,
  );
  const deadlines = useApi<{ deadlines: DeadlineRow[] }>(
    projectId ? `/api/phd/projects/${projectId}/deadlines` : null,
  );
  const fees = useApi<{
    fees: Array<{
      id: string;
      academicYear: string;
      studentStatus: string;
      feeBasis: string;
      amountMinor: number;
      currency: string;
      verificationStatus: string;
      university: { name: string };
      programme: { name: string } | null;
    }>;
  }>('/api/phd/fees');

  const [draft, setDraft] = React.useState({ title: '', kind: 'APPLICATION', dueDate: '', sourceUrl: '', notes: '' });
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function addDeadline() {
    if (!projectId || draft.title.trim().length < 3) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiSend(`/api/phd/projects/${projectId}/deadlines`, 'POST', {
        title: draft.title.trim(),
        kind: draft.kind,
        dueDate: draft.dueDate || null,
        sourceUrl: draft.sourceUrl || null,
        notes: draft.notes || '',
      });
      setDraft({ title: '', kind: 'APPLICATION', dueDate: '', sourceUrl: '', notes: '' });
      await deadlines.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The deadline could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Funding opportunities"
        description="Recorded from official pages only. Nothing is described as fully funded unless the official terms support it."
        action={
          <label className="flex items-center gap-2 text-[11px] text-[var(--alo-body)]">
            <input type="checkbox" checked={includeExpired} onChange={(event) => setIncludeExpired(event.target.checked)} />
            Include closed calls
          </label>
        }
      >
        {funding.loading ? (
          <Loading label="Loading funding…" />
        ) : funding.error ? (
          <ErrorBox message={funding.error} />
        ) : !funding.data || funding.data.opportunities.length === 0 ? (
          <Empty
            title="No funding opportunities recorded"
            hint="This is not evidence that no funding exists. Funding is added once an official call has been verified."
          />
        ) : (
          <ul className="space-y-3">
            {funding.data.opportunities.map((opportunity) => (
              <li key={opportunity.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--alo-text)]">{opportunity.name}</p>
                    <p className="text-xs text-[var(--alo-text-muted)]">
                      {opportunity.university?.name ?? 'University not linked'} · {opportunity.fundingType.replace(/_/g, ' ').toLowerCase()}
                      {opportunity.department ? ` · ${opportunity.department}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={opportunity.assessment.isExpired ? 'bad' : opportunity.assessment.isOpen ? 'ok' : 'warn'}>
                      {opportunity.assessment.deadlineStatus.replace(/_/g, ' ').toLowerCase()}
                    </Pill>
                    {opportunity.assessment.canBeDescribedAsFullyFunded ? (
                      <Pill tone="ok">full funding per official terms</Pill>
                    ) : (
                      <Pill tone="warn">funding scope unverified</Pill>
                    )}
                    <Pill tone={opportunity.assessment.internationalEligibility === 'ELIGIBLE' ? 'ok' : opportunity.assessment.internationalEligibility === 'NOT_ELIGIBLE' ? 'bad' : 'warn'}>
                      international: {opportunity.assessment.internationalEligibility.replace(/_/g, ' ').toLowerCase()}
                    </Pill>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-[var(--alo-body)] sm:grid-cols-3">
                  <p>Closing: {formatDate(opportunity.closingDate)}</p>
                  <p>Stipend: {opportunity.assessment.stipendDisplay}</p>
                  <p>Tuition: {opportunity.tuitionCoverage || 'Not recorded'}</p>
                </div>
                {[...opportunity.assessment.warnings, ...opportunity.assessment.missingEvidence].length > 0 && (
                  <ul className="mt-2 space-y-1 text-[11px] text-[var(--alo-text-muted)]">
                    {[...opportunity.assessment.warnings, ...opportunity.assessment.missingEvidence].map((note, index) => (
                      <li key={index}>• {note}</li>
                    ))}
                  </ul>
                )}
                <a
                  href={opportunity.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-2 inline-block text-[11px] font-semibold text-[var(--alo-brand)] underline"
                >
                  Official funding page
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Deadlines" description="Every date carries its verification state. A date without an official source is marked as needing verification.">
        {deadlines.loading ? (
          <Loading label="Loading deadlines…" />
        ) : deadlines.error ? (
          <ErrorBox message={deadlines.error} />
        ) : !deadlines.data || deadlines.data.deadlines.length === 0 ? (
          <Empty title="No deadlines recorded" hint="Add your own above, or add a verified programme so its official dates appear." />
        ) : (
          <ul className="divide-y divide-[var(--alo-border)]/60 text-xs">
            {deadlines.data.deadlines.map((deadline) => (
              <li key={deadline.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold text-[var(--alo-text)]">{deadline.title}</span>
                  <span className="ml-2 text-[var(--alo-text-muted)]">
                    {deadline.kind.toLowerCase()}
                    {deadline.university ? ` · ${deadline.university.name}` : ''}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <span>{formatDate(deadline.dueDate)}</span>
                  <Pill
                    tone={
                      deadline.assessment.isExpired
                        ? 'bad'
                        : deadline.assessment.needsVerification
                          ? 'warn'
                          : deadline.assessment.isOpen
                            ? 'ok'
                            : 'default'
                    }
                  >
                    {deadline.assessment.label}
                  </Pill>
                  {deadline.sourceUrl && (
                    <a href={deadline.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                      Source
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Fees" description="Home and international fees are never merged. A missing figure stays blank rather than being estimated.">
        {fees.loading ? (
          <Loading label="Loading fee records…" />
        ) : fees.error ? (
          <ErrorBox message={fees.error} />
        ) : !fees.data || fees.data.fees.length === 0 ? (
          <Empty title="No verified fee records" hint="Fees are published only after an official fee page has been recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[var(--alo-border)] text-[11px] uppercase tracking-wide text-[var(--alo-text-muted)]">
                  <th className="py-2 pr-4">University</th>
                  <th className="py-2 pr-4">Programme</th>
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Student status</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Fee basis</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.data.fees.slice(0, 40).map((fee) => (
                  <tr key={fee.id} className="border-b border-[var(--alo-border)]/60">
                    <td className="py-2 pr-4">{fee.university.name}</td>
                    <td className="py-2 pr-4">{fee.programme?.name ?? 'General'}</td>
                    <td className="py-2 pr-4">{fee.academicYear}</td>
                    <td className="py-2 pr-4">{fee.studentStatus.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="py-2 pr-4">{formatMoney(fee.amountMinor, fee.currency)}</td>
                    <td className="py-2 pr-4">{fee.feeBasis.replace(/_/g, ' ').toLowerCase()}</td>
                    <td className="py-2 pr-4">
                      <Pill tone={fee.verificationStatus === 'VERIFIED_OFFICIAL' ? 'ok' : 'warn'}>
                        {fee.verificationStatus.replace(/_/g, ' ').toLowerCase()}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Add your own deadline" description="Personal dates are private to your account and are never presented as official university dates.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Title">
            <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </Field>
          <Field label="Kind">
            <select className={inputClass} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
              {KIND_OPTIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputClass} value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />
          </Field>
          <Field label="Official source" hint="Optional. A date without a source stays marked unverified.">
            <input className={inputClass} value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="https://" />
          </Field>
        </div>
        <div className="mt-3">
          <Button onClick={addDeadline} disabled={busy || draft.title.trim().length < 3}>
            {busy ? 'Saving…' : 'Add deadline'}
          </Button>
          {actionError && <p className="mt-2 text-xs text-crm-danger-text">{actionError}</p>}
        </div>
      </Card>
    </div>
  );
}
