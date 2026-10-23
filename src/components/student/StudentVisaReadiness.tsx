'use client';

/**
 * Visa readiness — /student/visa/readiness
 *
 * Reads GET /api/student/visa-readiness, which returns the persisted checklist,
 * the latest readiness assessment and derived scores. The readiness figure is
 * a preparation score; it is never presented as a likelihood of visa approval.
 */

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CircleDashed, ShieldCheck } from 'lucide-react';
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

interface Assessment {
  id: string;
  overallScore: number;
  documentsScore: number;
  financialScore: number;
  academicScore: number;
  courseKnowledgeScore: number;
  universityKnowledgeScore: number;
  studyPlanScore: number;
  interviewReadinessScore: number;
  riskLevel: string;
  riskFlags: string;
  recommendations: string;
  assessedAt: string;
}

interface ReadinessResponse {
  checklist: ChecklistItem[];
  assessment: Assessment | null;
  docScore: number;
  overallScore: number;
  riskLevel: string;
  blockingItems: number;
  totalItems: number;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const SCORE_ROWS: { key: keyof Assessment; label: string }[] = [
  { key: 'documentsScore', label: 'Documents' },
  { key: 'financialScore', label: 'Financial evidence' },
  { key: 'academicScore', label: 'Academic consistency' },
  { key: 'courseKnowledgeScore', label: 'Course knowledge' },
  { key: 'universityKnowledgeScore', label: 'University knowledge' },
  { key: 'studyPlanScore', label: 'Study plan' },
  { key: 'interviewReadinessScore', label: 'Interview readiness' },
];

export default function StudentVisaReadiness() {
  const { data, state, error, reload } = useStudentResource<ReadinessResponse>('/api/student/visa-readiness');

  const checklist = data?.checklist ?? [];
  const assessment = data?.assessment ?? null;
  const flags = parseList(assessment?.riskFlags);
  const recommendations = parseList(assessment?.recommendations);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="Visa Readiness"
          description="How prepared your visa file is, based on your documents, finances and interview preparation."
          action={
            <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
              <Link href="/student/visa/checklist">View Full Checklist</Link>
            </Button>
          }
        />

        {state === 'loading' && <PortalLoading label="Calculating your readiness…" />}

        {state === 'error' && <PortalError message={error ?? 'Your visa readiness could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && checklist.length === 0 && !assessment && (
          <PortalCard>
            <PortalEmpty
              title="No visa file yet"
              description="Your visa checklist is created once your application reaches the visa stage. Your counselor can start it earlier if you ask."
              action={
                <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                  <Link href="/student/applications">View Applications</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && (checklist.length > 0 || assessment) && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Preparation score
                </p>
                <p className={cn(
                  'mt-2 text-[34px] font-bold leading-none tracking-[-0.02em]',
                  (data?.overallScore ?? 0) >= 80 ? 'text-emerald-600' : (data?.overallScore ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600',
                )}>
                  {data?.overallScore ?? 0}%
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                  Preparation only. This is not a prediction of your visa outcome.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Risk level</p>
                <p className="mt-2 text-[20px] font-bold leading-tight text-[var(--alo-text)]">
                  {(data?.riskLevel ?? 'UNKNOWN').replace(/_/g, ' ')}
                </p>
                <p className="mt-2 text-[12px] text-[var(--alo-text-muted)]">
                  {data?.blockingItems ?? 0} blocking item{(data?.blockingItems ?? 0) === 1 ? '' : 's'} of {data?.totalItems ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Last assessed</p>
                <p className="mt-2 text-[20px] font-bold leading-tight text-[var(--alo-text)]">
                  {assessment ? new Date(assessment.assessedAt).toLocaleDateString('en-GB') : 'Not assessed'}
                </p>
                <p className="mt-2 text-[12px] text-[var(--alo-text-muted)]">
                  {checklist.filter((item) => item.status === 'completed').length} of {checklist.length} items complete
                </p>
              </div>
            </div>

            {assessment && (
              <PortalCard className="mb-6" title="Score breakdown" description="Where your file is strong and where it needs work">
                <ul className="divide-y divide-[var(--alo-border)]">
                  {SCORE_ROWS.map((row) => {
                    const value = Number(assessment[row.key] ?? 0);
                    return (
                      <li key={row.key} className="flex items-center gap-4 px-5 py-3">
                        <span className="w-44 shrink-0 text-[13px] font-medium text-[var(--alo-body)]">{row.label}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]">
                          <span
                            className={cn(
                              'block h-full rounded-full',
                              value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500',
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                          />
                        </span>
                        <span className="w-10 shrink-0 text-right text-[13px] font-semibold text-[var(--alo-text)]">{value}%</span>
                      </li>
                    );
                  })}
                </ul>
              </PortalCard>
            )}

            {flags.length > 0 && (
              <PortalCard className="mb-6" title="Risk flags" description="Raised by your visa review">
                <ul className="divide-y divide-[var(--alo-border)]">
                  {flags.map((flag, index) => (
                    <li key={`${flag}-${index}`} className="flex gap-3 px-5 py-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                      <span className="text-[13px] leading-relaxed text-[var(--alo-body)]">{flag}</span>
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}

            {recommendations.length > 0 && (
              <PortalCard className="mb-6" title="What to do next">
                <ol className="divide-y divide-[var(--alo-border)]">
                  {recommendations.map((rec, index) => (
                    <li key={`${rec}-${index}`} className="flex gap-3 px-5 py-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-[13px] leading-relaxed text-[var(--alo-body)]">{rec}</span>
                    </li>
                  ))}
                </ol>
              </PortalCard>
            )}

            <PortalCard title="Checklist" description="Required and supporting items">
              {checklist.length === 0 ? (
                <PortalEmpty
                  title="No checklist items yet"
                  description="Items appear here as your visa file is prepared."
                />
              ) : (
                <ul className="divide-y divide-[var(--alo-border)]">
                  {checklist.map((item) => {
                    const done = item.status === 'completed' || item.status === 'approved';
                    const Icon = done ? CheckCircle2 : CircleDashed;
                    return (
                      <li key={item.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', done ? 'text-emerald-600' : 'text-[var(--alo-text-muted)]')} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[var(--alo-text)]">{item.item}</p>
                          {item.reason && <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">{item.reason}</p>}
                          {item.deadline && (
                            <p className="mt-1 text-[12px] text-[var(--alo-text-muted)]">
                              Due {new Date(item.deadline).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {!item.isRequired && <StatusBadge value="optional" />}
                          <StatusBadge value={item.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </PortalCard>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
              Readiness is an internal preparation measure. Visa decisions are made by the destination government, and
              no score here guarantees an outcome. Confirm current requirements with the official immigration source
              before you submit.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
