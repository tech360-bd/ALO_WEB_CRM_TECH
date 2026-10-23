'use client';

/**
 * CAS / I-20 / CoE status — /student/cas
 *
 * Reads GET /api/student/cas, which returns the confirmation documents attached
 * to the student's own applications. When nothing has been issued the page says
 * so rather than showing a sample reference number.
 */

import Link from 'next/link';
import { Download, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';

interface CasRecord {
  id: string;
  documentType: string;
  status: string;
  requestedDate: string | null;
  receivedDate: string | null;
  referenceNumber: string;
  fileUrl: string;
  conditionNote: string;
  nextStep: string;
  visaHandoverStatus: string;
  updatedAt: string;
}

interface CasEntry {
  applicationId: string;
  applicationCode: string;
  universityName: string;
  courseName: string;
  record: CasRecord;
}

interface CasResponse {
  success: boolean;
  records: CasEntry[];
  total: number;
}

const DOC_LABELS: Record<string, string> = {
  CAS: 'Confirmation of Acceptance for Studies (CAS)',
  I20: 'Form I-20',
  COE: 'Confirmation of Enrolment (CoE)',
  LOA: 'Letter of Acceptance',
  PAL: 'Provincial Attestation Letter (PAL)',
  OFFER_VISA_LETTER: 'Offer / visa letter',
};

export default function StudentCas() {
  const { data, state, error, reload } = useStudentResource<CasResponse>('/api/student/cas');

  const records = data?.records ?? [];

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Confirmation Documents"
          description="Your CAS, I-20, CoE or offer letter — the document you need before you can apply for a visa."
        />

        {state === 'loading' && <PortalLoading label="Checking your confirmation documents…" />}

        {state === 'error' && <PortalError message={error ?? 'Your confirmation documents could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && records.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="No confirmation document has been issued yet"
              description="This is issued by the university after you accept your offer and, where required, pay a deposit. It appears here as soon as we receive it."
              action={
                <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                  <Link href="/student/applications">View My Applications</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && records.length > 0 && (
          <div className="space-y-4">
            {records.map((entry) => (
              <PortalCard
                key={entry.record.id}
                title={DOC_LABELS[entry.record.documentType] ?? entry.record.documentType}
                description={`${entry.universityName}${entry.courseName ? ` · ${entry.courseName}` : ''}${entry.applicationCode ? ` · ${entry.applicationCode}` : ''}`}
              >
                <div className="divide-y divide-[var(--alo-border)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="h-4 w-4 text-alo-brand" aria-hidden="true" />
                      <span className="text-[13px] font-semibold text-[var(--alo-text)]">Document status</span>
                    </div>
                    <StatusBadge value={entry.record.status} />
                  </div>

                  {entry.record.referenceNumber && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <span className="text-[13px] text-[var(--alo-body)]">Reference number</span>
                      <code className="rounded-button border border-[var(--alo-border)] bg-[var(--alo-page)] px-3 py-1 font-mono text-[13px] font-semibold text-[var(--alo-text)]">
                        {entry.record.referenceNumber}
                      </code>
                    </div>
                  )}

                  {(entry.record.requestedDate || entry.record.receivedDate) && (
                    <div className="grid gap-3 px-5 py-3 sm:grid-cols-2">
                      {entry.record.requestedDate && (
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Requested</p>
                          <p className="mt-0.5 text-[13px] text-[var(--alo-text)]">
                            {new Date(entry.record.requestedDate).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      )}
                      {entry.record.receivedDate && (
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Received</p>
                          <p className="mt-0.5 text-[13px] text-[var(--alo-text)]">
                            {new Date(entry.record.receivedDate).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.record.conditionNote && (
                    <div className="border-t border-amber-200 bg-amber-50 px-5 py-3">
                      <p className="text-[12px] font-semibold text-amber-800">Conditions on this document</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-amber-900">{entry.record.conditionNote}</p>
                    </div>
                  )}

                  {entry.record.nextStep && (
                    <div className="px-5 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Next step</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{entry.record.nextStep}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <span className="text-[13px] text-[var(--alo-body)]">Visa handover</span>
                    <StatusBadge value={entry.record.visaHandoverStatus} />
                  </div>
                </div>

                {entry.record.fileUrl && (
                  <div className="border-t border-[var(--alo-border)] px-5 py-3">
                    <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                      <a href={entry.record.fileUrl}>
                        <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Download Document
                      </a>
                    </Button>
                  </div>
                )}
              </PortalCard>
            ))}

            <p className="text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
              Reference numbers and conditions are exactly as issued by your university. Check them against the
              original document before you use them in a visa application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
