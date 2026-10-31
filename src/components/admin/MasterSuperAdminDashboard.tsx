'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShieldCheck, Users, Key, Search, Building2, UserCheck,
  RefreshCw, AlertTriangle, ShieldAlert, Bot, CheckSquare, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import AgentRegistry from '@/components/crm/agentos/AgentRegistry';
import AICommandCenterAgent from '@/components/admin/AICommandCenterAgent';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

// ============================================================
// Types — mirror the real contracts
// ============================================================

// GET /api/admin/dashboard/metrics
interface AdminMetrics {
  activeStudents: number;
  totalLeads: number;
  totalPartners: number;
  visaCases: number;
  unreadMessages: number;
}

// GET /api/employees → Employee
interface EmployeeRow {
  id: string;
  userId?: string;
  employeeId: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  designation: string;
  role: string;
  status: string;
  isOnline: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
}

// GET /api/admin/security/lockdown
interface LockdownState {
  active: boolean;
  reason: string;
  activatedBy: string;
  activatedAt: string | null;
  deactivatedAt: string | null;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function MasterSuperAdminDashboard() {
  const router = useRouter();
  const { setView } = usePortalStore();

  const [activeTab, setActiveTab] = useState<'employees' | 'ai-command'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [metricsState, setMetricsState] = useState<LoadState>({ loading: true, error: null });

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeeState, setEmployeeState] = useState<LoadState>({ loading: true, error: null });

  const [lockdown, setLockdown] = useState<LockdownState | null>(null);
  const [lockdownReason, setLockdownReason] = useState('');
  const [lockdownBusy, setLockdownBusy] = useState(false);

  const [actingAsRole, setActingAsRole] = useState<string | null>(null);
  const [actingAsName, setActingAsName] = useState<string | null>(null);
  const [actingAsSessionId, setActingAsSessionId] = useState<string | null>(null);
  const [actingAsReason, setActingAsReason] = useState('');
  const [actingAsBusy, setActingAsBusy] = useState(false);

  const loadMetrics = useCallback(async () => {
    setMetricsState({ loading: true, error: null });
    try {
      const response = await fetch('/api/admin/dashboard/metrics');
      if (!response.ok) throw new Error(`Could not load metrics (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'Metrics are unavailable');
      setMetrics(payload.data);
      setMetricsState({ loading: false, error: null });
    } catch (error) {
      setMetrics(null);
      setMetricsState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load metrics',
      });
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmployeeState({ loading: true, error: null });
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error(`Could not load employees (HTTP ${response.status})`);
      const payload = await response.json();
      setEmployees(Array.isArray(payload?.employees) ? payload.employees : []);
      setEmployeeState({ loading: false, error: null });
    } catch (error) {
      setEmployees([]);
      setEmployeeState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load employees',
      });
    }
  }, []);

  const loadLockdown = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/security/lockdown');
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.success) setLockdown(payload.lockdown);
    } catch {
      // Lockdown state is advisory here; failure to read it must not block the page.
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
    void loadEmployees();
    void loadLockdown();
  }, [loadMetrics, loadEmployees, loadLockdown]);

  const refreshAll = async () => {
    await Promise.all([loadMetrics(), loadEmployees(), loadLockdown()]);
  };

  // Emergency lockdown is a real, audited operation: the route requires a
  // reason when activating and records the administrator who did it.
  const handleToggleLockdown = async () => {
    const activating = !lockdown?.active;
    if (activating && !lockdownReason.trim()) {
      toast.error('A reason is required to activate the emergency lockdown.');
      return;
    }
    setLockdownBusy(true);
    try {
      const response = await fetch('/api/admin/security/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: activating, reason: lockdownReason.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        toast.error(payload?.error || `Could not update lockdown (HTTP ${response.status})`);
        return;
      }
      setLockdown(payload.lockdown);
      if (activating) setLockdownReason('');
      toast[activating ? 'error' : 'success'](
        activating
          ? 'Emergency lockdown activated. Recorded in the audit trail.'
          : 'Emergency lockdown disengaged.',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update lockdown');
    } finally {
      setLockdownBusy(false);
    }
  };

  // Acting-As opens a real short-lived session and writes an audit event.
  const handleStartActingAs = async (employee: EmployeeRow) => {
    if (!actingAsReason.trim()) {
      toast.error('A reason is required before acting as another role.');
      return;
    }
    setActingAsBusy(true);
    try {
      if (!employee.userId) {
        toast.error('This employee record is not linked to a portal login; Acting-As is unavailable.');
        return;
      }
      const response = await fetch('/api/portal-auth/acting-as/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: employee.userId, reason: actingAsReason.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      const session = payload?.actingAsSession;
      if (!response.ok || !payload?.success || !session?.id) {
        toast.error(payload?.error || `Could not start acting-as session (HTTP ${response.status})`);
        return;
      }
      setActingAsRole(session.effectiveRole || employee.role);
      setActingAsName(session.effectiveName || employee.name);
      setActingAsSessionId(session.id);
      setActingAsReason('');
      toast.info(`Acting as ${session.effectiveName || employee.name}. Audited; expires at ${new Date(session.expiry).toLocaleTimeString()}.`);
      router.push('/employee/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start acting-as session');
    } finally {
      setActingAsBusy(false);
    }
  };

  const handleExitActingAs = async () => {
    setActingAsBusy(true);
    try {
      const response = await fetch('/api/portal-auth/acting-as/stop', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        toast.error(payload?.error || 'Could not end Acting-As session.');
        return;
      }
      setActingAsRole(null);
      setActingAsName(null);
      setActingAsSessionId(null);
      setActingAsBusy(false);
      toast.success('Exited acting-as mode.');
      router.replace('/super-admin/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not end Acting-As session.');
    } finally {
      setActingAsBusy(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return [employee.name, employee.employeeId, employee.designation, employee.department, employee.branch]
      .some((value) => String(value || '').toLowerCase().includes(term));
  });

  const kpis: Array<{ label: string; value: number | string }> = metrics
    ? [
      { label: 'Active students', value: metrics.activeStudents },
      { label: 'Total leads', value: metrics.totalLeads },
      { label: 'Partner organisations', value: metrics.totalPartners },
      { label: 'Visa cases', value: metrics.visaCases },
      { label: 'Unread inbound messages', value: metrics.unreadMessages },
    ]
    : [];

  return (
    <div className="bg-[var(--alo-page)]/50 min-h-screen space-y-6 p-4 font-sans text-[var(--alo-text)] lg:p-6">
      <DashboardCommunicationWidget
        role="SUPER_ADMIN"
        unreadCount={null}
        slaOverdueCount={null}
        onNavigateToInbox={() => router.push('/crm/communications/inbox')}
      />

      {/* ── ACTING-AS BANNER ── */}
      {actingAsRole && (
        <div className="flex items-center justify-between rounded-xl border border-crm-warning-border bg-[var(--alo-warning)] p-3.5 text-xs font-bold text-[var(--alo-text)] shadow-md">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[var(--alo-text)]" />
            <span>
              Acting as: <strong>{actingAsRole}</strong> ({actingAsName}) — session expires in 30 minutes
            </span>
          </div>
          <Button
 size="sm"
 className=" bg-crm-warning-bg font-semibold text-crm-warning-text border border-crm-warning-border hover:bg-[#FFF7E6]"
 onClick={() => void handleExitActingAs()}
            disabled={actingAsBusy}
          >
            Exit acting-as mode
          </Button>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 rounded-[16px] border border-[var(--alo-brand-border)] bg-[var(--alo-blue-soft)] p-5 text-[var(--alo-text)] shadow-[var(--alo-shadow-xs)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[var(--alo-cta)]" />
            <h1 className="text-xl font-extrabold tracking-tight text-white">Super Admin Control</h1>
            <Badge className="bg-[var(--alo-cta)] font-mono text-[11px] text-white">SUPER_ADMIN</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--alo-text-muted)]">
            {metrics
              ? `${metrics.activeStudents} students · ${metrics.totalLeads} leads · ${metrics.visaCases} visa cases`
              : metricsState.loading
                ? 'Loading platform counts…'
                : 'Platform counts unavailable'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--alo-text-muted)]" />
            <input
              type="text"
              placeholder="Filter employees by name, ID or department"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-8 w-48 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] pl-8 pr-3 text-xs text-white placeholder-slate-400 focus:border-[var(--alo-cta)] focus:outline-none sm:w-64"
            />
          </div>

          <Button
 variant="outline"
 size="sm"
 className=" border-[var(--alo-border)] bg-white "
 onClick={() => void refreshAll()}
          >
            <RefreshCw
              className={`mr-1 h-3.5 w-3.5 ${metricsState.loading || employeeState.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button
 size="sm"
 className={` font-bold ${
 lockdown?.active
 ? 'bg-[var(--alo-error)] text-white hover:bg-[var(--alo-error)]'
 : 'border border-[var(--alo-border)] bg-[var(--alo-page)] text-orange-400 hover:bg-[var(--alo-page)]'
 }`}
 onClick={() => setActiveTab('employees')}
          >
            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
            {lockdown?.active ? 'Lockdown ACTIVE' : 'Emergency lockdown'}
          </Button>
        </div>
      </div>

      {/* ── LOCKDOWN PANEL ── */}
      <Card className="border-[var(--alo-border)] bg-white">
        <CardHeader className="border-b border-[var(--alo-border)] pb-3">
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">Emergency lockdown</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-text-muted)]">
            Restricts non-administrator access. Activating requires a reason and is written to the
            audit trail with the administrator who did it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={lockdown?.active ? 'bg-crm-danger-bg text-crm-danger-text' : 'bg-crm-success-bg text-crm-success-text'}>
              {lockdown?.active ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
            {lockdown?.active && (
              <span className="text-xs text-[var(--alo-body)]">
                Reason: {lockdown.reason || 'Not recorded'} · activated {formatTimestamp(lockdown.activatedAt)}
              </span>
            )}
            {lockdown?.deactivatedAt && (
              <span className="text-xs text-[var(--alo-text-muted)]">
                Last disengaged {formatTimestamp(lockdown.deactivatedAt)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <Textarea
              value={lockdownReason}
              onChange={(event) => setLockdownReason(event.target.value)}
              placeholder={lockdown?.active ? 'Reason to record on disengaging (optional)' : 'Reason for activating (required)'}
              className="max-w-lg text-sm"
              rows={2}
            />
            <Button
              size="sm"
              variant={lockdown?.active ? 'outline' : 'destructive'}
              onClick={() => void handleToggleLockdown()}
              disabled={lockdownBusy}
            >
              {lockdownBusy
                ? 'Working…'
                : lockdown?.active
                  ? 'Disengage lockdown'
                  : 'Activate lockdown'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── QUICK ACTIONS ── */}
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-2">
        <Button variant="outline" size="sm" className=" border-[var(--alo-border)] bg-white " onClick={() => setActiveTab('employees')}>
          <Users className="mr-1 h-3.5 w-3.5 text-[var(--alo-brand)]" /> Employee control
        </Button>
        <Button variant="outline" size="sm" className=" border-[var(--alo-border)] bg-white " onClick={() => setActiveTab('ai-command')}>
          <Bot className="mr-1 h-3.5 w-3.5 text-[var(--alo-cta-active)]" /> AI Command Center
        </Button>
      </div>

      {/* ── KPI CARDS ── */}
      {metricsState.error && (
        <Card className="border-crm-danger-border bg-crm-danger-bg">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-crm-danger-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{metricsState.error}</p>
              <button type="button" className="mt-1 underline underline-offset-2" onClick={() => void loadMetrics()}>
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-[var(--alo-border)] bg-white shadow-2xs">
            <CardContent className="p-3.5">
              <p className="text-[11px] font-medium text-[var(--alo-text-muted)]">{kpi.label}</p>
              <p className="mt-0.5 text-xl font-bold text-[var(--alo-text)]">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
        {metricsState.loading && kpis.length === 0 && (
          <Card className="border-[var(--alo-border)] bg-white">
            <CardContent className="p-3.5 text-xs text-[var(--alo-text-muted)]">Loading counts…</CardContent>
          </Card>
        )}
      </div>

      {/* ── EMPLOYEE CONTROL ── */}
      {activeTab === 'employees' && (
        <Card className="border-[var(--alo-border)] bg-white shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--alo-border)] pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-[var(--alo-text)]">Employee control center</CardTitle>
              <CardDescription className="text-xs text-[var(--alo-text-muted)]">
                Employees on record, and the acting-as sessions available to you.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {employeeState.error && (
              <div className="flex items-start gap-2 p-4 text-sm text-crm-danger-text">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{employeeState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadEmployees()}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {employeeState.loading ? (
              <p className="py-10 text-center text-sm text-[var(--alo-text-muted)]">Loading employees…</p>
            ) : filteredEmployees.length === 0 && !employeeState.error ? (
              <p className="py-10 text-center text-sm text-[var(--alo-text-muted)]">
                {employees.length === 0
                  ? 'No employee record has been created yet.'
                  : 'No employee matches that filter.'}
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-[var(--alo-page)]">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Employee ID / Name</TableHead>
                    <TableHead className="text-xs font-semibold">Designation</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold">Branch</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Acting as</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="text-xs font-bold text-[var(--alo-text)]">
                          {employee.name || 'Unnamed employee'}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--alo-text-muted)]">{employee.employeeId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-[var(--alo-page)] text-[11px]">
                          {employee.designation || employee.role || 'Unspecified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--alo-body)]">
                        {employee.department || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--alo-body)]">
                        {employee.branch || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[11px] ${
                            employee.status === 'active'
                              ? 'bg-crm-success-bg text-crm-success-text'
                              : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'
                          }`}
                        >
                          {(employee.status || 'unknown').toUpperCase()}
                        </Badge>
                        {employee.isOnline ? (
                          <Badge className="ml-1 bg-sky-100 text-sky-700 text-[11px]">Online</Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {actingAsName === employee.name ? (
                          <span className="text-[11px] text-crm-warning-text">In session</span>
                        ) : (
                          <Button
 size="sm"
 variant="ghost"
 className="h-7 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]"
 disabled={actingAsBusy || Boolean(actingAsName)}
 onClick={() => {
                              setActingAsReason(
                                `Reviewing work as ${employee.designation || employee.role}`,
                              );
                              void handleStartActingAs(employee);
                            }}
                          >
                            Act as role
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── AI COMMAND CENTER ── */}
      {activeTab === 'ai-command' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
 size="sm"
 variant="outline"
 className=" border-[var(--alo-border)] bg-white "
 onClick={() => {
                const registry = document.getElementById('agent-registry-container');
                const console_ = document.getElementById('ai-command-container');
                if (registry && console_) {
                  const showRegistry = registry.classList.contains('hidden');
                  registry.classList.toggle('hidden', !showRegistry);
                  console_.classList.toggle('hidden', showRegistry);
                }
              }}
            >
              Toggle agent registry / ALO Admin Copilot
            </Button>
          </div>
          <div id="ai-command-container">
            <AICommandCenterAgent />
          </div>
          <div id="agent-registry-container" className="hidden">
            <AgentRegistry />
          </div>
        </div>
      )}

      <Card className="border-[var(--alo-border)] bg-white">
        <CardContent className="flex items-start gap-2 p-4 text-xs text-[var(--alo-text-muted)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            The five counts above are the only platform figures this API exposes, and each is a
            live database count. Per-department breakdowns, daily-new figures, follow-up and
            invoice queues, and an agent total are not shown because nothing on this platform
            measures them. Acting-as sessions last 30 minutes and are recorded in the audit trail.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
