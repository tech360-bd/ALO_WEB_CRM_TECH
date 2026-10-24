'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckSquare,
  FileClock,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';

/**
 * /crm/ai-command-center (spec §58/§59)
 *
 * Staff-facing operational view of the AI layer, scoped to the caller's
 * authorized students by /api/crm/ai-command-center. There are no hardcoded
 * metrics: every tile is either a real count from the API, an explicit
 * "unavailable" state, or an empty state.
 */

interface NamedStudent {
  studentId: string;
  name: string;
}

interface CommandCenterPayload {
  viewer: { userId: string; name: string; userType: string };
  scope: { mode: 'ALL' | 'OWN'; b2bVisible: boolean; studentCount: number };
  generatedAt: string;
  counts: {
    students: number;
    activeApplications: number;
    documentsAwaitingReview: number;
    pendingNextBestActions: number;
    pendingApprovals: number;
    upcomingDeadlines: number;
    offersAwaitingVerification: number;
    paymentsOutstanding: number;
  };
  lists: {
    nextBestActions: Array<{
      id: string;
      title: string;
      description: string;
      priority: string;
      dueDate: string | null;
      student: NamedStudent | null;
      studentRecordId: string;
    }>;
    documentsAwaitingReview: Array<{
      id: string;
      category: string;
      fileName: string;
      status: string;
      version: number;
      uploadedAt: string;
      student: NamedStudent | null;
      studentRecordId: string;
    }>;
    upcomingDeadlines: Array<{
      applicationRecordId: string;
      applicationCode: string;
      applicationSerial: string;
      universityName: string;
      courseName: string;
      deadlineDate: string | null;
      stage: string;
      student: NamedStudent | null;
    }>;
    pendingApprovals: Array<{
      id: string;
      type: string;
      title: string;
      entityType: string;
      entityId: string;
      priority: string;
      createdAt: string;
      deadline: string | null;
      assignedToMe: boolean;
    }>;
  };
}

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-[var(--crm-danger-bg)] text-[var(--crm-danger-text)] border-[var(--crm-danger-border)]',
  HIGH: 'bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)] border-[var(--crm-warning-border)]',
  NORMAL: 'bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)] border-[var(--alo-border)]',
  LOW: 'bg-[var(--crm-neutral-bg)] text-[var(--crm-neutral-text)] border-[var(--alo-border)]',
};

function formatDate(value: string | null): string {
  if (!value) return 'No date set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date set' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <Card className="rounded-2xl border-[var(--alo-border)]">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight text-[var(--alo-text)]">{value}</p>
          <p className="truncate text-xs text-[var(--alo-text-muted)]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[var(--alo-border)] p-4 text-sm text-[var(--alo-text-muted)]">{children}</p>;
}

export default function CrmAiCommandCenterPage() {
  const [data, setData] = useState<CommandCenterPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/crm/ai-command-center', { cache: 'no-store' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : 'Command center data is unavailable.');
      }
      const payload = (await response.json()) as CommandCenterPayload;
      setData(payload);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Command center data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">ALO AI layer</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">AI Command Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            Operational view of AI-surfaced work for the students you are authorized to see. Every figure below is
            read live from the CRM; when a source is unavailable the section says so instead of showing a placeholder.
          </p>
        </div>
        <Button onClick={() => void load()} disabled={loading} variant="default">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-[var(--crm-danger-border)] bg-[var(--crm-danger-bg)] p-4 text-sm text-[var(--crm-danger-text)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Could not load the command center</p>
            <p className="mt-1">{error}</p>
            <p className="mt-1 text-xs opacity-80">No data is shown rather than showing stale or invented numbers.</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading command center">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)]" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)]">
            <Badge variant="outline" className="border-[var(--alo-border)]">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
              Scope: {data.scope.mode === 'ALL' ? 'all authorized students' : 'my assigned students'}
            </Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">{data.scope.studentCount} students</Badge>
            <Badge variant="outline" className="border-[var(--alo-border)]">B2B confidential {data.scope.b2bVisible ? 'visible' : 'hidden'}</Badge>
            <span>Updated {new Date(data.generatedAt).toLocaleString('en-GB')}</span>
          </div>

          <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Students in scope" value={data.counts.students} icon={Users} />
            <Stat label="Active applications" value={data.counts.activeApplications} icon={Activity} />
            <Stat label="Documents awaiting review" value={data.counts.documentsAwaitingReview} icon={FileClock} />
            <Stat label="Pending approvals" value={data.counts.pendingApprovals} icon={CheckSquare} />
            <Stat label="Next best actions" value={data.counts.pendingNextBestActions} icon={ListChecks} />
            <Stat label="Upcoming deadlines (30d)" value={data.counts.upcomingDeadlines} icon={CalendarClock} />
            <Stat label="Offers awaiting verification" value={data.counts.offersAwaitingVerification} icon={CheckSquare} />
            <Stat label="Payments outstanding" value={data.counts.paymentsOutstanding} icon={AlertTriangle} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next best actions</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">Highest-priority pending actions across your students.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.nextBestActions.length === 0 ? (
                  <EmptyRow>No pending next-best actions. They appear when the journey engine records one for an authorized student.</EmptyRow>
                ) : data.lists.nextBestActions.map((action) => (
                  <Link
                    key={action.id}
                    href={`/crm/students/${action.studentRecordId}`}
                    className="block rounded-xl border border-[var(--alo-border)] p-3 transition hover:border-[var(--alo-brand)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--alo-text)]">{action.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[var(--alo-text-muted)]">
                          {action.student ? `${action.student.studentId} · ${action.student.name}` : 'Student record'} · due {formatDate(action.dueDate)}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${PRIORITY_STYLE[action.priority?.toUpperCase()] ?? PRIORITY_STYLE.NORMAL}`}>
                        {action.priority || 'NORMAL'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documents awaiting review</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">Uploaded documents the AI flagged for a human decision.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.documentsAwaitingReview.length === 0 ? (
                  <EmptyRow>No documents are waiting for review.</EmptyRow>
                ) : data.lists.documentsAwaitingReview.map((document) => (
                  <div key={document.id} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--alo-border)] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--alo-text)]">{document.category}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--alo-text-muted)]">
                        {document.student ? `${document.student.studentId} · ${document.student.name}` : 'Student record'} · v{document.version} · {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-[var(--crm-warning-border)] bg-[var(--crm-warning-bg)] text-[var(--crm-warning-text)]">
                      {document.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upcoming deadlines</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">Applications with a deadline in the next 30 days.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.upcomingDeadlines.length === 0 ? (
                  <EmptyRow>No application deadlines in the next 30 days.</EmptyRow>
                ) : data.lists.upcomingDeadlines.map((deadline) => (
                  <Link
                    key={deadline.applicationRecordId}
                    href={`/crm/application/${deadline.applicationRecordId}`}
                    className="block rounded-xl border border-[var(--alo-border)] p-3 transition hover:border-[var(--alo-brand)]"
                  >
                    <p className="truncate text-sm font-semibold text-[var(--alo-text)]">
                      {deadline.applicationSerial || deadline.applicationCode} · {deadline.universityName || 'University'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--alo-text-muted)]">
                      {deadline.courseName || 'Course'} · {formatDate(deadline.deadlineDate)} · {deadline.stage}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pending approvals</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">Items assigned to you or requested by you. Approval authority stays with the human reviewer.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lists.pendingApprovals.length === 0 ? (
                  <EmptyRow>Nothing is waiting for your approval.</EmptyRow>
                ) : data.lists.pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--alo-border)] p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--alo-text)]">{approval.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--alo-text-muted)]">
                        {approval.type} · {approval.entityType || 'record'} · {formatDate(approval.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${PRIORITY_STYLE[approval.priority?.toUpperCase()] ?? PRIORITY_STYLE.NORMAL}`}>
                      {approval.assignedToMe ? 'Assigned to you' : approval.priority}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--alo-body)]">
                AI never submits an application, approves a payment or issues a visa decision. High-risk actions wait in
                the approval queue for a named human reviewer.
              </p>
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/admin/approvals">
                  Open approval center
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
