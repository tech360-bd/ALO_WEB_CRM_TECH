'use client';

// ============================================================
// ALO EDUCATION — ROLE & PERMISSION MATRIX (REAL RBAC CONTROL)
//
// Replaces the previous hardcoded permission grid (which rendered
// `DEFAULT_PERMS` and a "Save" button that only set local state) with a
// control surface driven entirely by the server:
//
//   GET   /api/super-admin/permissions                → matrix source of truth
//   GET   /api/super-admin/roles                       → role inventory
//   PATCH /api/super-admin/roles/{id}                  → replace a role's grants
//   POST  /api/super-admin/roles                       → create / clone a role
//   GET   /api/super-admin/permission-groups           → 24 permission groups
//   POST  /api/super-admin/permission-groups           → assign / revoke / save
//   GET   /api/super-admin/permissions/temporary       → time-boxed grants
//   POST  /api/super-admin/permissions/temporary       → grant (max 30 days)
//   GET   /api/super-admin/permissions/rollback         → reversible changes
//   POST  /api/super-admin/permissions/rollback         → restore one
//
// Every mutation carries a written reason and is audited server-side. No
// permission is ever changed by this component without the API confirming it.
// ============================================================

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  Section,
  Skeleton,
  StatusPill,
  TOKENS,
} from './primitives';

// ── Contracts ───────────────────────────────────────────────

interface RoleRef { id: string; name: string; label: string }

interface MatrixPermission {
  id: string;
  feature: string;
  action: string;
  description: string;
  roleGrants: Record<string, boolean>;
}

interface MatrixModule { module: string; permissions: MatrixPermission[] }

interface MatrixResponse {
  success: true;
  roles: RoleRef[];
  modules: MatrixModule[];
  totals: { permissions: number; roles: number; grants: number };
}

interface RoleSummary extends RoleRef {
  description: string;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  modules: string[];
}

interface RolesResponse {
  success: true;
  roles: RoleSummary[];
  totals: { roles: number; permissions: number; users: number };
  missingSpecRoles: string[];
}

interface GroupGrant {
  id: string;
  ownerType: string;
  ownerId: string;
  expiresAt: string | null;
  expired: boolean;
  isActive: boolean;
}

interface GroupView {
  key: string;
  name: string;
  description: string;
  department: string;
  riskLevel: 'standard' | 'sensitive' | 'critical';
  permissionCount: number;
  persisted: boolean;
  grants: GroupGrant[];
}

interface GroupsResponse {
  success: true;
  groups: GroupView[];
  totals: { groups: number; grants: number };
}

interface EmployeeOption {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  role: string;
}

interface EmployeesResponse {
  success: true;
  employees: EmployeeOption[];
}

interface TemporaryGrant {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  featureKey: string;
  action: string;
  scopeType: string;
  reason: string;
  endDate: string;
  expiresAt: string;
  isActive: boolean;
  effectiveNow: boolean;
}

interface TemporaryResponse {
  success: true;
  maxDays: number;
  grants: TemporaryGrant[];
}

interface RollbackChange {
  auditId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  reason: string;
  hasSnapshot: boolean;
}

interface RollbackResponse {
  success: true;
  changes: RollbackChange[];
}

type Tab = 'matrix' | 'roles' | 'groups' | 'temporary' | 'rollback';

interface ReasonRequest {
  title: string;
  description: string;
  confirmLabel: string;
  minChars: number;
  danger?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}

// ── Shared reason dialog ────────────────────────────────────

function ReasonDialog({ request, onClose }: { request: ReasonRequest | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setReason(''); setError(null); setBusy(false); }, [request]);
  if (!request) return null;

  const minimum = request.minChars;
  const submit = async () => {
    if (reason.trim().length < minimum) {
      setError(`A reason of at least ${minimum} characters is required.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await request.onConfirm(reason.trim());
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The change could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold" style={{ color: TOKENS.text }}>{request.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--alo-text-muted)]">{request.description}</p>
        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]" htmlFor="rbac-reason">
          Reason (written to the audit log)
        </label>
        <textarea
          id="rbac-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: TOKENS.border }}
          placeholder="e.g. Add marketing follow-up tasks to counselors for the January intake"
        />
        {error ? <p className="mt-2 text-xs font-semibold" style={{ color: TOKENS.danger }}>{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <ActionButton onClick={onClose} disabled={busy}>Cancel</ActionButton>
          <ActionButton variant={request.danger ? 'danger' : 'primary'} onClick={() => void submit()} disabled={busy}>
            {busy ? 'Saving…' : request.confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ── Data hook ───────────────────────────────────────────────

function useJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || payload.success === false) {
        throw new Error(payload?.error || `Request failed (${response.status})`);
      }
      setData(payload as T);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Request failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load };
}

async function mutateJson<T>(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

const RISK_TONE: Record<string, string> = { standard: 'ok', sensitive: 'attention', critical: 'critical' };

// ── Component ───────────────────────────────────────────────

export function RolePermissionMatrix() {
  const [tab, setTab] = useState<Tab>('matrix');
  const [dialog, setDialog] = useState<ReasonRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const matrix = useJson<MatrixResponse>('/api/super-admin/permissions');
  const roles = useJson<RolesResponse>('/api/super-admin/roles');
  const groups = useJson<GroupsResponse>('/api/super-admin/permission-groups');
  const temporary = useJson<TemporaryResponse>('/api/super-admin/permissions/temporary');
  const rollback = useJson<RollbackResponse>('/api/super-admin/permissions/rollback');
  const employees = useJson<EmployeesResponse>('/api/super-admin/employees');

  const roleList = useMemo(() => matrix.data?.roles || [], [matrix.data]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!selectedRoleId && roleList.length) setSelectedRoleId(roleList[0].id);
  }, [roleList, selectedRoleId]);

  useEffect(() => {
    if (!matrix.data || !selectedRoleId) return;
    const next = new Set<string>();
    for (const moduleRow of matrix.data.modules) {
      for (const permission of moduleRow.permissions) {
        if (permission.roleGrants[selectedRoleId]) next.add(permission.id);
      }
    }
    setDraft(next);
    setDirty(false);
  }, [matrix.data, selectedRoleId]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 6000);
  };

  const togglePermission = (permissionId: string) => {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
    setDirty(true);
  };

  const selectedRole = roleList.find((role) => role.id === selectedRoleId) || null;
  const selectedRoleSummary = roles.data?.roles.find((role) => role.id === selectedRoleId) || null;

  const saveRolePermissions = () => setDialog({
    title: `Save ${draft.size} permission(s) for ${selectedRole?.label || selectedRole?.name}?`,
    description:
      'This replaces the complete permission set for the role. Every member of the role is affected immediately. '
      + 'The before/after sets are written to the audit log and can be rolled back from the Rollback tab.',
    confirmLabel: 'Save permissions',
    minChars: 8,
    danger: (selectedRoleSummary?.userCount || 0) > 25,
    onConfirm: async (reason) => {
      await mutateJson(`/api/super-admin/roles/${encodeURIComponent(selectedRoleId)}`, 'PATCH', {
        permissionIds: [...draft],
        reason,
      });
      flash(`Permissions saved for ${selectedRole?.label || selectedRole?.name}.`);
      await Promise.all([matrix.reload(), roles.reload(), rollback.reload()]);
      setDirty(false);
    },
  });

  // ── Roles tab ─────────────────────────────────────────────
  const [newRole, setNewRole] = useState({ name: '', label: '', description: '' });
  const createRole = () => setDialog({
    title: `Create role ${newRole.name || '(unnamed)'}?`,
    description: 'The role starts with no permissions. Assign permissions from the Matrix tab afterwards.',
    confirmLabel: 'Create role',
    minChars: 8,
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/roles', 'POST', {
        action: 'create',
        name: newRole.name.trim(),
        label: newRole.label.trim(),
        description: newRole.description.trim(),
        permissionIds: [],
        reason,
      });
      flash(`Role ${newRole.name} created.`);
      setNewRole({ name: '', label: '', description: '' });
      await Promise.all([roles.reload(), matrix.reload()]);
    },
  });

  const cloneRole = (role: RoleSummary) => setDialog({
    title: `Clone ${role.label}?`,
    description: `A new custom role is created with the same ${role.permissionCount} permissions as ${role.name}.`,
    confirmLabel: 'Clone role',
    minChars: 8,
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/roles', 'POST', {
        action: 'clone',
        sourceRoleId: role.id,
        name: `${role.name}_COPY`.slice(0, 60),
        label: `${role.label} (copy)`.slice(0, 120),
        description: `Cloned from ${role.name}.`,
        reason,
      });
      flash(`Role cloned from ${role.label}.`);
      await Promise.all([roles.reload(), matrix.reload()]);
    },
  });

  // ── Groups tab ────────────────────────────────────────────
  const [groupOwner, setGroupOwner] = useState<{ roleId: string; employeeUserId: string; days: string }>({
    roleId: '',
    employeeUserId: '',
    days: '',
  });

  const assignGroup = (group: GroupView, ownerType: 'ROLE' | 'USER', ownerId: string) => setDialog({
    title: `Assign “${group.name}” to this ${ownerType === 'ROLE' ? 'role' : 'employee'}?`,
    description: group.riskLevel === 'critical'
      ? 'CRITICAL bundle: it includes sensitive or destructive permissions. The assignment is audited and expires if you set a window.'
      : `Adds ${group.permissionCount} permission(s). The assignment is audited.`,
    confirmLabel: 'Assign group',
    minChars: 8,
    danger: group.riskLevel === 'critical',
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/permission-groups', 'POST', {
        action: 'assign',
        groupKey: group.key,
        ownerType,
        ownerId,
        ...(groupOwner.days ? { expiresInDays: Number(groupOwner.days) } : {}),
        reason,
      });
      flash(`“${group.name}” assigned.`);
      await Promise.all([groups.reload(), rollback.reload()]);
    },
  });

  const revokeGrant = (group: GroupView, grant: GroupGrant) => setDialog({
    title: `Revoke “${group.name}” from this ${grant.ownerType === 'ROLE' ? 'role' : 'employee'}?`,
    description: 'The grant is deactivated (never deleted) and the revocation is audited.',
    confirmLabel: 'Revoke grant',
    minChars: 8,
    danger: true,
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/permission-groups', 'POST', {
        action: 'revoke',
        grantId: grant.id,
        reason,
      });
      flash(`“${group.name}” revoked.`);
      await Promise.all([groups.reload(), rollback.reload()]);
    },
  });

  // ── Temporary tab ─────────────────────────────────────────
  const [tempForm, setTempForm] = useState({
    employeeId: '',
    featureKey: '',
    action: 'view',
    scopeType: 'assigned',
    days: '7',
  });

  const grantTemporary = () => setDialog({
    title: 'Grant a temporary permission?',
    description:
      'The grant carries an expiry date that the server evaluates on every request. '
      + `The maximum window is ${temporary.data?.maxDays ?? 30} days.`,
    confirmLabel: 'Grant permission',
    minChars: 8,
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/permissions/temporary', 'POST', {
        employeeId: tempForm.employeeId,
        featureKey: tempForm.featureKey.trim(),
        action: tempForm.action,
        scopeType: tempForm.scopeType,
        scopeId: '',
        days: Number(tempForm.days),
        reason,
      });
      flash('Temporary permission granted.');
      await Promise.all([temporary.reload(), rollback.reload()]);
    },
  });

  // ── Rollback tab ──────────────────────────────────────────
  const revertChange = (change: RollbackChange) => setDialog({
    title: `Revert ${change.action}?`,
    description:
      'The previous role/permission state stored in the audit row is restored and a new audit row names the change it reverted. Nothing is deleted.',
    confirmLabel: 'Revert change',
    minChars: 8,
    danger: true,
    onConfirm: async (reason) => {
      await mutateJson('/api/super-admin/permissions/rollback', 'POST', { auditId: change.auditId, reason });
      flash('Change reverted.');
      await Promise.all([matrix.reload(), roles.reload(), groups.reload(), rollback.reload()]);
    },
  });

  const employeesWithLogin = (employees.data?.employees || []).filter((row) => Boolean(row.userId));

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'matrix', label: `Matrix (${matrix.data?.totals?.permissions ?? '—'})` },
    { key: 'roles', label: `Roles (${roles.data?.totals?.roles ?? '—'})` },
    { key: 'groups', label: `Permission groups (${groups.data?.totals?.groups ?? '—'})` },
    { key: 'temporary', label: `Temporary grants (${temporary.data?.grants?.length ?? '—'})` },
    { key: 'rollback', label: `Rollback (${rollback.data?.changes?.length ?? '—'})` },
  ];

  return (
    <>
      <Section
        id="rbac"
        title="Role & Permission Matrix"
        description="Live RBAC from portal_roles / portal_role_permissions / permission_groups. Every change requires a written reason, is audited in the same transaction, and can be rolled back."
        badge={<StatusPill tone="info">{roles.data?.totals?.roles ?? '—'} roles · {matrix.data?.totals?.permissions ?? '—'} permissions</StatusPill>}
        right={<ActionButton onClick={() => { void matrix.reload(); void roles.reload(); void groups.reload(); }}>Refresh</ActionButton>}
      >
        <div className="mb-3 flex flex-wrap gap-1">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className="min-h-[34px] rounded-lg border px-3 text-[11px] font-semibold"
              style={{
                borderColor: tab === entry.key ? TOKENS.primary : TOKENS.border,
                backgroundColor: tab === entry.key ? '#EFF6FF' : '#FFFFFF',
                color: tab === entry.key ? TOKENS.primary : TOKENS.text,
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="mb-2 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: TOKENS.success, backgroundColor: '#ECFDF5', color: '#047857' }}>
            {notice}
          </div>
        ) : null}

        {/* MATRIX */}
        {tab === 'matrix' ? (
          <>
            {matrix.error ? <ErrorState message={matrix.error} onRetry={() => void matrix.reload()} /> : null}
            {matrix.loading && !matrix.data ? <Skeleton rows={6} /> : null}
            {matrix.data ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]" htmlFor="role-select">
                    Editing role
                  </label>
                  <select
                    id="role-select"
                    value={selectedRoleId}
                    onChange={(event) => setSelectedRoleId(event.target.value)}
                    className="min-h-[36px] rounded-lg border px-2 text-xs"
                    style={{ borderColor: TOKENS.border }}
                  >
                    {roleList.map((role) => (
                      <option key={role.id} value={role.id}>{role.label} ({role.name})</option>
                    ))}
                  </select>
                  <StatusPill tone="neutral">{draft.size} granted</StatusPill>
                  {selectedRoleSummary ? <StatusPill tone="info">{selectedRoleSummary.userCount} users</StatusPill> : null}
                  {dirty ? <StatusPill tone="attention">unsaved changes</StatusPill> : null}
                  <ActionButton variant="primary" onClick={() => void saveRolePermissions()} disabled={!dirty || !selectedRoleId}>
                    Save permissions
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      if (!matrix.data || !selectedRoleId) return;
                      const next = new Set<string>();
                      for (const moduleRow of matrix.data.modules) {
                        for (const permission of moduleRow.permissions) {
                          if (permission.roleGrants[selectedRoleId]) next.add(permission.id);
                        }
                      }
                      setDraft(next);
                      setDirty(false);
                    }}
                    disabled={!dirty}
                  >
                    Discard
                  </ActionButton>
                </div>

                <div className="space-y-3">
                  {matrix.data.modules.map((moduleRow) => {
                    const grantedInModule = moduleRow.permissions.filter((permission) => draft.has(permission.id)).length;
                    return (
                      <details key={moduleRow.module} className="rounded-xl border p-2" style={{ borderColor: TOKENS.border }} open>
                        <summary className="cursor-pointer text-xs font-semibold">
                          {moduleRow.module}
                          <span className="ml-2 font-normal text-[var(--alo-text-muted)]">
                            {grantedInModule}/{moduleRow.permissions.length} granted
                          </span>
                        </summary>
                        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
                          {moduleRow.permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start gap-2 rounded-lg border px-2 py-1.5 text-[11px]"
                              style={{ borderColor: draft.has(permission.id) ? TOKENS.primary : TOKENS.border }}
                            >
                              <input
                                type="checkbox"
                                checked={draft.has(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="block font-semibold">{permission.feature}.{permission.action}</span>
                                <span className="block truncate text-[var(--alo-text-muted)]" title={permission.description}>
                                  {permission.description || '—'}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
                {matrix.data.modules.length === 0 ? (
                  <EmptyState
                    title="No permissions are seeded yet"
                    hint="Run the RBAC seed (prisma/seed-rbac.ts) against the target database to populate portal_permissions."
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {/* ROLES */}
        {tab === 'roles' ? (
          <>
            {roles.error ? <ErrorState message={roles.error} onRetry={() => void roles.reload()} /> : null}
            {roles.loading && !roles.data ? <Skeleton rows={5} /> : null}
            {roles.data ? (
              <>
                {roles.data.missingSpecRoles.length ? (
                  <p className="mb-2 rounded-lg border border-dashed px-3 py-2 text-[11px]" style={{ borderColor: TOKENS.warning, color: '#B45309' }}>
                    Roles required by the specification but absent from the database: {roles.data.missingSpecRoles.join(', ')}.
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                        {['Role', 'Key', 'Type', 'Permissions', 'Users', 'Modules', 'Actions'].map((heading) => (
                          <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.data.roles.map((role) => (
                        <tr key={role.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                          <td className="px-2 py-1.5 font-semibold">{role.label}</td>
                          <td className="px-2 py-1.5 font-mono text-[11px]">{role.name}</td>
                          <td className="px-2 py-1.5">{role.isSystem ? <StatusPill tone="neutral">system</StatusPill> : <StatusPill tone="info">custom</StatusPill>}</td>
                          <td className="px-2 py-1.5 tabular-nums">{role.permissionCount}</td>
                          <td className="px-2 py-1.5 tabular-nums">{role.userCount}</td>
                          <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">{role.modules.slice(0, 5).join(', ') || '—'}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              <ActionButton onClick={() => { setSelectedRoleId(role.id); setTab('matrix'); }}>Edit permissions</ActionButton>
                              <ActionButton onClick={() => cloneRole(role)}>Clone</ActionButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
                  <p className="text-xs font-semibold">Create a custom role</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      value={newRole.name}
                      onChange={(event) => setNewRole((current) => ({ ...current, name: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
                      placeholder="COUNSELOR_UK"
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Role key"
                    />
                    <input
                      value={newRole.label}
                      onChange={(event) => setNewRole((current) => ({ ...current, label: event.target.value }))}
                      placeholder="UK Country Counselor"
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Role label"
                    />
                    <input
                      value={newRole.description}
                      onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Country-specific counselor scope"
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Role description"
                    />
                  </div>
                  <div className="mt-2">
                    <ActionButton
                      variant="primary"
                      onClick={() => void createRole()}
                      disabled={newRole.name.trim().length < 2 || newRole.label.trim().length < 2}
                    >
                      Create role
                    </ActionButton>
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {/* GROUPS */}
        {tab === 'groups' ? (
          <>
            {groups.error ? <ErrorState message={groups.error} onRetry={() => void groups.reload()} /> : null}
            {groups.loading && !groups.data ? <Skeleton rows={5} /> : null}
            {groups.data ? (
              <>
                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="text-[11px]">
                    <span className="font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Assign to role</span>
                    <select
                      value={groupOwner.roleId}
                      onChange={(event) => setGroupOwner((current) => ({ ...current, roleId: event.target.value }))}
                      className="mt-1 min-h-[36px] w-full rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                    >
                      <option value="">Select role…</option>
                      {roleList.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px]">
                    <span className="font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Assign to employee</span>
                    <select
                      value={groupOwner.employeeUserId}
                      onChange={(event) => setGroupOwner((current) => ({ ...current, employeeUserId: event.target.value }))}
                      className="mt-1 min-h-[36px] w-full rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                    >
                      <option value="">Select employee…</option>
                      {employeesWithLogin.map((employee) => (
                        <option key={employee.userId} value={employee.userId}>{employee.name} · {employee.role}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[11px]">
                    <span className="font-semibold uppercase tracking-wide text-[var(--alo-text-muted)]">Expires in days (optional)</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={groupOwner.days}
                      onChange={(event) => setGroupOwner((current) => ({ ...current, days: event.target.value }))}
                      className="mt-1 min-h-[36px] w-full rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {groups.data.groups.map((group) => (
                    <div key={group.key} className="rounded-xl border p-2" style={{ borderColor: TOKENS.border }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-xs font-semibold" title={group.key}>{group.name}</p>
                        <StatusPill tone={RISK_TONE[group.riskLevel] || 'neutral'}>{group.riskLevel}</StatusPill>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--alo-text-muted)]">{group.description || '—'}</p>
                      <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                        {group.permissionCount} permissions · {group.department || 'unscoped'} · {group.persisted ? 'persisted' : 'definition only'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <ActionButton
                          onClick={() => void assignGroup(group, 'ROLE', groupOwner.roleId)}
                          disabled={!groupOwner.roleId}
                          title={groupOwner.roleId ? 'Assign this bundle to the selected role' : 'Choose a role first'}
                        >
                          → Role
                        </ActionButton>
                        <ActionButton
                          onClick={() => void assignGroup(group, 'USER', groupOwner.employeeUserId)}
                          disabled={!groupOwner.employeeUserId}
                          title={groupOwner.employeeUserId ? 'Assign this bundle to the selected employee' : 'Choose an employee first'}
                        >
                          → Employee
                        </ActionButton>
                      </div>
                      {group.grants.length ? (
                        <ul className="mt-2 space-Y-1">
                          {group.grants.map((grant) => (
                            <li key={grant.id} className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="min-w-0 truncate">
                                {grant.ownerType} · {grant.ownerId.slice(0, 10)}…
                                {grant.expiresAt ? ` · expires ${new Date(grant.expiresAt).toLocaleDateString()}` : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <StatusPill tone={grant.expired || !grant.isActive ? 'critical' : 'ok'}>
                                  {grant.expired ? 'expired' : grant.isActive ? 'active' : 'revoked'}
                                </StatusPill>
                                {grant.isActive ? (
                                  <ActionButton variant="danger" onClick={() => void revokeGrant(group, grant)}>Revoke</ActionButton>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
                {groups.data.groups.length === 0 ? (
                  <EmptyState title="No permission groups" hint="Seed the 24 specification groups, then assign them to roles or employees." />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {/* TEMPORARY */}
        {tab === 'temporary' ? (
          <>
            {temporary.error ? <ErrorState message={temporary.error} onRetry={() => void temporary.reload()} /> : null}
            {temporary.loading && !temporary.data ? <Skeleton rows={4} /> : null}
            {temporary.data ? (
              <>
                <div className="rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
                  <p className="text-xs font-semibold">Grant a time-boxed permission</p>
                  <p className="mt-0.5 text-[11px] text-[var(--alo-text-muted)]">
                    Maximum window: {temporary.data.maxDays} days. Expiry is evaluated server-side on every request.
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <select
                      value={tempForm.employeeId}
                      onChange={(event) => setTempForm((current) => ({ ...current, employeeId: event.target.value }))}
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Employee"
                    >
                      <option value="">Select employee…</option>
                      {(employees.data?.employees || []).map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.name} · {employee.role}</option>
                      ))}
                    </select>
                    <input
                      value={tempForm.featureKey}
                      onChange={(event) => setTempForm((current) => ({ ...current, featureKey: event.target.value }))}
                      placeholder="marketing.campaign"
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Feature key"
                    />
                    <select
                      value={tempForm.action}
                      onChange={(event) => setTempForm((current) => ({ ...current, action: event.target.value }))}
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Action"
                    >
                      {['view', 'create', 'update', 'approve', 'export', 'assign', 'act_as'].map((action) => (
                        <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                    <select
                      value={tempForm.scopeType}
                      onChange={(event) => setTempForm((current) => ({ ...current, scopeType: event.target.value }))}
                      className="min-h-[36px] rounded-lg border px-2 text-xs"
                      style={{ borderColor: TOKENS.border }}
                      aria-label="Scope"
                    >
                      {['own', 'assigned', 'team', 'branch', 'country', 'all'].map((scope) => (
                        <option key={scope} value={scope}>{scope}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={temporary.data.maxDays}
                        value={tempForm.days}
                        onChange={(event) => setTempForm((current) => ({ ...current, days: event.target.value }))}
                        className="min-h-[36px] w-20 rounded-lg border px-2 text-xs"
                        style={{ borderColor: TOKENS.border }}
                        aria-label="Days"
                      />
                      <ActionButton
                        variant="primary"
                        onClick={() => void grantTemporary()}
                        disabled={!tempForm.employeeId || tempForm.featureKey.trim().length < 3 || Number(tempForm.days) < 1}
                      >
                        Grant
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                        {['Employee', 'Feature', 'Action', 'Scope', 'Expires', 'State', 'Reason'].map((heading) => (
                          <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {temporary.data.grants.map((grant) => (
                        <tr key={grant.id} className="border-b" style={{ borderColor: TOKENS.border }}>
                          <td className="px-2 py-1.5">{grant.employeeName || grant.employeeId} <span className="text-[11px] text-[var(--alo-text-muted)]">{grant.employeeCode}</span></td>
                          <td className="px-2 py-1.5 font-mono text-[11px]">{grant.featureKey}</td>
                          <td className="px-2 py-1.5">{grant.action}</td>
                          <td className="px-2 py-1.5">{grant.scopeType}</td>
                          <td className="px-2 py-1.5 text-[11px]">{new Date(grant.expiresAt).toLocaleString()}</td>
                          <td className="px-2 py-1.5">
                            <StatusPill tone={grant.effectiveNow ? 'ok' : 'critical'}>
                              {grant.effectiveNow ? 'effective' : grant.isActive ? 'expired' : 'inactive'}
                            </StatusPill>
                          </td>
                          <td className="max-w-[240px] truncate px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]" title={grant.reason}>{grant.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {temporary.data.grants.length === 0 ? (
                  <div className="mt-3"><EmptyState title="No temporary grants" hint="Time-boxed grants appear here with their live expiry state." /></div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {/* ROLLBACK */}
        {tab === 'rollback' ? (
          <>
            {rollback.error ? <ErrorState message={rollback.error} onRetry={() => void rollback.reload()} /> : null}
            {rollback.loading && !rollback.data ? <Skeleton rows={5} /> : null}
            {rollback.data ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                        {['When', 'Action', 'Entity', 'Snapshot', 'Reason', 'Actions'].map((heading) => (
                          <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rollback.data.changes.map((change) => (
                        <tr key={change.auditId} className="border-b" style={{ borderColor: TOKENS.border }}>
                          <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">{new Date(change.createdAt).toLocaleString()}</td>
                          <td className="px-2 py-1.5 font-semibold">{change.action}</td>
                          <td className="px-2 py-1.5 text-[11px]">{change.entityType} · {change.entityId.slice(0, 10)}…</td>
                          <td className="px-2 py-1.5">{change.hasSnapshot ? <StatusPill tone="ok">before state</StatusPill> : <StatusPill tone="attention">no snapshot</StatusPill>}</td>
                          <td className="max-w-[260px] truncate px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]" title={change.reason}>{change.reason || '—'}</td>
                          <td className="px-2 py-1.5">
                            <ActionButton variant="danger" onClick={() => void revertChange(change)} disabled={!change.hasSnapshot}>Revert</ActionButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rollback.data.changes.length === 0 ? (
                  <EmptyState title="No RBAC changes recorded" hint="Role, permission and group changes appear here with their before-state." />
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </Section>

      <ReasonDialog request={dialog} onClose={() => setDialog(null)} />
    </>
  );
}

export default RolePermissionMatrix;
