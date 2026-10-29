'use client';

/**
 * Document detail — /student/documents/[id]
 *
 * Reads GET /api/student/documents/[id]. The file itself is streamed by the
 * separate download route, which re-verifies the stored hash before responding;
 * this page only links to it.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Clock3, Download, FileWarning, History, ShieldCheck, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface DocumentDetail {
  id: string;
  category: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  status: string;
  version: number;
  previousVersionId: string;
  reviewedBy: string;
  reviewedAt: string | null;
  reviewerNote: string;
  rejectionReason: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
  uploadedAt: string;
}

interface AuditEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  newStatus: string;
  note: string;
  createdAt: string;
}

interface DocumentResponse {
  success: boolean;
  data: DocumentDetail;
  audit: AuditEntry[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Size not recorded';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

const STATUS_ICON = {
  approved: CheckCircle2,
  verified: CheckCircle2,
  rejected: XCircle,
  needs_resubmission: XCircle,
  pending: Clock3,
  under_review: Clock3,
} as const;

export default function StudentDocumentDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const { data, state, error, reload } = useStudentResource<DocumentResponse>(
    id ? `/api/student/documents/${id}` : '',
  );

  const document = data?.data ?? null;
  const audit = data?.audit ?? [];
  const Icon = document ? STATUS_ICON[document.status as keyof typeof STATUS_ICON] ?? FileWarning : FileWarning;

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/student/documents"
          className="mb-4 inline-block text-[13px] font-semibold text-[var(--alo-text-muted)] hover:text-alo-brand hover:underline"
        >
          ← All documents
        </Link>

        {state === 'idle' && <PortalLoading label="Loading your document…" />}
        {state === 'loading' && <PortalLoading label="Loading your document…" />}

        {state === 'error' && <PortalError message={error ?? 'This document could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && !document && (
          <PortalCard>
            <PortalEmpty
              title="Document not found"
              description="This document may have been removed, or it belongs to another account."
              action={
                <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                  <Link href="/student/documents">Back to Documents</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && document && (
          <>
            <PortalPageHeader
              title={document.fileName || document.category}
              description={`${document.category} · version ${document.version}`}
              action={<StatusBadge value={document.status} />}
            />

            <PortalCard>
              <div className="flex flex-wrap items-start gap-4 px-5 py-5">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-button',
                    document.status === 'approved' || document.status === 'verified'
                      ? 'bg-emerald-50 text-emerald-600'
                      : document.status === 'rejected' || document.status === 'needs_resubmission'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600',
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-[15px] font-bold text-[var(--alo-text)]">
                    {document.fileName || 'Untitled document'}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--alo-body)]">{document.category}</p>
                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[12px] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-[var(--alo-text-muted)]">Size:</dt>
                      <dd className="text-[var(--alo-text)]">{formatBytes(document.fileSize)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[var(--alo-text-muted)]">Type:</dt>
                      <dd className="text-[var(--alo-text)]">{document.mimeType ?? 'Not recorded'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[var(--alo-text-muted)]">Uploaded:</dt>
                      <dd className="text-[var(--alo-text)]">
                        {new Date(document.uploadedAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </dd>
                    </div>
                    {document.reviewedAt && (
                      <div className="flex gap-2">
                        <dt className="text-[var(--alo-text-muted)]">Reviewed:</dt>
                        <dd className="text-[var(--alo-text)]">
                          {new Date(document.reviewedAt).toLocaleDateString('en-GB')}
                          {document.reviewedBy ? ` by ${document.reviewedBy}` : ''}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {document.rejectionReason && (
                <div className="border-t border-red-200 bg-red-50 px-5 py-3">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-red-800">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Why this was rejected
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-red-900">
                    {document.rejectionReason}
                  </p>
                  <Button asChild className="mt-3 rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]">
                    <Link href="/student/documents">Upload a Replacement</Link>
                  </Button>
                </div>
              )}

              {document.reviewerNote && (
                <div className="border-t border-amber-200 bg-amber-50 px-5 py-3">
                  <p className="text-[12px] font-semibold text-amber-800">Reviewer note</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-amber-900">
                    {document.reviewerNote}
                  </p>
                </div>
              )}

              {document.isArchived && (
                <div className="border-t border-[var(--alo-border)] bg-[var(--alo-page)] px-5 py-3">
                  <p className="text-[12px] font-semibold text-[var(--alo-body)]">
                    This document is archived. The current version appears on your Documents page.
                  </p>
                </div>
              )}

              {!document.isArchived && (
                <div className="border-t border-[var(--alo-border)] px-5 py-3">
                  <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                    <a href={document.downloadUrl}>
                      <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Download Document
                    </a>
                  </Button>
                  <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Downloads are recorded and the stored file is integrity-checked before it is served.
                  </p>
                </div>
              )}
            </PortalCard>

            {audit.length > 0 && (
              <PortalCard
                className="mt-5"
                title="Activity"
                description="Everyone who has viewed, reviewed or changed this document"
                icon={<History className="mr-2 h-4 w-4 text-[var(--alo-text-muted)]" aria-hidden="true" />}
              >
                <ol className="divide-y divide-[var(--alo-border)]">
                  {audit.map((entry) => (
                    <li key={entry.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[var(--alo-text)]">
                          {entry.action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                        </span>
                        <span className="text-[12px] text-[var(--alo-text-muted)]">
                          {new Date(entry.createdAt).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
                        {entry.actorName || 'System'}
                        {entry.actorRole ? ` · ${entry.actorRole}` : ''}
                        {entry.newStatus ? ` · ${entry.newStatus}` : ''}
                      </p>
                      {entry.note && <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              </PortalCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
