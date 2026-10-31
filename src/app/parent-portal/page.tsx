'use client';

// ============================================================
// PARENT / GUARDIAN PORTAL (spec s13, s67, s69, s80)
// ============================================================
// Controlled family access to a student's journey. The server decides what this
// page may show: /api/parents/portal/me resolves the parent from the SESSION
// only and strips fields the access level does not permit, so this component
// cannot widen its own view.
//
// Honesty rules enforced in this UI:
//   * A field withheld by access level says so explicitly, rather than rendering
//     blank and looking like missing data.
//   * NOT_CONFIGURED (feature flag off), NOT_LINKED (no parent record) and a
//     denied access reason each render distinctly (s94, s91).
//   * Financial figures appear only when the parent holds the
//     payment.own_responsibility capability, and only for responsibilities
//     actually recorded — never an estimated balance.
//   * Internal counseling notes, commission and B2B data are not requested and
//     cannot be shown (s69).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Users,
  CalendarClock,
  Wallet,
  Lock,
  Info,
  RefreshCw,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';

interface StudentView {
  id: string;
  name: string;
  journeyStage: string;
  email?: string;
  phone?: string;
}

interface ApplicationView {
  id: string;
  universityName: string;
  courseName: string;
  country: string;
  intake: string;
  status: string;
  deadlineDate: string | null;
}

interface FinanceView {
  studentId: string;
  responsibilities: number;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  byParent: Array<{
    parentId: string;
    parentName: string;
    relationship: string;
    scope: string;
    amount: number;
    paidAmount: number;
    outstanding: number;
    currency: string;
    status: string;
    dueDate: string | null;
  }>;
}

interface PortalData {
  accessLevel: 'NONE' | 'LIMITED' | 'FULL_JOURNEY';
  capabilities: string[];
  student: StudentView | null;
  applications: ApplicationView[];
  deadlines: Array<{ applicationId: string; date: string }>;
  finance: FinanceView | null;
}

type PortalState = 'loading' | 'ready' | 'not_configured' | 'not_linked' | 'denied' | 'error';

const ACCESS_EXPLAINER: Record<string, string> = {
  FULL_JOURNEY:
    'Full journey access: you can see the student\u2019s applications, universities, courses, contact details and deadlines.',
  LIMITED:
    'Limited access: you can see the student\u2019s name, journey stage, application status and deadlines. University, course and contact details are withheld at this level.',
  NONE: 'No portal access has been granted for this student.',
};

function money(value: number, currency: string): string {
  if (!Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

/** A withheld field must be distinguishable from an absent one. */
function Withheld({ shown, label }: { shown: boolean; label: string }) {
  if (shown) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--alo-text-muted)]">
      <EyeOff className="size-3" />
      {label} withheld at your access level
    </span>
  );
}

export default function ParentPortalPage() {
  const [state, setState] = useState<PortalState>('loading');
  const [data, setData] = useState<PortalData | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/parents/portal/me', { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (json?.status === 'NOT_CONFIGURED') {
        setState('not_configured');
        setMessage(json.error || 'The parent portal is not enabled.');
        return;
      }
      if (json?.status === 'NOT_LINKED') {
        setState('not_linked');
        setMessage(json.error || 'This account is not linked to a parent or guardian record.');
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setState('denied');
        setMessage(json?.error || 'Access was not permitted.');
        return;
      }
      if (!res.ok || !json?.success) {
        setState('error');
        setMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setData(json as PortalData);
      setState('ready');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not reach the parent portal service.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--alo-page)]" />
          <div className="h-40 rounded-2xl bg-[var(--alo-surface-muted)]" />
          <div className="h-40 rounded-2xl bg-[var(--alo-surface-muted)]" />
        </div>
      </div>
    );
  }

  if (state !== 'ready' || !data) {
    const copy: Record<Exclude<PortalState, 'loading' | 'ready'>, { title: string; detail: string }> = {
      not_configured: {
        title: 'Parent portal not enabled',
        detail:
          'The parent and guardian portal is switched off on this platform. An administrator can enable the PARENT_GUARDIAN_PORTAL feature flag.',
      },
      not_linked: {
        title: 'Account not linked',
        detail:
          'This login is not linked to a parent or guardian record. Ask your ALO counselor to add you to the student\u2019s profile.',
      },
      denied: {
        title: 'Access not permitted',
        detail: 'Access to this student\u2019s information was not granted, or has been withdrawn.',
      },
      error: {
        title: 'Could not load the portal',
        detail: 'The parent portal service did not respond as expected.',
      },
    };
    const shown = copy[state as keyof typeof copy];
    return (
      <div className="p-6">
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="flex flex-col items-center gap-3 pt-10 pb-10 text-center">
            <Lock className="size-9 text-[var(--alo-text-muted)]" />
            <h1 className="text-base font-bold text-[var(--alo-text)]">{shown.title}</h1>
            <p className="max-w-md text-sm text-[var(--alo-body)]">{message || shown.detail}</p>
            <p className="max-w-md rounded-lg bg-[var(--alo-page)] px-3 py-2 font-mono text-[11px] text-[var(--alo-text-muted)]">
              reason: {message || 'unknown'}
            </p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullJourney = data.accessLevel === 'FULL_JOURNEY';
  const upcoming = [...data.deadlines]
    .filter((item) => new Date(item.date).getTime() >= Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <Users className="size-5 text-[var(--alo-brand)]" />
            Parent &amp; Guardian Portal
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            A controlled view of the student journey. What you can see is set by the access level ALO
            granted you.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Access level is stated openly, not silently enforced */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)] bg-[var(--alo-brand-pale)]/50">
        <CardContent className="flex items-start gap-3 pt-5 pb-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--alo-brand)]" />
          <div>
            <p className="text-sm font-bold text-[var(--alo-text)]">
              Access level: {data.accessLevel.replace('_', ' ')}
            </p>
            <p className="mt-0.5 text-xs text-[var(--alo-body)]">{ACCESS_EXPLAINER[data.accessLevel] ?? ''}</p>
            {data.capabilities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {data.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline" className="bg-white font-mono text-[11px]">
                    {capability}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <GraduationCap className="size-4 text-[var(--alo-brand)]" />
            Student
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {data.student ? (
            <>
              <p className="text-base font-bold text-[var(--alo-text)]">{data.student.name}</p>
              <p className="text-xs text-[var(--alo-body)]">
                Journey stage: <span className="font-semibold">{data.student.journeyStage || 'not recorded'}</span>
              </p>
              {fullJourney ? (
                <div className="space-y-0.5 text-xs text-[var(--alo-body)]">
                  {data.student.email && <p>Email: {data.student.email}</p>}
                  {data.student.phone && <p>Phone: {data.student.phone}</p>}
                  {!data.student.email && !data.student.phone && (
                    <p className="text-[var(--alo-text-muted)]">No contact details recorded.</p>
                  )}
                </div>
              ) : (
                <Withheld shown={false} label="Contact details" />
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--alo-text-muted)]">No student record is available at your access level.</p>
          )}
        </CardContent>
      </Card>

      {/* Applications */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Applications ({data.applications.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {data.applications.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--alo-text-muted)]">No applications recorded yet.</p>
          ) : (
            data.applications.map((application) => (
              <div key={application.id} className="rounded-xl border border-[var(--alo-border)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--alo-text)]">
                      {fullJourney && application.universityName
                        ? application.universityName
                        : 'Application'}
                    </p>
                    {fullJourney ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--alo-body)]">
                        {[application.courseName, application.country, application.intake]
                          .filter(Boolean)
                          .join(' · ') || 'No course details recorded'}
                      </p>
                    ) : (
                      <Withheld shown={false} label="University and course" />
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[11px]">
                    {application.status || 'UNKNOWN'}
                  </Badge>
                </div>
                {application.deadlineDate && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--alo-body)]">
                    <CalendarClock className="size-3.5" />
                    Deadline {new Date(application.deadlineDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <CalendarClock className="size-4 text-[var(--alo-brand)]" />
            Upcoming deadlines ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="py-3 text-center text-sm text-[var(--alo-text-muted)]">
              {data.deadlines.length > 0
                ? 'All recorded deadlines have passed. Contact your counselor if you expected an upcoming date.'
                : 'No deadlines recorded.'}
            </p>
          ) : (
            upcoming.map((deadline) => {
              const days = Math.ceil((new Date(deadline.date).getTime() - Date.now()) / 86_400_000);
              const urgent = days <= 7;
              return (
                <div
                  key={`${deadline.applicationId}-${deadline.date}`}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs ${
                    urgent ? 'border-crm-danger-border bg-crm-danger-bg' : 'border-[var(--alo-border)]'
                  }`}
                >
                  <span className="font-mono text-[var(--alo-body)]">{deadline.applicationId}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--alo-text)]">
                      {new Date(deadline.date).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className={urgent ? 'border-crm-danger-border bg-white text-[11px] text-crm-danger-text' : 'text-[11px]'}>
                      {days} day{days === 1 ? '' : 's'}
                    </Badge>
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Finance — only with the capability, only real recorded responsibilities */}
      {data.finance && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="size-4 text-[var(--alo-brand)]" />
              Payment responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.finance.responsibilities === 0 ? (
              <p className="py-3 text-center text-sm text-[var(--alo-text-muted)]">
                No payment responsibility has been recorded against you.
              </p>
            ) : (
              <>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Total</p>
                    <p className="text-xl font-black text-[var(--alo-text)]">
                      {money(data.finance.totalAmount, data.finance.byParent[0]?.currency ?? 'GBP')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-crm-success-border bg-crm-success-bg p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-crm-success-text">Paid</p>
                    <p className="text-xl font-black text-crm-success-text">
                      {money(data.finance.totalPaid, data.finance.byParent[0]?.currency ?? 'GBP')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-crm-warning-border bg-crm-warning-bg p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-crm-warning-text">Outstanding</p>
                    <p className="text-xl font-black text-crm-warning-text">
                      {money(data.finance.outstanding, data.finance.byParent[0]?.currency ?? 'GBP')}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-[var(--alo-border)] text-left font-bold text-[var(--alo-body)]">
                        <th className="p-2">Responsible</th>
                        <th className="p-2">Scope</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Paid</th>
                        <th className="p-2">Outstanding</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.finance.byParent.map((item, index) => (
                        <tr key={`${item.parentId}-${index}`} className="border-b border-[var(--alo-border)]">
                          <td className="p-2">
                            {item.parentName} <span className="text-[var(--alo-text-muted)]">({item.relationship})</span>
                          </td>
                          <td className="p-2">{item.scope}</td>
                          <td className="p-2 font-mono">{money(item.amount, item.currency)}</td>
                          <td className="p-2 font-mono">{money(item.paidAmount, item.currency)}</td>
                          <td className="p-2 font-mono font-semibold">{money(item.outstanding, item.currency)}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[11px]">{item.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <p className="flex items-start gap-1.5 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-[11px] text-[var(--alo-body)]">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Internal counseling notes, commission arrangements and partner information are never shown in
        this portal. If a detail you need is missing, contact your ALO counselor rather than assuming
        it is unavailable.
      </p>
    </div>
  );
}
