'use client';

/**
 * Application detail — /student/applications/[id]
 *
 * Reads GET /api/student/applications/[id], which enforces the ownership check
 * server-side before returning the application, its stage history, offer,
 * payment instructions, document checklist and student-visible comments.
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, CircleDashed, Download, FileText, GraduationCap,
  History, Landmark, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface StageHistoryEntry {
  id: string;
  stage: string;
  status: string;
  note: string;
  actor: string;
  createdAt: string;
}

interface OfferRecord {
  id: string;
  offerStatus: string;
  offerLetterUrl: string;
  offerConditions: string;
  conditionDeadline: string | null;
  scholarship: string;
  scholarshipAmount: number;
  depositAmount: number;
  depositDeadline: string | null;
  decisionDate: string | null;
  decisionNote: string;
}

interface PaymentInstruction {
  id: string;
  paymentType: string;
  amount: number;
  currency: string;
  instruction: string;
  deadline: string;
  dueDate: string;
  universityName: string;
  bankName: string;
  accountName: string;
  accountNumberMasked: string;
  swiftCode: string;
  iban: string;
}

interface Checklist {
  id: string;
  requiredDocuments: string;
  completedDocuments: string;
  status: string;
}

interface Comment {
  id: string;
  body?: string;
  comment?: string;
  commentBody?: string;
  createdByName?: string;
  authorName?: string;
  createdAt: string;
}

interface ApplicationDetail {
  id: string;
  applicationCode: string;
  universityName: string;
  courseName: string;
  country: string;
  intake: string;
  level: string;
  stage: string;
  safeStatus: string;
  reviewStatus: string;
  documentStatus: string;
  paymentStatus: string;
  offerStatus: string;
  casI20CoeStatus: string;
  visaHandoverStatus: string;
  deadline: string;
  deadlineDate: string | null;
  counselorName: string;
  status: string;
  stageHistory: StageHistoryEntry[];
  offer: OfferRecord | null;
  paymentInstructions: PaymentInstruction[];
  documentChecklist: Checklist | null;
  comments: Comment[];
}

interface ApplicationResponse {
  success: boolean;
  data: ApplicationDetail;
}

function stageLabel(stage: string): string {
  return stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseNames(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'string' ? item : String(item?.name ?? item?.document ?? '')))
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'BDT',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-GB')} ${currency}`;
  }
}

function commentBody(comment: Comment): string {
  return comment.body ?? comment.comment ?? comment.commentBody ?? '';
}

function commentAuthor(comment: Comment): string {
  return comment.createdByName ?? comment.authorName ?? 'Your counselor';
}

export default function StudentApplicationDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const { data, state, error, reload } = useStudentResource<ApplicationResponse>(
    id ? `/api/student/applications/${id}` : '',
  );

  const application = data?.data ?? null;
  const stageHistory = application?.stageHistory ?? [];
  const required = parseNames(application?.documentChecklist?.requiredDocuments);
  const completed = parseNames(application?.documentChecklist?.completedDocuments);
  const outstanding = required.filter((doc) => !completed.includes(doc));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/student/applications"
          className="mb-4 inline-block text-[13px] font-semibold text-slate-500 hover:text-alo-blue hover:underline"
        >
          ← All applications
        </Link>

        {state === 'loading' && <PortalLoading label="Loading your application…" />}

        {state === 'error' && (
          <PortalError message={error ?? 'This application could not be loaded.'} onRetry={reload} />
        )}

        {state === 'ready' && !application && (
          <PortalCard>
            <PortalEmpty
              title="Application not found"
              description="This application may have been removed, or it belongs to another account."
              action={
                <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 px-4 text-[13px] font-semibold">
                  <Link href="/student/applications">Back to Applications</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && application && (
          <>
            <PortalPageHeader
              title={application.universityName || 'Application'}
              description={
                [application.courseName, application.level, application.country, application.intake]
                  .filter(Boolean)
                  .join(' · ') || 'No course details recorded yet'
              }
              action={
                application.counselorName ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600">
                    Counselor: {application.counselorName}
                  </span>
                ) : undefined
              }
            />

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <code className="rounded-button border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[13px] font-semibold text-slate-900">
                {application.applicationCode}
              </code>
              <StatusBadge value={application.safeStatus} />
              <StatusBadge value={`stage: ${stageLabel(application.stage)}`} />
              {(application.deadline || application.deadlineDate) && (
                <span className="ml-auto text-[12px] font-semibold text-amber-700">
                  Deadline:{' '}
                  {application.deadlineDate
                    ? new Date(application.deadlineDate).toLocaleDateString('en-GB')
                    : application.deadline}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Review', value: application.reviewStatus },
                { label: 'Documents', value: application.documentStatus },
                { label: 'Offer', value: application.offerStatus },
                { label: 'Payment', value: application.paymentStatus },
                { label: 'CAS / I-20 / CoE', value: application.casI20CoeStatus },
                { label: 'Visa handover', value: application.visaHandoverStatus },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">{item.label}</p>
                  <div className="mt-1.5"><StatusBadge value={item.value} /></div>
                </div>
              ))}
            </div>

            {application.offer && (
              <PortalCard
                className="mt-5"
                title="Offer"
                description={application.offer.offerStatus.replace(/_/g, ' ').toLowerCase()}
                icon={<GraduationCap className="mr-2 h-4 w-4 text-alo-blue" aria-hidden="true" />}
              >
                <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                  {application.offer.decisionDate && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Decision date</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
                        {new Date(application.offer.decisionDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}
                  {application.offer.conditionDeadline && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Conditions by</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
                        {new Date(application.offer.conditionDeadline).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}
                  {application.offer.depositAmount > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Deposit</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
                        {formatAmount(application.offer.depositAmount, 'GBP')}
                        {application.offer.depositDeadline
                          ? ` by ${new Date(application.offer.depositDeadline).toLocaleDateString('en-GB')}`
                          : ''}
                      </p>
                    </div>
                  )}
                  {application.offer.scholarship && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Scholarship</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-emerald-700">
                        {application.offer.scholarship}
                        {application.offer.scholarshipAmount > 0
                          ? ` — ${formatAmount(application.offer.scholarshipAmount, 'GBP')}`
                          : ''}
                      </p>
                    </div>
                  )}
                </div>

                {application.offer.offerConditions && (
                  <div className="border-t border-amber-200 bg-amber-50 px-5 py-3">
                    <p className="text-[12px] font-semibold text-amber-800">Conditions</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-amber-900">
                      {application.offer.offerConditions}
                    </p>
                  </div>
                )}

                {application.offer.decisionNote && (
                  <div className="border-t border-slate-200 px-5 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500">Decision note</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                      {application.offer.decisionNote}
                    </p>
                  </div>
                )}

                {application.offer.offerLetterUrl && (
                  <div className="border-t border-slate-200 px-5 py-3">
                    <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 px-4 text-[13px] font-semibold">
                      <a href={application.offer.offerLetterUrl}>
                        <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Download Offer Letter
                      </a>
                    </Button>
                  </div>
                )}
              </PortalCard>
            )}

            {outstanding.length > 0 && (
              <PortalCard
                className="mt-5"
                title="Documents still needed"
                description={`${outstanding.length} of ${required.length} outstanding`}
                icon={<FileText className="mr-2 h-4 w-4 text-amber-600" aria-hidden="true" />}
                action={
                  <Button asChild variant="outline" className="h-8 rounded-button border-slate-200 px-3 text-[12px] font-semibold">
                    <Link href="/student/documents">Upload</Link>
                  </Button>
                }
              >
                <ul className="divide-y divide-slate-200">
                  {outstanding.map((doc) => (
                    <li key={doc} className="flex items-center gap-2.5 px-5 py-2.5">
                      <CircleDashed className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                      <span className="text-[13px] text-slate-700">{doc}</span>
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}

            {application.paymentInstructions.length > 0 && (
              <PortalCard
                className="mt-5"
                title="Payment instructions"
                description="Details recorded by your counselor — confirm before paying"
                icon={<Landmark className="mr-2 h-4 w-4 text-alo-blue" aria-hidden="true" />}
              >
                <ul className="divide-y divide-slate-200">
                  {application.paymentInstructions.map((instruction) => (
                    <li key={instruction.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {instruction.paymentType.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <span className="text-[13px] font-bold text-slate-900">
                          {formatAmount(instruction.amount, instruction.currency)}
                        </span>
                      </div>
                      {instruction.instruction && (
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{instruction.instruction}</p>
                      )}
                      <dl className="mt-2 grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
                        {instruction.bankName && (
                          <div className="flex gap-2"><dt className="text-slate-500">Bank:</dt><dd className="text-slate-800">{instruction.bankName}</dd></div>
                        )}
                        {instruction.accountName && (
                          <div className="flex gap-2"><dt className="text-slate-500">Account name:</dt><dd className="text-slate-800">{instruction.accountName}</dd></div>
                        )}
                        {instruction.accountNumberMasked && (
                          <div className="flex gap-2"><dt className="text-slate-500">Account:</dt><dd className="font-mono text-slate-800">{instruction.accountNumberMasked}</dd></div>
                        )}
                        {instruction.swiftCode && (
                          <div className="flex gap-2"><dt className="text-slate-500">SWIFT:</dt><dd className="font-mono text-slate-800">{instruction.swiftCode}</dd></div>
                        )}
                        {instruction.iban && (
                          <div className="flex gap-2"><dt className="text-slate-500">IBAN:</dt><dd className="font-mono text-slate-800">{instruction.iban}</dd></div>
                        )}
                        {(instruction.deadline || instruction.dueDate) && (
                          <div className="flex gap-2">
                            <dt className="text-slate-500">Due:</dt>
                            <dd className="font-semibold text-amber-700">{instruction.deadline || instruction.dueDate}</dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}

            {application.comments.length > 0 && (
              <PortalCard
                className="mt-5"
                title="Messages from your team"
                icon={<MessageSquare className="mr-2 h-4 w-4 text-alo-blue" aria-hidden="true" />}
              >
                <ul className="divide-y divide-slate-200">
                  {application.comments.map((comment) => (
                    <li key={comment.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-slate-900">{commentAuthor(comment)}</span>
                        <span className="text-[12px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                        {commentBody(comment)}
                      </p>
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}

            <PortalCard
              className="mt-5"
              title="Stage history"
              description="Every stage change recorded on this application"
              icon={<History className="mr-2 h-4 w-4 text-slate-400" aria-hidden="true" />}
            >
              {stageHistory.length === 0 ? (
                <PortalEmpty
                  title="No stage changes recorded yet"
                  description="This list fills in as your application moves between stages."
                />
              ) : (
                <ol className="divide-y divide-slate-200">
                  {stageHistory.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-900">{stageLabel(entry.stage)}</p>
                        {entry.note && (
                          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{entry.note}</p>
                        )}
                        <p className="mt-1 text-[12px] text-slate-400">
                          {new Date(entry.createdAt).toLocaleDateString('en-GB')}
                          {entry.actor ? ` · ${entry.actor}` : ''}
                        </p>
                      </div>
                      <StatusBadge value={entry.status} />
                    </li>
                  ))}
                </ol>
              )}
            </PortalCard>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" className={cn('h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold')}>
                <Link href="/student/documents">Manage Documents</Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold">
                <Link href="/student/visa/checklist">Visa Checklist</Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold">
                <Link href="/student/messages">Message Your Counselor</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
