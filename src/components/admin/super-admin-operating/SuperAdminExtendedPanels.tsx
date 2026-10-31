'use client';

// ============================================================
// ALO EDUCATION — SUPER ADMIN EXTENDED OPERATING PANELS
//
// Surfaces the remaining server-enforced /api/super-admin/* endpoints on the
// canonical Super Admin Operating Dashboard:
//   1. Report Center (/reports, /reports/generate, /reports/{id}/download)
//   2. AI Job Queue & Risk Gate (/ai/jobs, /ai/jobs/{id}/approve|reject)
//   3. AI System Builder (/ai/system-builder/request, /requests, /{id}/approve|apply)
//   4. Security Forensics & Session Register (/security/logins, /security/sessions, /security/revoke-session)
//   5. Acting-As Action Forensics, RBAC Rollback & Maintenance Mode Switch
//
// Zero fabricated numbers: every table reads directly from its endpoint and
// renders explicit loading, error, or empty states.
// ============================================================

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Metric,
  Section,
  Skeleton,
  StatusPill,
  TOKENS,
} from './primitives';

export interface ReasonPromptSpec {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}

interface ExtendedPanelsProps {
  onPromptReason: (spec: ReasonPromptSpec) => void;
  onFlash: (message: string) => void;
}

interface ApiState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

function usePanelApi<T>(url: string): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({ loading: true, error: null, data: null });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!mounted.current) return;
      if (!response.ok || !payload || payload.success === false) {
        setState({
          loading: false,
          error: payload?.error || `Request failed (${response.status})`,
          data: null,
        });
        return;
      }
      setState({ loading: false, error: null, data: payload as T });
    } catch (error) {
      if (!mounted.current) return;
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null,
      });
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, reload: load };
}

async function panelMutate(url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

// ── Response types ───────────────────────────────────────────

interface ReportCatalogItem {
  key: string;
  name: string;
  category: string;
  description: string;
  filters: string[];
}

interface GeneratedReportRow {
  id: string;
  reportCode: string;
  category: string;
  title: string;
  format: string;
  status: string;
  rowCount: number;
  generatedAt: string;
  downloadCount: number;
}

interface ReportsResponse {
  catalogue: ReportCatalogItem[];
  categories: string[];
  totals: { reportTypes: number; categories: number; generated: number };
  generated: GeneratedReportRow[];
}

interface AiJobRow {
  id: string;
  code: string;
  agentName: string;
  department: string;
  action: string;
  status: string;
  priority: string;
  requiresApproval: boolean;
  errorMessage: string | null;
  createdAt: string;
}

interface AiJobsResponse {
  riskyActions: string[];
  statuses: string[];
  counts: Record<string, number>;
  jobs: AiJobRow[];
}

interface BuildRequestRow {
  id: string;
  code: string;
  taskType: string;
  targetModule: string;
  requirement: string;
  priority: string;
  riskLevel: string;
  status: string;
  decisionNote: string;
  createdAt: string;
}

interface BuildRequestsResponse {
  counts: Record<string, number>;
  requests: BuildRequestRow[];
}

interface LoginForensicsResponse {
  windowHours: number;
  totals: {
    attempts: number;
    sampled: number;
    failures: number;
    activeSessions: number;
    registeredDevices: number;
  };
  bruteForceSuspicion: {
    threshold: number;
    suspiciousIps: Array<{ ipAddress: string; failedAttempts: number }>;
    note: string;
  };
  recentAttempts: Array<{
    id: string;
    email: string;
    ipAddress: string;
    success: boolean;
    failureReason: string;
    createdAt: string;
  }>;
}

interface SessionsResponse {
  scope: string;
  totals: { sessions: number; actingAs: number };
  sessions: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    deviceName: string;
    ipAddress: string;
    startedAt: string;
    expiresAt: string;
    revokedAt: string | null;
    isActingAs: boolean;
  }>;
}

interface ActingAsLogResponse {
  totals: { actions: number; sessions: number };
  sessions: Array<{
    sessionId: string;
    actingAsUser: string | null;
    actingAsRole: string | null;
    realActorUserId: string | null;
    count: number;
    lastAt: string;
  }>;
  actions: Array<{
    id: string;
    action: string;
    realActorUserId: string;
    actingAsUser: string | null;
    actingAsRole: string | null;
    entityType?: string;
    createdAt?: string;
  }>;
}

interface RollbackSnapshotsResponse {
  snapshots?: Array<{
    auditId: string;
    action: string;
    targetUserId: string;
    createdAt: string;
    reason: string;
  }>;
  candidates?: Array<{
    auditId: string;
    action: string;
    targetUserId: string;
    createdAt: string;
    reason: string;
  }>;
}

interface MaintenanceModeResponse {
  enabled: boolean;
  message?: string;
  note?: string;
}

const SYSTEM_BUILDER_TASK_TYPES = [
  'create_page',
  'create_dashboard',
  'create_form',
  'create_report',
  'create_api',
  'create_database_model',
  'fix_bug',
  'audit_route',
  'audit_security',
  'improve_ui',
  'generate_content',
  'generate_workflow',
] as const;

export function SuperAdminExtendedPanels({ onPromptReason, onFlash }: ExtendedPanelsProps) {
  // 1. Report Center state
  const reports = usePanelApi<ReportsResponse>('/api/super-admin/reports');
  const [selectedReportKey, setSelectedReportKey] = useState('');
  const [reportFormat, setReportFormat] = useState<'csv' | 'json'>('csv');
  const [reportCountry, setReportCountry] = useState('');

  // 2. AI Jobs state
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const aiJobs = usePanelApi<AiJobsResponse>(
    `/api/super-admin/ai/jobs${jobStatusFilter ? `?status=${encodeURIComponent(jobStatusFilter)}` : ''}`,
  );
  const [newJobAction, setNewJobAction] = useState('audit_data_integrity');
  const [newJobAgentCode, setNewJobAgentCode] = useState('');

  // 3. AI System Builder state
  const buildRequests = usePanelApi<BuildRequestsResponse>(
    '/api/super-admin/ai/system-builder/requests',
  );
  const [taskType, setTaskType] =
    useState<(typeof SYSTEM_BUILDER_TASK_TYPES)[number]>('audit_route');
  const [targetModule, setTargetModule] = useState('');
  const [requirement, setRequirement] = useState('');
  const [buildPriority, setBuildPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  // 4. Security Forensics & Live Sessions state
  const [sessionScope, setSessionScope] = useState<'active' | 'revoked' | 'all'>('active');
  const loginForensics = usePanelApi<LoginForensicsResponse>(
    '/api/super-admin/security/logins?hours=24',
  );
  const liveSessions = usePanelApi<SessionsResponse>(
    `/api/super-admin/security/sessions?scope=${sessionScope}`,
  );

  // 5. Acting-As Forensics + Rollback + Maintenance switch
  const actingAsLog = usePanelApi<ActingAsLogResponse>('/api/super-admin/acting-as/action-log');
  const rollbackList = usePanelApi<RollbackSnapshotsResponse>(
    '/api/super-admin/permissions/rollback',
  );
  const maintenance = usePanelApi<MaintenanceModeResponse>(
    '/api/super-admin/settings/maintenance-mode',
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    if (!selectedReportKey && reports.data?.catalogue?.length) {
      setSelectedReportKey(reports.data.catalogue[0].key);
    }
  }, [reports.data, selectedReportKey]);

  const activeReportDef = reports.data?.catalogue.find((r) => r.key === selectedReportKey);

  // ── Handlers ───────────────────────────────────────────────

  const triggerGenerateReport = () => {
    if (!activeReportDef) return;
    const filters: Record<string, string> = {};
    if (reportCountry.trim() && activeReportDef.filters.includes('country')) {
      filters.country = reportCountry.trim();
    }
    onPromptReason({
      title: `Generate report “${activeReportDef.name}”?`,
      description: `Format: ${reportFormat.toUpperCase()}. Generation writes a stored artifact and an audit entry.`,
      confirmLabel: 'Generate report',
      onConfirm: async (reason) => {
        const res = await panelMutate('/api/super-admin/reports/generate', 'POST', {
          reportKey: activeReportDef.key,
          format: reportFormat,
          filters,
          reason,
        });
        onFlash(`Report ${res.reportCode || activeReportDef.key} generated.`);
        reports.reload();
      },
    });
  };

  const queueAiJob = () => {
    if (!newJobAction.trim()) return;
    onPromptReason({
      title: `Queue AI job “${newJobAction}”?`,
      description:
        'Protected actions are held in WAITING until a non-acting Super Admin approves them.',
      confirmLabel: 'Queue job',
      onConfirm: async (reason) => {
        await panelMutate('/api/super-admin/ai/jobs', 'POST', {
          action: newJobAction.trim(),
          ...(newJobAgentCode.trim() ? { agentCode: newJobAgentCode.trim() } : {}),
          payload: { reason },
          reason,
        });
        onFlash(`AI job “${newJobAction.trim()}” submitted.`);
        aiJobs.reload();
      },
    });
  };

  const decideAiJob = (job: AiJobRow, decision: 'approve' | 'reject') => {
    onPromptReason({
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} AI job ${job.code} (${job.action})?`,
      description: `Agent: ${job.agentName || 'unassigned'} · Department: ${job.department}. Your decision note is stored in the audit log.`,
      confirmLabel: decision === 'approve' ? 'Approve job' : 'Reject job',
      danger: decision === 'reject',
      onConfirm: async (note) => {
        await panelMutate(
          `/api/super-admin/ai/jobs/${encodeURIComponent(job.id)}/${decision}`,
          'PATCH',
          { note },
        );
        onFlash(`AI job ${job.code} ${decision}d.`);
        aiJobs.reload();
      },
    });
  };

  const submitBuildRequest = () => {
    if (targetModule.trim().length < 2 || requirement.trim().length < 20) {
      onFlash('Enter a target module (2+ chars) and requirement description (20+ chars).');
      return;
    }
    onPromptReason({
      title: `Submit System Builder plan request for “${targetModule.trim()}”?`,
      description:
        'Produces a deterministic rule-engine plan (explicitly not an LLM) and holds it behind Super Admin approval.',
      confirmLabel: 'Submit build request',
      onConfirm: async (reason) => {
        await panelMutate('/api/super-admin/ai/system-builder/request', 'POST', {
          taskType,
          targetModule: targetModule.trim(),
          requirement: requirement.trim(),
          priority: buildPriority,
          sandboxFirst: true,
          publishAfterApproval: false,
          reason,
        });
        setTargetModule('');
        setRequirement('');
        onFlash('System Builder request recorded.');
        buildRequests.reload();
      },
    });
  };

  const reviewBuildRequest = (row: BuildRequestRow, decision: 'approve' | 'reject') => {
    onPromptReason({
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} build request ${row.code}?`,
      description: `Module: ${row.targetModule} · Risk: ${row.riskLevel}. High-risk requests require a second Super Admin.`,
      confirmLabel: decision === 'approve' ? 'Approve plan' : 'Reject plan',
      danger: decision === 'reject',
      onConfirm: async (note) => {
        await panelMutate(
          `/api/super-admin/ai/system-builder/requests/${encodeURIComponent(row.id)}/approve`,
          'PATCH',
          { decision, note },
        );
        onFlash(`Build request ${row.code} ${decision}d.`);
        buildRequests.reload();
      },
    });
  };

  const markBuildApplied = (row: BuildRequestRow) => {
    onPromptReason({
      title: `Record ${row.code} as applied via deployment pipeline?`,
      description:
        'Marks an APPROVED request as APPLIED and audits the deployment note. Never rewrites source files inside the web runtime.',
      confirmLabel: 'Confirm applied',
      onConfirm: async (note) => {
        await panelMutate(
          `/api/super-admin/ai/system-builder/requests/${encodeURIComponent(row.id)}/apply`,
          'POST',
          { note, confirmedApplied: true },
        );
        onFlash(`Build request ${row.code} marked APPLIED.`);
        buildRequests.reload();
      },
    });
  };

  const revokeSingleSession = (sessionId: string, label: string) => {
    onPromptReason({
      title: `Revoke session for ${label}?`,
      description: 'Terminates this portal session immediately and writes an audit row.',
      confirmLabel: 'Revoke session',
      danger: true,
      onConfirm: async (reason) => {
        await panelMutate('/api/super-admin/security/revoke-session', 'POST', {
          sessionId,
          reason,
        });
        onFlash(`Session revoked for ${label}.`);
        liveSessions.reload();
        loginForensics.reload();
      },
    });
  };

  const rollbackPermission = (auditId: string, targetUserId: string) => {
    onPromptReason({
      title: `Rollback permission change (${auditId.slice(0, 10)})?`,
      description: `Restores the prior permission snapshot for user ${targetUserId}.`,
      confirmLabel: 'Rollback snapshot',
      danger: true,
      onConfirm: async (reason) => {
        await panelMutate('/api/super-admin/permissions/rollback', 'POST', {
          auditId,
          reason,
        });
        onFlash('Permission snapshot restored.');
        rollbackList.reload();
      },
    });
  };

  const toggleMaintenance = (nextEnabled: boolean) => {
    onPromptReason({
      title: `${nextEnabled ? 'Enable' : 'Disable'} platform maintenance mode?`,
      description:
        'Persisted in system_settings (`platform.maintenance_mode`) and audited with before/after values.',
      confirmLabel: nextEnabled ? 'Enable maintenance mode' : 'Return platform live',
      danger: nextEnabled,
      onConfirm: async (reason) => {
        await panelMutate('/api/super-admin/settings/maintenance-mode', 'PATCH', {
          enabled: nextEnabled,
          ...(maintenanceMessage.trim() ? { message: maintenanceMessage.trim() } : {}),
          reason,
        });
        onFlash(`Maintenance mode ${nextEnabled ? 'enabled' : 'disabled'}.`);
        maintenance.reload();
      },
    });
  };

  const rollbackEntries =
    rollbackList.data?.snapshots || rollbackList.data?.candidates || [];

  return (
    <>
      {/* A. REPORT CENTER */}
      <Section
        id="reports"
        title="Global Report Center"
        description="24 declared report definitions across admissions, leads, visa, finance, employees and marketing. Viewing never generates data; every generation and download is audited."
        badge={
          <StatusPill tone="info">
            {reports.data?.totals?.reportTypes ?? '—'} definitions · {reports.data?.totals?.generated ?? '—'} generated
          </StatusPill>
        }
        right={<ActionButton onClick={reports.reload}>Refresh</ActionButton>}
      >
        {reports.error ? <ErrorState message={reports.error} onRetry={reports.reload} /> : null}
        {reports.loading && !reports.data ? <Skeleton rows={4} /> : null}
        {reports.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <label className="text-xs sm:col-span-2">
                <span className="block font-semibold">Report definition</span>
                <select
                  value={selectedReportKey}
                  onChange={(e) => setSelectedReportKey(e.target.value)}
                  className="mt-1 min-h-[36px] w-full rounded-lg border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                >
                  {reports.data.catalogue.map((item) => (
                    <option key={item.key} value={item.key}>
                      [{item.category}] {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="block font-semibold">Format</span>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value as 'csv' | 'json')}
                  className="mt-1 min-h-[36px] w-full rounded-lg border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </label>
              <div className="flex items-end gap-2">
                {activeReportDef?.filters.includes('country') ? (
                  <input
                    value={reportCountry}
                    onChange={(e) => setReportCountry(e.target.value)}
                    placeholder="Country filter (optional)"
                    className="min-h-[36px] flex-1 rounded-lg border px-2 text-xs"
                    style={{ borderColor: TOKENS.border }}
                  />
                ) : null}
                <ActionButton variant="primary" onClick={triggerGenerateReport}>
                  Generate
                </ActionButton>
              </div>
            </div>

            {activeReportDef ? (
              <p className="text-[11px] text-[var(--alo-text-muted)]">
                {activeReportDef.description} · Supported filters:{' '}
                {activeReportDef.filters.length ? activeReportDef.filters.join(', ') : 'none'}
              </p>
            ) : null}

            {reports.data.generated.length === 0 ? (
              <EmptyState
                title="No reports generated yet"
                hint="Choose a report definition above and generate an audited CSV or JSON export."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['Code', 'Title', 'Category', 'Format', 'Rows', 'Generated', 'Downloads', 'Export'].map(
                        (h) => (
                          <th key={h} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.data.generated.slice(0, 12).map((row) => (
                      <tr key={row.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5 font-mono text-[11px]">{row.reportCode}</td>
                        <td className="px-2 py-1.5 font-semibold">{row.title}</td>
                        <td className="px-2 py-1.5">{row.category}</td>
                        <td className="px-2 py-1.5 uppercase">{row.format}</td>
                        <td className="px-2 py-1.5 tabular-nums">{row.rowCount}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          {new Date(row.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{row.downloadCount}</td>
                        <td className="px-2 py-1.5">
                          <a
                            href={`/api/super-admin/reports/${encodeURIComponent(row.id)}/download`}
                            className="inline-flex min-h-[28px] items-center rounded-md border px-2 text-[11px] font-semibold"
                            style={{ borderColor: TOKENS.border, color: TOKENS.primary }}
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Section>

      {/* B. AI JOB QUEUE & HUMAN APPROVAL GATE */}
      <Section
        id="ai-jobs"
        title="AI Job Queue & Protected Action Gate"
        description="11 high-risk actions (RBAC, deletion, publishing, commission, deploy) are automatically held in WAITING until a non-acting Super Admin approves or rejects them."
        badge={
          <StatusPill tone={aiJobs.data?.counts?.WAITING ? 'attention' : 'ok'}>
            {aiJobs.data?.counts?.WAITING ?? 0} waiting approval
          </StatusPill>
        }
        right={
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter AI jobs by status"
              value={jobStatusFilter}
              onChange={(e) => setJobStatusFilter(e.target.value)}
              className="min-h-[32px] rounded-lg border px-2 text-xs"
              style={{ borderColor: TOKENS.border }}
            >
              <option value="">All statuses</option>
              {['WAITING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ActionButton onClick={aiJobs.reload}>Refresh</ActionButton>
          </div>
        }
      >
        {aiJobs.error ? <ErrorState message={aiJobs.error} onRetry={aiJobs.reload} /> : null}
        {aiJobs.loading && !aiJobs.data ? <Skeleton rows={4} /> : null}
        {aiJobs.data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-2 rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
              <label className="text-xs flex-1 min-w-[180px]">
                <span className="block font-semibold">Action slug (a-z0-9_)</span>
                <input
                  value={newJobAction}
                  onChange={(e) => setNewJobAction(e.target.value)}
                  placeholder="e.g. audit_data_integrity or publish_social_content"
                  className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs font-mono"
                  style={{ borderColor: TOKENS.border }}
                />
              </label>
              <label className="text-xs min-w-[160px]">
                <span className="block font-semibold">Agent code (optional)</span>
                <input
                  value={newJobAgentCode}
                  onChange={(e) => setNewJobAgentCode(e.target.value)}
                  placeholder="alo_cmd_orchestrator"
                  className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs font-mono"
                  style={{ borderColor: TOKENS.border }}
                />
              </label>
              <ActionButton variant="primary" onClick={queueAiJob}>
                Queue AI Job
              </ActionButton>
            </div>

            {aiJobs.data.jobs.length === 0 ? (
              <EmptyState
                title="No AI jobs in this view"
                hint="Queued and human-gated AI tasks from ai_tasks appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['Code', 'Action', 'Agent / Dept', 'Status', 'Created', 'Gate Actions'].map((h) => (
                        <th key={h} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aiJobs.data.jobs.slice(0, 15).map((job) => (
                      <tr key={job.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5 font-mono text-[11px]">{job.code}</td>
                        <td className="px-2 py-1.5">
                          <span className="font-mono font-semibold">{job.action}</span>
                          {job.requiresApproval ? (
                            <span className="ml-1.5">
                              <StatusPill tone="warning">protected</StatusPill>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-1.5">
                          {job.agentName || '—'} · <span className="text-[var(--alo-text-muted)]">{job.department}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <StatusPill
                            tone={
                              job.status === 'WAITING'
                                ? 'attention'
                                : job.status === 'COMPLETED'
                                  ? 'ok'
                                  : job.status === 'FAILED' || job.status === 'CANCELLED'
                                    ? 'critical'
                                    : 'info'
                            }
                          >
                            {job.status}
                          </StatusPill>
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5">
                          {job.status === 'WAITING' ? (
                            <div className="flex flex-wrap gap-1">
                              <ActionButton variant="primary" onClick={() => decideAiJob(job, 'approve')}>
                                Approve
                              </ActionButton>
                              <ActionButton variant="danger" onClick={() => decideAiJob(job, 'reject')}>
                                Reject
                              </ActionButton>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--alo-text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Section>

      {/* C. AI SYSTEM BUILDER */}
      <Section
        id="system-builder"
        title="AI System Builder (Rule-Engine Plan & Approval Ledger)"
        description="Creates deterministic change plans (explicitly rule-engine, never claiming LLM generation). High-risk changes require dual Super Admin review; apply records pipeline completion without unaudited runtime source mutation."
        badge={<StatusPill tone="neutral">{buildRequests.data?.requests?.length ?? '—'} requests</StatusPill>}
        right={<ActionButton onClick={buildRequests.reload}>Refresh</ActionButton>}
      >
        {buildRequests.error ? (
          <ErrorState message={buildRequests.error} onRetry={buildRequests.reload} />
        ) : null}
        {buildRequests.loading && !buildRequests.data ? <Skeleton rows={4} /> : null}
        {buildRequests.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-4" style={{ borderColor: TOKENS.border }}>
              <label className="text-xs">
                <span className="block font-semibold">Task type</span>
                <select
                  value={taskType}
                  onChange={(e) =>
                    setTaskType(e.target.value as (typeof SYSTEM_BUILDER_TASK_TYPES)[number])
                  }
                  className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                >
                  {SYSTEM_BUILDER_TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="block font-semibold">Target module</span>
                <input
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value)}
                  placeholder="e.g. visa-cases or course-finder"
                  className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                />
              </label>
              <label className="text-xs">
                <span className="block font-semibold">Priority</span>
                <select
                  value={buildPriority}
                  onChange={(e) =>
                    setBuildPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')
                  }
                  className="mt-1 min-h-[34px] w-full rounded-md border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                >
                  {['low', 'normal', 'high', 'urgent'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <ActionButton variant="primary" onClick={submitBuildRequest}>
                  Create Plan Request
                </ActionButton>
              </div>
              <label className="text-xs sm:col-span-4">
                <span className="block font-semibold">Requirement specification (min 20 chars)</span>
                <input
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Describe exact scope, authorization requirements, and verification criteria..."
                  className="mt-1 min-h-[36px] w-full rounded-md border px-2 text-xs"
                  style={{ borderColor: TOKENS.border }}
                />
              </label>
            </div>

            {buildRequests.data.requests.length === 0 ? (
              <EmptyState
                title="No system build requests yet"
                hint="Submitted module plans appear here with review and pipeline apply controls."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['Code', 'Task / Module', 'Risk', 'Status', 'Requirement', 'Workflow'].map((h) => (
                        <th key={h} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildRequests.data.requests.slice(0, 12).map((row) => (
                      <tr key={row.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5 font-mono text-[11px]">{row.code}</td>
                        <td className="px-2 py-1.5">
                          <span className="font-semibold">{row.targetModule}</span>
                          <span className="block text-[11px] text-[var(--alo-text-muted)]">{row.taskType}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <StatusPill tone={row.riskLevel === 'high' ? 'critical' : 'neutral'}>
                            {row.riskLevel}
                          </StatusPill>
                        </td>
                        <td className="px-2 py-1.5">
                          <StatusPill
                            tone={
                              row.status === 'APPROVED' || row.status === 'APPLIED'
                                ? 'ok'
                                : row.status === 'REJECTED' || row.status === 'FAILED'
                                  ? 'critical'
                                  : 'attention'
                            }
                          >
                            {row.status}
                          </StatusPill>
                        </td>
                        <td className="max-w-xs truncate px-2 py-1.5 text-[11px]" title={row.requirement}>
                          {row.requirement}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-1">
                            {['PLAN_READY', 'PLAN_REQUESTED', 'SANDBOX_VALIDATED'].includes(row.status) ? (
                              <>
                                <ActionButton
                                  variant="primary"
                                  onClick={() => reviewBuildRequest(row, 'approve')}
                                >
                                  Approve
                                </ActionButton>
                                <ActionButton
                                  variant="danger"
                                  onClick={() => reviewBuildRequest(row, 'reject')}
                                >
                                  Reject
                                </ActionButton>
                              </>
                            ) : null}
                            {row.status === 'APPROVED' ? (
                              <ActionButton onClick={() => markBuildApplied(row)}>
                                Mark Applied
                              </ActionButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Section>

      {/* D. SECURITY FORENSICS & LIVE SESSION REGISTER */}
      <Section
        id="security-forensics"
        title="Security Forensics & Live Session Register"
        description="Real login_attempts spike detection and portal_sessions register with immediate single-session revocation."
        badge={
          <StatusPill
            tone={loginForensics.data?.bruteForceSuspicion?.suspiciousIps?.length ? 'critical' : 'ok'}
          >
            {loginForensics.data?.bruteForceSuspicion?.suspiciousIps?.length ?? 0} suspicious IPs (24h)
          </StatusPill>
        }
        right={
          <div className="flex items-center gap-2">
            <select
              aria-label="Session scope"
              value={sessionScope}
              onChange={(e) => setSessionScope(e.target.value as 'active' | 'revoked' | 'all')}
              className="min-h-[32px] rounded-lg border px-2 text-xs"
              style={{ borderColor: TOKENS.border }}
            >
              <option value="active">Active sessions</option>
              <option value="revoked">Revoked sessions</option>
              <option value="all">All sessions</option>
            </select>
            <ActionButton
              onClick={() => {
                loginForensics.reload();
                liveSessions.reload();
              }}
            >
              Refresh
            </ActionButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5 space-y-2">
            {loginForensics.error ? (
              <ErrorState message={loginForensics.error} onRetry={loginForensics.reload} />
            ) : null}
            {loginForensics.loading && !loginForensics.data ? <Skeleton rows={3} /> : null}
            {loginForensics.data ? (
              <div className="rounded-xl border p-3 space-y-1" style={{ borderColor: TOKENS.border }}>
                <p className="text-xs font-semibold">Login Attempts (last 24h)</p>
                <Metric label="Total attempts" value={loginForensics.data.totals.attempts} />
                <Metric
                  label="Failed attempts"
                  value={loginForensics.data.totals.failures}
                  tone={loginForensics.data.totals.failures > 0 ? 'warning' : undefined}
                />
                <Metric label="Active sessions" value={loginForensics.data.totals.activeSessions} />
                <p className="pt-1 text-[11px] text-[var(--alo-text-muted)]">
                  {loginForensics.data.bruteForceSuspicion.note}
                </p>
              </div>
            ) : null}
          </div>

          <div className="xl:col-span-7">
            {liveSessions.error ? (
              <ErrorState message={liveSessions.error} onRetry={liveSessions.reload} />
            ) : null}
            {liveSessions.loading && !liveSessions.data ? <Skeleton rows={3} /> : null}
            {liveSessions.data && liveSessions.data.sessions.length === 0 ? (
              <EmptyState title="No sessions in this scope" />
            ) : null}
            {liveSessions.data?.sessions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['User', 'Role', 'IP / Device', 'Expires', 'Action'].map((h) => (
                        <th key={h} className="px-2 py-1.5 font-semibold text-[var(--alo-text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveSessions.data.sessions.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5">
                          <span className="font-semibold">{s.userName || s.userId.slice(0, 8)}</span>
                          {s.isActingAs ? (
                            <span className="ml-1">
                              <StatusPill tone="attention">acting-as</StatusPill>
                            </span>
                          ) : null}
                          <span className="block text-[11px] text-[var(--alo-text-muted)]">{s.userEmail}</span>
                        </td>
                        <td className="px-2 py-1.5 text-[11px]">{s.userRole || '—'}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          {s.ipAddress || '—'} · {s.deviceName.slice(0, 24)}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          {new Date(s.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-1.5">
                          {!s.revokedAt ? (
                            <ActionButton
                              variant="danger"
                              onClick={() => revokeSingleSession(s.id, s.userEmail || s.userId)}
                            >
                              Revoke
                            </ActionButton>
                          ) : (
                            <StatusPill tone="neutral">revoked</StatusPill>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {/* E. ACTING-AS FORENSICS, RBAC ROLLBACK & MAINTENANCE MODE */}
      <Section
        id="acting-as-forensics"
        title="Acting-As Action Log · RBAC Rollback · Maintenance Mode"
        description="Every mutation performed during an Acting-As session, restorable permission override snapshots, and the audited platform maintenance switch."
        badge={
          <StatusPill tone="neutral">
            {actingAsLog.data?.totals?.actions ?? 0} acting-as actions
          </StatusPill>
        }
        right={
          <ActionButton
            onClick={() => {
              actingAsLog.reload();
              rollbackList.reload();
              maintenance.reload();
            }}
          >
            Refresh
          </ActionButton>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Acting-As Log */}
          <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: TOKENS.border }}>
            <p className="text-xs font-semibold">Acting-As Session Forensics</p>
            {actingAsLog.error ? (
              <ErrorState message={actingAsLog.error} onRetry={actingAsLog.reload} />
            ) : actingAsLog.loading && !actingAsLog.data ? (
              <Skeleton rows={2} />
            ) : !actingAsLog.data?.sessions?.length ? (
              <p className="text-[11px] text-[var(--alo-text-muted)]">
                No audited mutations recorded under Acting-As sessions yet.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {actingAsLog.data.sessions.slice(0, 6).map((sess) => (
                  <li key={sess.sessionId} className="rounded-lg border p-2" style={{ borderColor: TOKENS.border }}>
                    <p className="font-semibold">
                      {sess.actingAsRole || 'EMPLOYEE'} · {sess.actingAsUser || sess.sessionId.slice(0, 10)}
                    </p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      {sess.count} action(s) · Last {new Date(sess.lastAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RBAC Rollback */}
          <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: TOKENS.border }}>
            <p className="text-xs font-semibold">RBAC Override Rollback Snapshots</p>
            {rollbackList.error ? (
              <ErrorState message={rollbackList.error} onRetry={rollbackList.reload} />
            ) : rollbackList.loading && !rollbackList.data ? (
              <Skeleton rows={2} />
            ) : rollbackEntries.length === 0 ? (
              <p className="text-[11px] text-[var(--alo-text-muted)]">
                No per-user permission override snapshots available to roll back.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {rollbackEntries.slice(0, 5).map((snap) => (
                  <li
                    key={snap.auditId}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2"
                    style={{ borderColor: TOKENS.border }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{snap.action}</p>
                      <p className="truncate text-[11px] text-[var(--alo-text-muted)]">
                        User {snap.targetUserId.slice(0, 10)} · {new Date(snap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ActionButton onClick={() => rollbackPermission(snap.auditId, snap.targetUserId)}>
                      Rollback
                    </ActionButton>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Maintenance Switch */}
          <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: TOKENS.border }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Maintenance Mode Switch</p>
              <StatusPill tone={maintenance.data?.enabled ? 'critical' : 'ok'}>
                {maintenance.data?.enabled ? 'ENABLED' : 'LIVE'}
              </StatusPill>
            </div>
            <input
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder={maintenance.data?.message || 'Optional maintenance banner message...'}
              className="min-h-[34px] w-full rounded-md border px-2 text-xs"
              style={{ borderColor: TOKENS.border }}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {maintenance.data?.enabled ? (
                <ActionButton variant="primary" onClick={() => toggleMaintenance(false)}>
                  Disable Maintenance Mode
                </ActionButton>
              ) : (
                <ActionButton variant="danger" onClick={() => toggleMaintenance(true)}>
                  Enable Maintenance Mode
                </ActionButton>
              )}
            </div>
            {maintenance.data?.note ? (
              <p className="text-[11px] text-[var(--alo-text-muted)]">{maintenance.data.note}</p>
            ) : null}
          </div>
        </div>
      </Section>
    </>
  );
}
