'use client';

import { TriangleAlert } from 'lucide-react';
import { NamedIcon } from '@/components/ui/named-icon';

// ============================================================
// ALO EDUCATION — SUPER ADMIN OPERATING DASHBOARD
//
// The single canonical Super Admin surface. Every panel is wired to a
// /api/super-admin/* endpoint that enforces SUPER_ADMIN server-side and
// writes an audit row. There is no hardcoded business figure and no
// demo student data anywhere in this component: a panel that cannot
// load shows an error state, and a panel with no rows shows an empty
// state explaining what is missing.
//
// Section order follows the approved specification:
// header → quick actions → KPI grid → employee control → dashboard
// launcher → permission matrix → branch control → country control →
// approval center → AI command center → 2000 protected agent network →
// security center → global search → system settings → audit logs →
// recent activity.
// ============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AgentNetworkSummary,
  ApprovalRow,
  AuditLogRow,
  BranchControlRow,
  CountryControlRow,
  EmployeeControlRow,
  KpiCard,
  OperatingMetricsResponse,
} from '@/lib/super-admin/types';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Metric,
  Section,
  Skeleton,
  StatusPill,
  TOKENS,
  unavailableText,
} from './primitives';
import { SuperAdminExtendedPanels } from './SuperAdminExtendedPanels';

// ── Types local to this view ────────────────────────────────

interface RoleSummary {
  id: string;
  name: string;
  label: string;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  modules: string[];
}

interface PermissionGroupView {
  key: string;
  name: string;
  description: string;
  department: string;
  riskLevel: 'standard' | 'sensitive' | 'critical';
  permissionCount: number;
  persisted: boolean;
  grants: Array<{ id: string; ownerType: string; ownerId: string; expiresAt: string | null; expired: boolean; isActive: boolean }>;
}

interface SettingRow {
  key: string;
  category: string;
  label: string;
  value: string | null;
  valueType: string;
  isSensitive: boolean;
  updatedAt: string | null;
}

interface ActingAsState {
  active: boolean;
  realActor?: { userId: string; name: string; email: string };
  actingAs?: { userId: string; name: string; email: string; role: string; sessionId: string | null; expiresAt: string | null };
}

interface RequestState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

function useApi<T>(url: string | null): RequestState<T> & { reload: () => void } {
  const [state, setState] = useState<RequestState<T>>({ loading: true, error: null, data: null });
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!url) return;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!alive.current) return;
      if (!response.ok || !payload || payload.success === false) {
        setState({ loading: false, error: payload?.error || `Request failed (${response.status})`, data: null });
        return;
      }
      setState({ loading: false, error: null, data: payload as T });
    } catch (error) {
      if (!alive.current) return;
      setState({ loading: false, error: error instanceof Error ? error.message : 'Network error', data: null });
    }
  }, [url]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => { alive.current = false; };
  }, [load]);

  return { ...state, reload: load };
}

// ── Reason dialog (every privileged action needs a written reason) ──

interface ReasonRequest {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  minChars?: number;
  onConfirm: (reason: string) => Promise<void> | void;
}

function ReasonDialog({ request, onClose }: { request: ReasonRequest | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setReason(''); setError(null); setBusy(false); }, [request]);
  if (!request) return null;

  const minLen = request.minChars ?? 8;
  const tooShort = reason.trim().length < minLen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl" style={{ borderColor: TOKENS.border }}>
        <h3 className="text-base font-semibold" style={{ color: TOKENS.text }}>{request.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--alo-text-muted)]">{request.description}</p>
        <label className="mt-4 block text-xs font-semibold" style={{ color: TOKENS.text }} htmlFor="reason-input">
          Reason (recorded in the audit log, minimum {minLen} characters)
        </label>
        <textarea
          id="reason-input"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: TOKENS.border }}
          placeholder="Why is this action required?"
        />
        {error ? <p className="mt-2 text-xs" style={{ color: TOKENS.danger }}>{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <ActionButton onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton
            variant={request.danger ? 'danger' : 'primary'}
            disabled={busy || tooShort}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await request.onConfirm(reason.trim());
                onClose();
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : 'Action failed.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Applying…' : request.confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ── Shared action helper ────────────────────────────────────

async function mutate(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

// ── KPI card ────────────────────────────────────────────────

// Master §10: KPI glyphs come from Lucide, not emoji. The keys are already
// Lucide export names, so the map just resolves them directly (with the same
// `•` fallback for an unknown key).

function KpiTile({ card }: { card: KpiCard }) {
  const tone = card.status === 'critical' ? TOKENS.danger
    : card.status === 'attention' ? TOKENS.warning
      : card.status === 'ok' ? TOKENS.success
        : '#94A3B8';

  return (
    <Link
      href={card.href}
      className="col-span-12 flex min-h-[148px] flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:col-span-6 xl:col-span-3"
      style={{ borderColor: TOKENS.border }}
      aria-label={`${card.label} — ${card.actionLabel}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">{card.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: TOKENS.text }}>
            {card.available && card.value !== null ? card.value.toLocaleString() : '—'}
          </p>
        </div>
        <NamedIcon name={card.icon} className="size-5" />
      </div>

      <div className="mt-2">
        {card.available ? (
          card.sub.length ? (
            <div className="space-y-0.5">
              {card.sub.slice(0, 3).map((sub) => (
                <Metric key={sub.label} label={sub.label} value={sub.value ?? '—'} tone={sub.tone} />
              ))}
            </div>
          ) : <p className="text-xs text-[var(--alo-text-muted)]">No breakdown available.</p>
        ) : (
          <p className="text-xs" style={{ color: '#94A3B8' }}>{unavailableText(card.unavailableReason)}</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: tone }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
          {card.available ? card.status : 'unavailable'}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: TOKENS.primary }}>{card.actionLabel} →</span>
      </div>
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────

const LAUNCHERS = [
  { name: 'Student Management', href: '/admin/students', role: 'COUNSELOR / ADMIN' },
  { name: 'Partner Management', href: '/admin/partners', role: 'PARTNER_MANAGER' },
  { name: 'Counselor Dashboard', href: '/counselor/dashboard', role: 'COUNSELOR' },
  { name: 'Marketing Manager', href: '/crm/marketing', role: 'MARKETING_MANAGER' },
  { name: 'Visa Interview Officer', href: '/crm/visa-interviews', role: 'VISA_INTERVIEW_OFFICER' },
  { name: 'Application Team', href: '/crm/application', role: 'APPLICATION_TEAM' },
  { name: 'Finance', href: '/crm/ucc', role: 'FINANCE' },
  { name: 'HR', href: '/crm/hrm', role: 'HR_MANAGER' },
  { name: 'English Test', href: '/admin/language-tests', role: 'ENGLISH_TEST' },
  { name: 'Support', href: '/crm/inbox', role: 'SUPPORT_STAFF' },
  { name: 'Branch Manager', href: '/admin/branch-control', role: 'BRANCH_MANAGER' },
  { name: 'AI Command Center', href: '/admin/ai-command-center', role: 'SUPER_ADMIN' },
  { name: 'Website Builder', href: '/admin/website-cms', role: 'MARKETING_MANAGER' },
  { name: 'Reports', href: '/admin/reports', role: 'ADMIN / SUPER_ADMIN' },
] as const;

const QUICK_ACTIONS = [
  { label: 'Add Employee', href: '/admin/employees' },
  { label: 'Add Student', href: '/admin/students' },
  { label: 'Open Employee Control', href: '/admin/employee-control' },
  { label: 'Permission Matrix', href: '/admin/role-permissions' },
  { label: 'Open AI Command Center', href: '/admin/ai-command-center' },
  { label: 'Open Reports', href: '/admin/reports' },
  { label: 'Open Security Center', href: '/admin/security' },
  { label: 'Approve Queue', href: '/admin/approvals' },
] as const;

export default function SuperAdminOperatingDashboard() {
  const router = useRouter();
  const metrics = useApi<OperatingMetricsResponse>('/api/super-admin/dashboard');
  const employees = useApi<{ employees: EmployeeControlRow[]; summary: Record<string, number> }>('/api/super-admin/employees');
  const roles = useApi<{ roles: RoleSummary[]; totals: Record<string, number> }>('/api/super-admin/roles');
  const groups = useApi<{ groups: PermissionGroupView[]; totals: Record<string, number> }>('/api/super-admin/permission-groups');
  const branches = useApi<{ branches: BranchControlRow[]; totals: Record<string, number>; notes: string[] }>('/api/super-admin/branches');
  const countries = useApi<{ countries: CountryControlRow[]; totals: Record<string, number>; notes: string[] }>('/api/super-admin/countries');
  const approvals = useApi<{ approvals: ApprovalRow[]; counts: Record<string, number> }>('/api/super-admin/approvals?status=pending');
  const agents = useApi<AgentNetworkSummary>('/api/super-admin/ai/agents');
  const security = useApi<{
    summary: Record<string, number>;
    sessions: Array<{ id: string; email: string; deviceName: string; isActingAs: boolean; ipAddress: string; createdAt: string }>;
    events: Array<{ id: string; eventType: string; severity: string; description: string; createdAt: string }>;
  }>('/api/super-admin/security');
  const audit = useApi<{ logs: AuditLogRow[] }>('/api/super-admin/audit-logs?limit=25');
  const settings = useApi<{ settings: SettingRow[]; categories: string[]; maintenanceMode: boolean }>('/api/super-admin/settings');
  const acting = useApi<ActingAsState>('/api/super-admin/acting-as/current');

  const [dialog, setDialog] = useState<ReasonRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown[]>>();
  const [searching, setSearching] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 6000);
  };

  const reloadAll = () => {
    void metrics.reload();
    void employees.reload();
    void approvals.reload();
    void security.reload();
    void audit.reload();
    void acting.reload();
  };

  const header = metrics.data?.header;

  const filteredEmployees = useMemo(() => {
    const rows = employees.data?.employees || [];
    const query = employeeQuery.trim().toLowerCase();
    if (!query) return rows.slice(0, 25);
    return rows.filter((row) =>
      [row.name, row.email, row.employeeId, row.role, row.department, row.branch]
        .some((value) => (value || '').toLowerCase().includes(query)),
    ).slice(0, 25);
  }, [employees.data, employeeQuery]);

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/super-admin/global-search?q=${encodeURIComponent(query)}`, { credentials: 'same-origin' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Search failed');
      setSearchResults(payload.results || {});
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Search failed');
      setSearchResults(undefined);
    } finally {
      setSearching(false);
    }
  };

  // ── Employee actions ──────────────────────────────────────

  const startActingAs = (row: EmployeeControlRow) => setDialog({
    title: `Act as ${row.name} (${row.role})?`,
    description:
      'A short-lived, revocable session is created. Every action you take will be recorded as '
      + `"SUPER_ADMIN acting_as ${row.role} / ${row.name}". You do not need the employee's password.`,
    confirmLabel: 'Start Acting-As session',
    onConfirm: async (reason) => {
      await mutate('/api/portal-auth/acting-as/start', 'POST', { targetUserId: row.userId, reason });
      flash(`Acting-As session started for ${row.name}. Reloading…`);
      window.location.reload();
    },
  });

  const changeStatus = (row: EmployeeControlRow, status: string, danger = false) => setDialog({
    title: `${status === 'active' ? 'Reactivate' : 'Suspend'} ${row.name}?`,
    description: status === 'active'
      ? 'The account is reactivated and the employee can sign in again.'
      : 'The employee account is set to suspended, the portal user is blocked and every live session is revoked.',
    confirmLabel: status === 'active' ? 'Reactivate account' : 'Suspend account',
    danger,
    onConfirm: async (reason) => {
      await mutate(`/api/super-admin/employees/${row.id}/status`, 'PATCH', { status, reason, revokeSessions: true });
      flash(`${row.name} is now ${status}.`);
      void employees.reload();
      void metrics.reload();
    },
  });

  const revokeSessions = (row: EmployeeControlRow) => setDialog({
    title: `Revoke all sessions for ${row.name}?`,
    description: `${row.activeSessions} live session(s) will be terminated immediately.`,
    confirmLabel: 'Revoke sessions',
    danger: true,
    onConfirm: async (reason) => {
      const result = await mutate(`/api/super-admin/employees/${row.id}/revoke-sessions`, 'POST', { reason }) as { revokedSessions: number };
      flash(`${result.revokedSessions} session(s) revoked for ${row.name}.`);
      void employees.reload();
    },
  });

  const forcePasswordChange = (row: EmployeeControlRow) => setDialog({
    title: `Force password change for ${row.name}?`,
    description:
      'Flags the account so a new password is required on next login and revokes every live session immediately. No password is viewed or transmitted.',
    confirmLabel: 'Force password reset',
    danger: true,
    onConfirm: async (reason) => {
      await mutate(`/api/super-admin/employees/${encodeURIComponent(row.id)}/force-password-change`, 'POST', { reason });
      flash(`Password change enforced and active sessions revoked for ${row.name}.`);
      void employees.reload();
    },
  });

  const triggerCountryScan = (country: CountryControlRow) => setDialog({
    title: `Queue university/course data scan for ${country.name}?`,
    description:
      'Queues an audited DATA_SCAN task in the task register for worker execution.',
    confirmLabel: 'Queue data scan',
    onConfirm: async (reason) => {
      await mutate(`/api/super-admin/countries/${encodeURIComponent(country.id)}/trigger-data-scan`, 'POST', { reason });
      flash(`Data scan task queued for ${country.name}.`);
      void countries.reload();
    },
  });

  // ── Approval actions ──────────────────────────────────────

  const decide = (row: ApprovalRow, decision: 'approve' | 'reject' | 'revision_needed') => setDialog({
    title: `${decision === 'approve' ? 'Approve' : decision === 'reject' ? 'Reject' : 'Request revision on'} “${row.title}”?`,
    description: `Type: ${row.type}. The decision and your reason are written to the audit log inside a single transaction.`,
    confirmLabel: decision === 'approve' ? 'Approve' : decision === 'reject' ? 'Reject' : 'Request revision',
    danger: decision === 'reject',
    minChars: decision === 'approve' ? 8 : 10,
    onConfirm: async (note) => {
      const encodedId = encodeURIComponent(row.id);
      if (decision === 'approve') {
        await mutate(`/api/super-admin/approvals/${encodedId}/approve`, 'PATCH', { note });
      } else if (decision === 'reject') {
        await mutate(`/api/super-admin/approvals/${encodedId}/reject`, 'PATCH', { reason: note });
      } else {
        await mutate(`/api/super-admin/approvals/${encodedId}/revision-needed`, 'PATCH', { changesNeeded: note });
      }
      flash('Decision recorded.');
      void approvals.reload();
      void metrics.reload();
    },
  });

  // ── Permission group actions ──────────────────────────────

  const assignGroupToRole = (group: PermissionGroupView, role: RoleSummary) => setDialog({
    title: `Grant “${group.name}” to the ${role.label} role?`,
    description: group.riskLevel === 'critical'
      ? 'This is a CRITICAL permission bundle. Every member of the role gains it immediately.'
      : 'Every member of the role gains this permission bundle.',
    confirmLabel: 'Grant group',
    danger: group.riskLevel === 'critical',
    onConfirm: async (reason) => {
      await mutate('/api/super-admin/permission-groups', 'POST', {
        action: 'assign', groupKey: group.key, ownerType: 'ROLE', ownerId: role.id, reason,
      });
      flash(`“${group.name}” granted to ${role.label}.`);
      void groups.reload();
    },
  });

  // ── Settings ──────────────────────────────────────────────

  const settingValue = (row: SettingRow) => settingsDraft[row.key] ?? (row.value ?? '');

  const saveSettings = () => setDialog({
    title: 'Save system settings?',
    description: 'Only changed keys are written. Each change is audited with your reason.',
    confirmLabel: 'Save settings',
    onConfirm: async (reason) => {
      const updates = Object.entries(settingsDraft)
        .filter(([key, value]) => {
          const original = settings.data?.settings.find((row) => row.key === key);
          return original && original.value !== value;
        })
        .map(([key, value]) => ({
          key,
          value,
          isSensitive: settings.data?.settings.find((row) => row.key === key)?.isSensitive || false,
        }));

      if (updates.length === 0) throw new Error('No changes to save.');
      await mutate('/api/super-admin/settings', 'PATCH', {
        updates,
        reason,
        confirmSensitive: updates.some((update) => update.isSensitive),
      });
      setSettingsDraft({});
      flash(`${updates.length} setting(s) saved.`);
      void settings.reload();
    },
  });

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: TOKENS.soft, color: TOKENS.text }}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6">
        <div className="grid grid-cols-12 gap-4">

          {/* 1. HEADER */}
          <header
            className="col-span-12 rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
            style={{ borderColor: TOKENS.border }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: TOKENS.primary }}>
                  ALO Education · Operating Brain
                </p>
                <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">
                  Welcome back, {header?.adminName || 'Super Admin'}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill tone="info">SUPER_ADMIN</StatusPill>
                  {header ? (
                    <>
                      <StatusPill tone={header.pendingApprovals ? 'attention' : 'ok'}>
                        {header.pendingApprovals ?? '—'} pending approvals
                      </StatusPill>
                      <StatusPill tone={header.securityAlerts ? 'critical' : 'ok'}>
                        {header.securityAlerts ?? '—'} security alerts
                      </StatusPill>
                      <StatusPill tone="neutral">{header.aiJobsRunning ?? '—'} AI jobs running</StatusPill>
                    </>
                  ) : (
                    <StatusPill tone="unknown">header metrics unavailable</StatusPill>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                <Metric label="Active students" value={header?.totalActiveStudents ?? '—'} />
                <Metric label="Active applications" value={header?.totalActiveApplications ?? '—'} />
                <Metric label="Employees online" value={header?.employeesOnline ?? '—'} />
                <Metric label="Active today" value={header?.employeesActiveToday ?? '—'} />
                <Metric label="Notifications" value={header?.unreadNotifications ?? '—'} />
                <button
                  type="button"
                  onClick={reloadAll}
                  className="mt-1 rounded-lg border px-2 py-1 text-[11px] font-semibold"
                  style={{ borderColor: TOKENS.border }}
                >
                  Refresh data
                </button>
              </div>
            </div>

            {metrics.error ? (
              <div className="mt-3">
                <ErrorState message={metrics.error} onRetry={metrics.reload} />
              </div>
            ) : null}
            {metrics.data?.warnings?.length ? (
              <ul className="mt-3 space-y-1 rounded-lg border border-dashed p-2 text-[11px] text-[var(--alo-text-muted)]" style={{ borderColor: TOKENS.border }}>
                {metrics.data.warnings.map((warning) => <li key={warning} className="flex items-start gap-1.5"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{warning}</li>)}
              </ul>
            ) : null}
          </header>

          {/* ACTING-AS BANNER */}
          {acting.data?.active ? (
            <div
              className="col-span-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 p-4"
              style={{ borderColor: TOKENS.warning, backgroundColor: '#FFFBEB' }}
              role="status"
            >
              <div>
                <p className="text-sm font-bold">
                  SUPER ADMIN ACTING AS: {acting.data.actingAs?.role} / {acting.data.actingAs?.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Real actor: {acting.data.realActor?.name} · Every action is written to the audit log ·
                  Session expires {acting.data.actingAs?.expiresAt ? new Date(acting.data.actingAs.expiresAt).toLocaleTimeString() : '—'} ·
                  RBAC, finance approvals and settings are blocked in this mode.
                </p>
              </div>
              <ActionButton
                variant="cta"
                onClick={async () => {
                  try {
                    await mutate('/api/portal-auth/acting-as/stop', 'POST', {});
                    window.location.reload();
                  } catch (error) {
                    flash(error instanceof Error ? error.message : 'Could not exit Acting-As mode.');
                  }
                }}
              >
                Exit Acting-As Mode
              </ActionButton>
            </div>
          ) : null}

          {notice ? (
            <div className="col-span-12 rounded-xl border px-4 py-2 text-xs font-medium" style={{ borderColor: TOKENS.success, backgroundColor: '#ECFDF5', color: '#047857' }}>
              {notice}
            </div>
          ) : null}

          {/* 2. QUICK ACTIONS */}
          <Section
            title="Quick actions"
            description="The operations a Super Admin reaches for most often."
            right={<StatusPill tone="neutral">12-column responsive grid</StatusPill>}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex min-h-[48px] items-center justify-center rounded-xl border bg-white px-2 text-center text-[11px] font-semibold transition hover:brightness-95"
                  style={{ borderColor: TOKENS.border, color: TOKENS.text }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </Section>

          {/* 3. KPI GRID */}
          <div className="col-span-12">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Business overview</h2>
              <span className="text-[11px] text-[var(--alo-text-muted)]">
                {metrics.data ? `Generated ${new Date(metrics.data.generatedAt).toLocaleTimeString()}` : 'Loading…'}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-4">
              {metrics.loading && !metrics.data
                ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="col-span-12 rounded-2xl border bg-white p-4 sm:col-span-6 xl:col-span-3" style={{ borderColor: TOKENS.border }}>
                    <Skeleton rows={3} />
                  </div>
                ))
                : (metrics.data?.kpis || []).map((card) => <KpiTile key={card.key} card={card} />)}
            </div>
          </div>

          {/* 4. EMPLOYEE CONTROL CENTER */}
          <Section
            id="employees"
            title="Employee Control Center"
            description="Every employee with RBAC roles, live sessions and open tasks. Opening an employee dashboard or suspending an account requires a written reason and is audited."
            badge={<StatusPill tone="info">{employees.data?.summary?.total ?? '—'} employees</StatusPill>}
            right={
              <input
                value={employeeQuery}
                onChange={(event) => setEmployeeQuery(event.target.value)}
                placeholder="Search name, ID, role, branch…"
                className="min-h-[36px] w-56 rounded-lg border px-3 text-xs outline-none focus:ring-2"
                style={{ borderColor: TOKENS.border }}
                aria-label="Search employees"
              />
            }
          >
            {employees.loading && !employees.data ? <Skeleton rows={5} /> : null}
            {employees.error ? <ErrorState message={employees.error} onRetry={employees.reload} /> : null}
            {employees.data && filteredEmployees.length === 0 ? (
              <EmptyState
                title="No employees matched"
                hint="Adjust the search, or create the first employee from /admin/employees."
              />
            ) : null}
            {filteredEmployees.length ? (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                        {['Employee', 'Role / Department', 'Branch', 'Status', 'Sessions', 'Tasks', 'Last login', 'Actions'].map((heading) => (
                          <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((row) => (
                        <tr key={row.id} className="border-b align-top" style={{ borderColor: TOKENS.border }}>
                          <td className="px-2 py-2">
                            <p className="font-semibold">{row.name}</p>
                            <p className="text-[11px] text-[var(--alo-text-muted)]">{row.employeeId} · {row.email}</p>
                            {row.assignedRoles.length === 0 ? (
                              <StatusPill tone="warning">no RBAC role</StatusPill>
                            ) : null}
                          </td>
                          <td className="px-2 py-2">
                            <p className="font-medium">{row.role}</p>
                            <p className="text-[11px] text-[var(--alo-text-muted)]">{row.department || '—'}</p>
                          </td>
                          <td className="px-2 py-2">{row.branch || '—'}</td>
                          <td className="px-2 py-2">
                            <StatusPill tone={row.status.toLowerCase() === 'active' ? 'ok' : row.status.toLowerCase() === 'pending' ? 'attention' : 'critical'}>
                              {row.status}
                            </StatusPill>
                            {row.isOnline ? <p className="mt-1 text-[11px]" style={{ color: TOKENS.success }}>online</p> : null}
                          </td>
                          <td className="px-2 py-2 tabular-nums">{row.activeSessions}</td>
                          <td className="px-2 py-2 tabular-nums">{row.openTasks}</td>
                          <td className="px-2 py-2 text-[11px] text-[var(--alo-text-muted)]">
                            {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-wrap gap-1">
                              <ActionButton onClick={() => router.push(`/admin/employees?focus=${row.id}`)}>View</ActionButton>
                              <ActionButton
                                variant="primary"
                                disabled={!row.actingAsEligible || acting.data?.active}
                                title={row.actingAsEligible ? 'Open the employee dashboard as this employee' : 'Not eligible for Acting-As (inactive, unverified, privileged or already acting)'}
                                onClick={() => startActingAs(row)}
                              >
                                Open dashboard
                              </ActionButton>
                              <ActionButton onClick={() => revokeSessions(row)}>Revoke sessions</ActionButton>
                              <ActionButton onClick={() => forcePasswordChange(row)}>Force password</ActionButton>
                              {row.status.toLowerCase() === 'active' ? (
                                <ActionButton variant="danger" onClick={() => changeStatus(row, 'suspended', true)}>Suspend</ActionButton>
                              ) : (
                                <ActionButton onClick={() => changeStatus(row, 'active')}>Reactivate</ActionButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 lg:hidden">
                  {filteredEmployees.map((row) => (
                    <div key={row.id} className="rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{row.name}</p>
                          <p className="text-[11px] text-[var(--alo-text-muted)]">{row.employeeId} · {row.role}</p>
                        </div>
                        <StatusPill tone={row.status.toLowerCase() === 'active' ? 'ok' : 'attention'}>{row.status}</StatusPill>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <Metric label="Department" value={row.department || '—'} />
                        <Metric label="Branch" value={row.branch || '—'} />
                        <Metric label="Sessions" value={row.activeSessions} />
                        <Metric label="Open tasks" value={row.openTasks} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <ActionButton variant="primary" disabled={!row.actingAsEligible} onClick={() => startActingAs(row)}>
                          Open dashboard
                        </ActionButton>
                        <ActionButton onClick={() => revokeSessions(row)}>Revoke</ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Section>

          {/* 5. DASHBOARD LAUNCHER */}
          <Section
            title="Dashboard launcher"
            description="Open any employee dashboard. Choosing “Act as” starts an audited Acting-As session for that role."
            badge={<StatusPill tone="neutral">{LAUNCHERS.length} dashboards</StatusPill>}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {LAUNCHERS.map((launcher) => (
                <div key={launcher.name} className="flex min-h-[112px] flex-col justify-between rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
                  <div>
                    <p className="text-sm font-semibold">{launcher.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--alo-text-muted)]">{launcher.role}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Link
                      href={launcher.href}
                      className="inline-flex min-h-[32px] items-center rounded-lg border px-2 text-[11px] font-semibold"
                      style={{ borderColor: TOKENS.border, color: TOKENS.primary }}
                    >
                      Open
                    </Link>
                    <Link
                      href="/admin/role-permissions"
                      className="inline-flex min-h-[32px] items-center rounded-lg border px-2 text-[11px] font-semibold"
                      style={{ borderColor: TOKENS.border, color: TOKENS.text }}
                    >
                      Permissions
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 6. ROLE & PERMISSION MATRIX */}
          <Section
            id="rbac"
            title="Role & Permission Matrix"
            description="Live RBAC from portal_roles / portal_role_permissions. Granting a group is refused while Acting-As mode is active."
            badge={<StatusPill tone="info">{roles.data?.totals?.roles ?? '—'} roles · {groups.data?.totals?.groups ?? '—'} groups</StatusPill>}
            right={<Link href="/admin/role-permissions" className="text-xs font-semibold" style={{ color: TOKENS.primary }}>Open full matrix →</Link>}
          >
            {roles.error ? <ErrorState message={roles.error} onRetry={roles.reload} /> : null}
            {roles.loading && !roles.data ? <Skeleton rows={4} /> : null}
            {roles.data ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['Role', 'Permissions', 'Users', 'Modules', 'Grant a group'].map((heading) => (
                        <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.data.roles.map((role) => (
                      <tr key={role.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5 font-semibold">{role.label}
                          {role.isSystem ? <span className="ml-1 text-[11px] text-[var(--alo-text-muted)]">system</span> : null}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{role.permissionCount}</td>
                        <td className="px-2 py-1.5 tabular-nums">{role.userCount}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">{role.modules.slice(0, 4).join(', ') || '—'}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(groups.data?.groups || []).slice(0, 3).map((group) => (
                              <ActionButton key={group.key} onClick={() => assignGroupToRole(group, role)}>
                                + {group.name}
                              </ActionButton>
                            ))}
                            {(groups.data?.groups?.length || 0) > 3 ? (
                              <Link href="/admin/role-permissions" className="self-center text-[11px] font-semibold" style={{ color: TOKENS.primary }}>
                                all {groups.data?.groups.length} groups →
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {groups.data ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {groups.data.groups.slice(0, 24).map((group) => (
                  <div key={group.key} className="rounded-lg border p-2" style={{ borderColor: TOKENS.border }}>
                    <p className="truncate text-[11px] font-semibold" title={group.name}>{group.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-[var(--alo-text-muted)]">{group.permissionCount} perms</span>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        title={`risk: ${group.riskLevel}`}
                        style={{
                          backgroundColor: group.riskLevel === 'critical' ? TOKENS.danger
                            : group.riskLevel === 'sensitive' ? TOKENS.warning : TOKENS.success,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Section>

          {/* 7 + 8. BRANCH & COUNTRY (left / right) */}
          <div className="col-span-12 grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-8">
              <Section
                title="Branch Control Center"
                description="Branches are the existing `offices` table. A metric that cannot be derived per branch is reported as 0 or null, never estimated."
                badge={<StatusPill tone="neutral">{branches.data?.totals?.offices ?? '—'} branches</StatusPill>}
                right={<Link href="/admin/branch-control" className="text-xs font-semibold" style={{ color: TOKENS.primary }}>Manage →</Link>}
              >
                {branches.error ? <ErrorState message={branches.error} onRetry={branches.reload} /> : null}
                {branches.loading && !branches.data ? <Skeleton rows={4} /> : null}
                {branches.data && branches.data.branches.length === 0 ? (
                  <EmptyState title="No branches configured" hint="Create the first branch from /admin/branch-control." />
                ) : null}
                {branches.data?.branches?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                          {['Branch', 'City', 'Employees', 'Leads', 'Status'].map((heading) => (
                            <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {branches.data.branches.map((branch) => (
                          <tr key={branch.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                            <td className="px-2 py-1.5 font-semibold">{branch.name}<span className="ml-1 text-[11px] text-[var(--alo-text-muted)]">{branch.code}</span></td>
                            <td className="px-2 py-1.5">{branch.city || '—'}</td>
                            <td className="px-2 py-1.5 tabular-nums">{branch.employees}</td>
                            <td className="px-2 py-1.5 tabular-nums">{branch.activeLeads}</td>
                            <td className="px-2 py-1.5"><StatusPill tone={branch.status.toUpperCase() === 'ACTIVE' ? 'ok' : 'neutral'}>{branch.status}</StatusPill></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {branches.data?.notes?.length ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-[var(--alo-text-muted)]">
                    {branches.data.notes.map((note) => <li key={note}>• {note}</li>)}
                  </ul>
                ) : null}
              </Section>

              <Section
                title="Country / Destination Control Center"
                description="Per-country lead, application and visa operations read from real rows."
                badge={<StatusPill tone="neutral">{countries.data?.totals?.countries ?? '—'} destinations</StatusPill>}
                right={<Link href="/admin/country-control" className="text-xs font-semibold" style={{ color: TOKENS.primary }}>Manage →</Link>}
              >
                {countries.error ? <ErrorState message={countries.error} onRetry={countries.reload} /> : null}
                {countries.loading && !countries.data ? <Skeleton rows={4} /> : null}
                {countries.data && countries.data.countries.length === 0 ? (
                  <EmptyState title="No destinations configured" hint="Add countries from /admin/countries." />
                ) : null}
                {countries.data?.countries?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                          {['Country', 'Leads', 'Applications', 'Visa cases', 'High risk', 'Readiness', 'Scan'].map((heading) => (
                            <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {countries.data.countries.slice(0, 15).map((country) => (
                          <tr key={country.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                            <td className="px-2 py-1.5 font-semibold">{country.name}</td>
                            <td className="px-2 py-1.5 tabular-nums">{country.leads}</td>
                            <td className="px-2 py-1.5 tabular-nums">{country.applications}</td>
                            <td className="px-2 py-1.5 tabular-nums">{country.visaCases}</td>
                            <td className="px-2 py-1.5 tabular-nums" style={{ color: country.highRiskVisaCases > 0 ? TOKENS.danger : undefined }}>
                              {country.highRiskVisaCases}
                            </td>
                            <td className="px-2 py-1.5 tabular-nums">{country.visaReadinessAvg === null ? 'not assessed' : `${country.visaReadinessAvg}%`}</td>
                            <td className="px-2 py-1.5">
                              <ActionButton onClick={() => triggerCountryScan(country)}>Queue scan</ActionButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </Section>
            </div>

            {/* 9. APPROVAL CENTER (right column) */}
            <div className="col-span-12 xl:col-span-4">
              <Section
                title="Approval Center"
                description="Human decisions required before risky work proceeds."
                badge={<StatusPill tone={approvals.data?.counts?.pending ? 'attention' : 'ok'}>{approvals.data?.counts?.pending ?? '—'} pending</StatusPill>}
                right={<Link href="/admin/approvals" className="text-xs font-semibold" style={{ color: TOKENS.primary }}>All →</Link>}
              >
                {approvals.error ? <ErrorState message={approvals.error} onRetry={approvals.reload} /> : null}
                {approvals.loading && !approvals.data ? <Skeleton rows={4} /> : null}
                {approvals.data && approvals.data.approvals.length === 0 ? (
                  <EmptyState title="Nothing waiting for approval" hint="New requests appear here automatically." />
                ) : null}
                <ul className="space-y-2">
                  {(approvals.data?.approvals || []).slice(0, 6).map((row) => (
                    <li key={row.id} className="rounded-xl border p-2.5" style={{ borderColor: TOKENS.border }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug">{row.title}</p>
                        <StatusPill tone={row.priority === 'critical' || row.priority === 'urgent' ? 'critical' : 'neutral'}>
                          {row.priority}
                        </StatusPill>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{row.type} · {row.requestedByName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <ActionButton variant="primary" onClick={() => decide(row, 'approve')}>Approve</ActionButton>
                        <ActionButton variant="danger" onClick={() => decide(row, 'reject')}>Reject</ActionButton>
                        <ActionButton onClick={() => decide(row, 'revision_needed')}>Revision</ActionButton>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* SECURITY CENTER */}
              <Section
                title="Security Center"
                description="Live sessions, unresolved security events and RBAC changes."
                badge={<StatusPill tone={security.data?.summary?.unresolvedSecurityEvents ? 'critical' : 'ok'}>
                  {security.data?.summary?.unresolvedSecurityEvents ?? '—'} open
                </StatusPill>}
              >
                {security.error ? <ErrorState message={security.error} onRetry={security.reload} /> : null}
                {security.loading && !security.data ? <Skeleton rows={4} /> : null}
                {security.data ? (
                  <>
                    <div className="space-y-0.5">
                      <Metric label="Active sessions" value={security.data.summary.activeSessions ?? '—'} />
                      <Metric label="Failed logins (7d)" value={security.data.summary.failedLoginAttempts7d ?? '—'} tone={security.data.summary.failedLoginAttempts7d ? 'warning' : undefined} />
                      <Metric label="RBAC changes (7d)" value={security.data.summary.rbacChanges7d ?? '—'} />
                      <Metric label="Suspended accounts" value={security.data.summary.suspendedAccounts ?? '—'} />
                    </div>
                    {security.data.events.length === 0 ? (
                      <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">No unresolved security events.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {security.data.events.slice(0, 4).map((event) => (
                          <li key={event.id} className="text-[11px]">
                            <StatusPill tone={event.severity === 'critical' || event.severity === 'high' ? 'critical' : 'attention'}>
                              {event.severity}
                            </StatusPill>{' '}
                            <span className="text-slate-600">{event.eventType}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </Section>
            </div>
          </div>

          {/* 10. AI COMMAND CENTER */}
          <Section
            id="ai"
            title="AI Command Center"
            description="Command agents to assist with pages, modules, reports, content, campaigns, audits and data work. Risky or publishing actions always require a human approval."
            badge={<StatusPill tone="info">{agents.data?.totalPersistedAgents ?? '—'} agents in database</StatusPill>}
            right={<Link href="/admin/ai-command-center" className="text-xs font-semibold" style={{ color: TOKENS.primary }}>Open command center →</Link>}
          >
            {agents.error ? <ErrorState message={agents.error} onRetry={agents.reload} /> : null}
            {agents.loading && !agents.data ? <Skeleton rows={4} /> : null}
            {agents.data ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                  <Metric label="Logical agents" value={agents.data.totalLogicalAgents.toLocaleString()} />
                  <Metric label="Persisted agents" value={agents.data.totalPersistedAgents} />
                  <Metric label="Active" value={agents.data.active} tone="positive" />
                  <Metric label="Paused" value={agents.data.paused} />
                  <Metric label="Failed" value={agents.data.failed} tone={agents.data.failed ? 'danger' : undefined} />
                  <Metric label="Running jobs" value={agents.data.runningJobs} />
                </div>
                {agents.data.warnings.length ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-[var(--alo-text-muted)]">
                    {agents.data.warnings.map((warning) => <li key={warning} className="flex items-start gap-1.5"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{warning}</li>)}
                  </ul>
                ) : null}
              </>
            ) : null}
          </Section>

          {/* 11. 2000 PROTECTED AGENT NETWORK */}
          <Section
            title={agents.data?.clusterName || 'ALO 2000 Protected Self-Learning Agent Network'}
            description={`40 departments × 50 micro-agents = ${(agents.data?.totalLogicalAgents ?? 2000).toLocaleString()} logical agents. Runtime state is counted from ai_agents and ai_tasks; departments with no persisted rows say so.`}
            badge={<StatusPill tone="info">protected mode</StatusPill>}
          >
            {agents.data ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                  {agents.data.departments.slice(0, 16).map((department) => (
                    <div key={department.key} className="rounded-lg border p-2" style={{ borderColor: TOKENS.border }}>
                      <p className="truncate text-[11px] font-semibold" title={department.name}>{department.name}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--alo-text-muted)]">
                        {department.persistedAgents}/{department.logicalAgents} live
                      </p>
                      <p className="text-[11px]" style={{ color: department.failed ? TOKENS.danger : TOKENS.success }}>
                        {department.failed ? `${department.failed} failed` : 'healthy'}
                      </p>
                    </div>
                  ))}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold" style={{ color: TOKENS.primary }}>
                    Agent protection policies ({agents.data.policies.length})
                  </summary>
                  <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
                    {agents.data.policies.map((policy) => <li key={policy}>• {policy}</li>)}
                  </ul>
                </details>
              </>
            ) : null}
          </Section>

          {/* 12. GLOBAL SEARCH */}
          <Section
            title="Global search"
            description="Find students, partners, employees, applications and visa cases. Every search is audited against your Super Admin account."
          >
            <div className="flex flex-wrap gap-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void runSearch(); }}
                placeholder="Student ID, phone, email, employee ID, application ID…"
                className="min-h-[40px] flex-1 rounded-lg border px-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: TOKENS.border }}
                aria-label="Global search"
              />
              <ActionButton variant="primary" onClick={() => void runSearch()} disabled={searching || searchQuery.trim().length < 2}>
                {searching ? 'Searching…' : 'Search'}
              </ActionButton>
            </div>
            {searchResults ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(searchResults).map(([group, rows]) => (
                  <div key={group} className="rounded-lg border p-2" style={{ borderColor: TOKENS.border }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">{group}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{rows.length}</p>
                    {rows.length === 0 ? <p className="text-[11px] text-[var(--alo-text-muted)]">no matches</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </Section>

          {/* 13. SYSTEM SETTINGS */}
          <Section
            id="settings"
            title="System Settings"
            description="Changes are audited. Sensitive values are never returned by the API and require an explicit confirmation."
            badge={<StatusPill tone={settings.data?.maintenanceMode ? 'critical' : 'ok'}>
              {settings.data?.maintenanceMode ? 'maintenance mode ON' : 'live'}
            </StatusPill>}
            right={<ActionButton variant="primary" onClick={() => saveSettings()} disabled={Object.keys(settingsDraft).length === 0}>Save changes</ActionButton>}
          >
            {settings.error ? <ErrorState message={settings.error} onRetry={settings.reload} /> : null}
            {settings.loading && !settings.data ? <Skeleton rows={5} /> : null}
            {settings.data ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {settings.data.settings.filter((row) => !row.isSensitive).slice(0, 12).map((row) => (
                  <label key={row.key} className="rounded-lg border p-2" style={{ borderColor: TOKENS.border }}>
                    <span className="block text-[11px] font-semibold" title={row.key}>{row.label}</span>
                    {row.valueType === 'boolean' ? (
                      <select
                        value={settingValue(row)}
                        onChange={(event) => setSettingsDraft((draft) => ({ ...draft, [row.key]: event.target.value }))}
                        className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs"
                        style={{ borderColor: TOKENS.border }}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        value={settingValue(row)}
                        onChange={(event) => setSettingsDraft((draft) => ({ ...draft, [row.key]: event.target.value }))}
                        className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs"
                        style={{ borderColor: TOKENS.border }}
                      />
                    )}
                    <span className="mt-1 block truncate text-[11px] text-[var(--alo-text-muted)]">{row.key}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </Section>

          {/* 13B. EXTENDED OPERATING PANELS (Report Center · AI Jobs · System Builder · Security Forensics · Acting-As Log) */}
          <SuperAdminExtendedPanels onPromptReason={setDialog} onFlash={flash} />

          {/* 14. AUDIT LOGS + RECENT ACTIVITY */}
          <Section
            title="Audit log"
            description="Newest privileged events. Audit rows are never deletable from this dashboard."
            badge={<StatusPill tone="neutral">{audit.data?.logs?.length ?? '—'} recent</StatusPill>}
            right={<ActionButton onClick={audit.reload}>Refresh</ActionButton>}
          >
            {audit.error ? <ErrorState message={audit.error} onRetry={audit.reload} /> : null}
            {audit.loading && !audit.data ? <Skeleton rows={5} /> : null}
            {audit.data && audit.data.logs.length === 0 ? (
              <EmptyState title="No audit entries yet" hint="Privileged actions on this dashboard will appear here." />
            ) : null}
            {audit.data?.logs?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['When', 'Action', 'Actor', 'Resource'].map((heading) => (
                        <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {audit.data.logs.map((log) => (
                      <tr key={log.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="whitespace-nowrap px-2 py-1.5 text-[var(--alo-text-muted)]">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-2 py-1.5 font-semibold">{log.action}</td>
                        <td className="px-2 py-1.5">
                          {log.actorRole || 'SUPER_ADMIN'}
                          {log.actingAsRole ? <StatusPill tone="attention">acting-as</StatusPill> : null}
                        </td>
                        <td className="px-2 py-1.5 text-[var(--alo-text-muted)]">{log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 12)}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Section>

          {/* In-grid footnote, not a page footer landmark — the app renders one public footer and one portal footer. */}
          <div className="col-span-12 pb-6 text-center text-[11px] text-[var(--alo-text-muted)]">
            ALO Education · Super Admin Operating Dashboard · every figure on this page is read from the database.
          </div>
        </div>
      </div>

      <ReasonDialog request={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
