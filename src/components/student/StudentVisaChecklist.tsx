'use client';

/**
 * Visa document checklist — /student/visa/checklist
 *
 * Reads the same GET /api/student/visa-readiness endpoint as the readiness page,
 * grouped by category so the student can work through one section at a time.
 */

import Link from 'next/link';
import { CheckCircle2, CircleDashed, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  item: string;
  documentName: string;
  category: string;
  isRequired: boolean;
  status: string;
  priority: string;
  deadline: string | null;
  reason: string;
}

interface ReadinessResponse {
  checklist: ChecklistItem[];
  blockingItems: number;
  totalItems: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity',
  academic: 'Academic',
  financial: 'Financial',
  english: 'English proficiency',
  employment: 'Employment',
  health: 'Health',
  accommodation: 'Accommodation',
  general: 'General',
};

export default function StudentVisaChecklist() {
  const { data, state, error, reload } = useStudentResource<ReadinessResponse>('/api/student/visa-readiness');

  const checklist = data?.checklist ?? [];
  const categories = Array.from(new Set(checklist.map((item) => item.category || 'general'))).sort();

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Visa Document Checklist"
          description="Every document your visa file needs, grouped by category."
          action={
            <Button asChild className="h-9 rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-orange-500">
              <Link href="/student/documents">
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                Upload Documents
              </Link>
            </Button>
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your checklist…" />}

        {state === 'error' && <PortalError message={error ?? 'Your checklist could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && checklist.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="Your checklist has not been created"
              description="A visa checklist is built from your application and destination once you reach the visa stage. Your counselor can create it earlier on request."
              action={
                <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                  <Link href="/student/messages">Contact Your Counselor</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && checklist.length > 0 && (
          <>
            <div className="mb-6 rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
              <p className="text-[13px] font-semibold text-[var(--alo-text)]">
                {checklist.filter((item) => item.status === 'completed' || item.status === 'approved').length} of {checklist.length} items complete
              </p>
              <p className="mt-1 text-[12px] text-[var(--alo-text-muted)]">
                {(data?.blockingItems ?? 0) > 0
                  ? `${data?.blockingItems} item${(data?.blockingItems ?? 0) === 1 ? '' : 's'} still blocking your file.`
                  : 'No blocking items remain.'}
              </p>
            </div>

            <div className="space-y-4">
              {categories.map((category) => {
                const items = checklist.filter((item) => (item.category || 'general') === category);
                return (
                  <PortalCard key={category} title={CATEGORY_LABELS[category] ?? category} description={`${items.length} item${items.length === 1 ? '' : 's'}`}>
                    <ul className="divide-y divide-[var(--alo-border)]">
                      {items.map((item) => {
                        const done = item.status === 'completed' || item.status === 'approved';
                        const Icon = done ? CheckCircle2 : CircleDashed;
                        return (
                          <li key={item.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', done ? 'text-emerald-600' : 'text-[var(--alo-text-muted)]')} aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-[var(--alo-text)]">{item.item}</p>
                              {item.documentName && (
                                <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">{item.documentName}</p>
                              )}
                              {item.reason && <p className="mt-1 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">{item.reason}</p>}
                              {item.deadline && (
                                <p className="mt-1 text-[12px] font-medium text-amber-700">
                                  Due {new Date(item.deadline).toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                              {item.isRequired
                                ? <StatusBadge value="required" />
                                : <StatusBadge value="optional" />}
                              <StatusBadge value={item.status} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </PortalCard>
                );
              })}
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
              This list reflects what your counselor has recorded for your file. Always confirm the current document
              requirements with the official immigration source before submitting.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
