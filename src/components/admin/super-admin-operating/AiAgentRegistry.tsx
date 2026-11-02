'use client';

// ============================================================
// ALO EDUCATION — AI AGENT REGISTRY (2000 PROTECTED LOGICAL AGENTS)
//
// Renders the addressable roster returned by
// GET /api/super-admin/ai/agents/registry:
//   40 departments × 50 micro-agents = 2,000 logical agent codes.
//
// Truth rules enforced here, not hidden in prose:
//   • a logical agent with no `ai_agents` row shows NOT_MATERIALISED;
//   • counts come from the API, never from the definition alone;
//   • no "active" claim is made for an agent that has no persisted row.
// ============================================================

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface DepartmentRow {
  key: string;
  name: string;
  logicalAgents: number;
  persistedAgents: number;
}

interface AgentRow {
  code: string;
  department: string;
  departmentName: string;
  index: number;
  name: string;
  status: string;
  persisted: boolean;
  jobsProcessed: number;
  pendingApprovals: number;
  lastRunAt: string | null;
  protectionMode: 'protected';
}

interface RosterResponse {
  success: true;
  clusterName: string;
  totalLogicalAgents: number;
  totalPersistedAgents: number;
  department: string | null;
  search: string;
  page: number;
  pageSize: number;
  total: number;
  agents: AgentRow[];
  departments: DepartmentRow[];
}

interface PolicyResponse {
  success: true;
  policies: string[];
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'ok',
  RUNNING: 'info',
  PAUSED: 'attention',
  WAITING_APPROVAL: 'attention',
  TRAINING_FROM_APPROVED_DATA: 'info',
  FAILED: 'critical',
  BLOCKED_BY_POLICY: 'critical',
  COMPLETED: 'ok',
  ARCHIVED: 'neutral',
  NOT_MATERIALISED: 'unknown',
};

const PAGE_SIZE = 50;

export function AiAgentRegistry({ compact = false }: { compact?: boolean }) {
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RosterResponse | null>(null);
  const [policies, setPolicies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (department) params.set('department', department);
      if (appliedSearch) params.set('search', appliedSearch);

      const [rosterResponse, agentsResponse] = await Promise.all([
        fetch(`/api/super-admin/ai/agents/registry?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/super-admin/ai/agents', { credentials: 'same-origin', cache: 'no-store' }),
      ]);

      const rosterPayload = await rosterResponse.json().catch(() => null);
      if (!rosterResponse.ok || !rosterPayload || rosterPayload.success === false) {
        throw new Error(rosterPayload?.error || `Registry request failed (${rosterResponse.status})`);
      }
      setData(rosterPayload as RosterResponse);

      const agentsPayload = await agentsResponse.json().catch(() => null) as PolicyResponse | null;
      if (agentsResponse.ok && agentsPayload?.policies) setPolicies(agentsPayload.policies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Agent registry is unavailable.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [department, appliedSearch, page]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const departments = data?.departments || [];
  const activeDepartment = departments.find((row) => row.key === department);

  const summary = useMemo(() => {
    const rows = data?.agents || [];
    const count = (status: string) => rows.filter((row) => row.status === status).length;
    return {
      inView: rows.length,
      live: rows.filter((row) => row.persisted).length,
      running: count('RUNNING'),
      waiting: count('WAITING_APPROVAL'),
      failed: count('FAILED'),
      materialisedTotal: data?.totalPersistedAgents ?? 0,
    };
  }, [data]);

  return (
    <Section
      id="agents"
      title={data?.clusterName || 'ALO 2000 Protected Self-Learning Agent Network'}
      description={`40 departments × 50 micro-agents = ${(data?.totalLogicalAgents ?? 2000).toLocaleString()} logical agent codes. A code with no ai_agents row is shown as NOT_MATERIALISED; run \`npx tsx prisma/seed-super-admin-agent-network.ts\` against the live database to materialise them.`}
      badge={<StatusPill tone="info">protected mode</StatusPill>}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={department}
            onChange={(event) => { setDepartment(event.target.value); setPage(1); }}
            className="min-h-[36px] rounded-lg border px-2 text-xs"
            style={{ borderColor: TOKENS.border }}
            aria-label="Filter by department"
          >
            <option value="">All 40 departments</option>
            {departments.map((row) => (
              <option key={row.key} value={row.key}>{row.name}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { setAppliedSearch(search.trim()); setPage(1); }
            }}
            placeholder="Agent code or name"
            className="min-h-[36px] w-44 rounded-lg border px-2 text-xs"
            style={{ borderColor: TOKENS.border }}
            aria-label="Search agents"
          />
          <ActionButton onClick={() => { setAppliedSearch(search.trim()); setPage(1); }}>Search</ActionButton>
          <ActionButton onClick={() => void load()}>Refresh</ActionButton>
        </div>
      }
    >
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {loading && !data ? <Skeleton rows={6} /> : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Logical agents', value: data.totalLogicalAgents.toLocaleString() },
              { label: 'Materialised', value: summary.materialisedTotal.toLocaleString() },
              { label: 'In this view', value: summary.inView.toLocaleString() },
              { label: 'Running', value: summary.running },
              { label: 'Waiting approval', value: summary.waiting },
              { label: 'Failed', value: summary.failed },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border p-2" style={{ borderColor: TOKENS.border }}>
                <p className="text-[11px] uppercase tracking-wide text-[var(--alo-text-muted)]">{card.label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">{card.value}</p>
              </div>
            ))}
          </div>

          {activeDepartment ? (
            <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">
              {activeDepartment.name} · {activeDepartment.persistedAgents}/{activeDepartment.logicalAgents} codes materialised.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-4 xl:grid-cols-8">
              {departments.slice(0, 40).map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => { setDepartment(row.key); setPage(1); }}
                  className="truncate rounded-md border px-1.5 py-1 text-left hover:brightness-95"
                  style={{ borderColor: TOKENS.border }}
                  title={`${row.name} — ${row.persistedAgents}/${row.logicalAgents} materialised`}
                >
                  <span className="block truncate font-semibold">{row.name.replace(' Agents', '')}</span>
                  <span className="text-[var(--alo-text-muted)]">{row.persistedAgents}/{row.logicalAgents}</span>
                </button>
              ))}
            </div>
          )}

          {data.agents.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No agent codes matched" hint="Clear the search or choose another department." />
            </div>
          ) : (
            <>
              <div className="mt-3 hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: TOKENS.border }}>
                      {['Agent code', 'Agent', 'Department', 'Status', 'Jobs', 'Pending approvals', 'Last run'].map((heading) => (
                        <th key={heading} className="px-2 py-2 font-semibold text-[var(--alo-text-muted)]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.agents.map((agent) => (
                      <tr key={agent.code} className="border-b" style={{ borderColor: TOKENS.border }}>
                        <td className="px-2 py-1.5 font-mono text-[11px] font-semibold">{agent.code}</td>
                        <td className="px-2 py-1.5">{agent.name}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">{agent.departmentName}</td>
                        <td className="px-2 py-1.5">
                          <StatusPill tone={STATUS_TONE[agent.status] || 'neutral'}>{agent.status.replace(/_/g, ' ')}</StatusPill>
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{agent.jobsProcessed}</td>
                        <td className="px-2 py-1.5 tabular-nums">{agent.pendingApprovals}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 space-y-2 lg:hidden">
                {data.agents.map((agent) => (
                  <div key={agent.code} className="rounded-xl border p-2" style={{ borderColor: TOKENS.border }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[11px] font-semibold">{agent.code}</p>
                      <StatusPill tone={STATUS_TONE[agent.status] || 'neutral'}>{agent.status.replace(/_/g, ' ')}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs">{agent.name}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">{agent.departmentName}</p>
                    <div className="mt-1">
                      <Metric label="Jobs" value={agent.jobsProcessed} />
                      <Metric label="Pending approvals" value={agent.pendingApprovals} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--alo-text-muted)]">
                  Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()} agent codes
                </span>
                <div className="flex items-center gap-1">
                  <ActionButton onClick={() => setPage(1)} disabled={page <= 1}>First</ActionButton>
                  <ActionButton onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</ActionButton>
                  <span className="px-2 font-semibold tabular-nums">{data.page} / {totalPages}</span>
                  <ActionButton onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</ActionButton>
                  <ActionButton onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Last</ActionButton>
                </div>
              </div>
            </>
          )}

          {!compact && policies.length ? (
            <details className="mt-3" open>
              <summary className="cursor-pointer text-xs font-semibold" style={{ color: TOKENS.primary }}>
                Agent protection policies ({policies.length}) — enforced server-side
              </summary>
              <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2">
                {policies.map((policy) => <li key={policy}>• {policy}</li>)}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}
    </Section>
  );
}

export default AiAgentRegistry;
