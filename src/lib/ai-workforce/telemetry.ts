/**
 * ALO AI Workforce — telemetry and dashboard aggregation (§22, §25).
 *
 * Every number returned here is computed from persisted rows at call time.
 * There are no constants, no sample data and no "expected" values: when the
 * platform has not run anything yet, the counters are zero and `hasData` is
 * false.
 */
import { db } from '@/lib/db';
import { computeAutomationReport, type AutomationReport } from './automation';

export interface RunCounters {
  total: number;
  completed: number;
  failed: number;
  awaitingApproval: number;
  running: number;
  successRate: number;
  avgDurationMs: number;
  fallbackRuns: number;
}

async function runCounters(where: Record<string, unknown>): Promise<RunCounters> {
  const [grouped, aggregate, fallbackRuns] = await Promise.all([
    db.awfRun.groupBy({ by: ['status'], where, _count: { _all: true } }),
    db.awfRun.aggregate({ where, _avg: { durationMs: true }, _count: { _all: true } }),
    db.awfRun.count({ where: { ...where, fallbackUsed: true } }),
  ]);
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));
  const total = aggregate._count._all;
  const completed = byStatus.get('COMPLETED') || 0;
  const failed = byStatus.get('FAILED') || 0;
  const terminal = completed + failed;
  return {
    total,
    completed,
    failed,
    awaitingApproval: byStatus.get('AWAITING_APPROVAL') || 0,
    running: (byStatus.get('RUNNING') || 0) + (byStatus.get('QUEUED') || 0),
    successRate: terminal ? Math.round((completed / terminal) * 10000) / 100 : 0,
    avgDurationMs: Math.round(aggregate._avg.durationMs || 0),
    fallbackRuns,
  };
}

export interface DashboardSnapshot {
  agents: { total: number; byStatus: Record<string, number>; departments: number };
  registry: { tools: number; skills: number; workflows: number; activeWorkflows: number };
  runs: { allTime: RunCounters; last24h: RunCounters; last7d: RunCounters; production: RunCounters };
  tools: { calls: number; denied: number; failed: number; simulated: number; mutations: number };
  approvals: { pending: number; approved: number; consumed: number; rejected: number };
  runtimes: Array<{ runtimeKey: string; name: string; tier: number; kind: string; status: string; queueDepth: number; avgLatencyMs: number; successCount: number; failureCount: number; isPaidService: boolean }>;
  automation: AutomationReport;
  topFailures: Array<{ reason: string; count: number }>;
  recentRuns: Array<{ runCode: string; agent: string; workflow: string; status: string; mode: string; durationMs: number; createdAt: string }>;
  generatedAt: string;
}

export async function dashboardSnapshot(): Promise<DashboardSnapshot> {
  const now = Date.now();
  const since24h = new Date(now - 86_400_000);
  const since7d = new Date(now - 7 * 86_400_000);

  const [agentsByStatus, departments, tools, skills, workflows, activeWorkflows] = await Promise.all([
    db.awfAgent.groupBy({ by: ['status'], _count: { _all: true } }),
    db.awfDepartment.count({ where: { isActive: true } }),
    db.awfTool.count({ where: { status: 'ACTIVE' } }),
    db.awfSkill.count({ where: { status: 'ACTIVE' } }),
    db.awfWorkflow.count(),
    db.awfWorkflow.count({ where: { status: 'ACTIVE' } }),
  ]);

  const [allTime, last24h, last7d, production] = await Promise.all([
    runCounters({}),
    runCounters({ createdAt: { gte: since24h } }),
    runCounters({ createdAt: { gte: since7d } }),
    runCounters({ mode: 'PRODUCTION' }),
  ]);

  const [toolCalls, toolDenied, toolFailed, toolSimulated, mutationAgg] = await Promise.all([
    db.awfToolCall.count(),
    db.awfToolCall.count({ where: { status: 'DENIED' } }),
    db.awfToolCall.count({ where: { status: 'FAILED' } }),
    db.awfToolCall.count({ where: { status: 'SIMULATED' } }),
    db.awfToolCall.aggregate({ _sum: { mutationCount: true } }),
  ]);

  const approvalsGrouped = await db.awfApproval.groupBy({ by: ['status'], _count: { _all: true } });
  const approvalsByStatus = new Map(approvalsGrouped.map((row) => [row.status, row._count._all]));

  const runtimes = await db.awfModelRuntime.findMany({
    orderBy: [{ tier: 'asc' }, { runtimeKey: 'asc' }],
    select: { runtimeKey: true, name: true, tier: true, kind: true, status: true, queueDepth: true, avgLatencyMs: true, successCount: true, failureCount: true, isPaidService: true },
  });

  const failureRows = await db.awfRun.findMany({
    where: { status: 'FAILED' },
    select: { errorMessage: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const failureCounts = new Map<string, number>();
  for (const row of failureRows) {
    const reason = (row.errorMessage || 'unspecified').split(':').slice(0, 2).join(':').slice(0, 120);
    failureCounts.set(reason, (failureCounts.get(reason) || 0) + 1);
  }

  const recent = await db.awfRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { runCode: true, workflowSlug: true, status: true, mode: true, durationMs: true, createdAt: true, agent: { select: { slug: true } } },
  });

  return {
    agents: {
      total: agentsByStatus.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: Object.fromEntries(agentsByStatus.map((row) => [row.status, row._count._all])),
      departments,
    },
    registry: { tools, skills, workflows, activeWorkflows },
    runs: { allTime, last24h, last7d, production },
    tools: { calls: toolCalls, denied: toolDenied, failed: toolFailed, simulated: toolSimulated, mutations: mutationAgg._sum.mutationCount || 0 },
    approvals: {
      pending: approvalsByStatus.get('PENDING') || 0,
      approved: approvalsByStatus.get('APPROVED') || 0,
      consumed: approvalsByStatus.get('CONSUMED') || 0,
      rejected: approvalsByStatus.get('REJECTED') || 0,
    },
    runtimes,
    automation: await computeAutomationReport(),
    topFailures: [...failureCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recentRuns: recent.map((row) => ({
      runCode: row.runCode,
      agent: row.agent?.slug || '',
      workflow: row.workflowSlug,
      status: row.status,
      mode: row.mode,
      durationMs: row.durationMs,
      createdAt: row.createdAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  };
}

export interface AgentPerformance {
  slug: string;
  name: string;
  status: string;
  runs: number;
  completed: number;
  failed: number;
  awaitingApproval: number;
  successRate: number;
  avgDurationMs: number;
  lastRunAt: string | null;
}

export async function agentPerformance(): Promise<AgentPerformance[]> {
  const agents = await db.awfAgent.findMany({ select: { id: true, slug: true, name: true, status: true, lastRunAt: true }, orderBy: { slug: 'asc' } });
  const grouped = await db.awfRun.groupBy({ by: ['agentId', 'status'], _count: { _all: true }, _avg: { durationMs: true } });
  return agents.map((agent) => {
    const rows = grouped.filter((row) => row.agentId === agent.id);
    const counts = new Map(rows.map((row) => [row.status, row._count._all]));
    const completed = counts.get('COMPLETED') || 0;
    const failed = counts.get('FAILED') || 0;
    const runs = rows.reduce((sum, row) => sum + row._count._all, 0);
    const avg = rows.length ? rows.reduce((sum, row) => sum + (row._avg.durationMs || 0) * row._count._all, 0) / Math.max(1, runs) : 0;
    return {
      slug: agent.slug,
      name: agent.name,
      status: agent.status,
      runs,
      completed,
      failed,
      awaitingApproval: counts.get('AWAITING_APPROVAL') || 0,
      successRate: completed + failed ? Math.round((completed / (completed + failed)) * 10000) / 100 : 0,
      avgDurationMs: Math.round(avg),
      lastRunAt: agent.lastRunAt ? agent.lastRunAt.toISOString() : null,
    };
  });
}

export async function runDetail(runCode: string) {
  const run = await db.awfRun.findUnique({
    where: { runCode },
    include: {
      steps: { orderBy: { stepIndex: 'asc' } },
      toolCalls: { orderBy: { createdAt: 'asc' } },
      agent: { select: { slug: true, name: true } },
      version: { select: { versionNo: true, configHash: true } },
    },
  });
  if (!run) return null;
  return {
    runCode: run.runCode,
    agent: run.agent?.slug || '',
    agentName: run.agent?.name || '',
    versionNo: run.version?.versionNo ?? null,
    workflow: run.workflowSlug,
    mode: run.mode,
    status: run.status,
    trigger: run.trigger,
    correlationId: run.correlationId,
    runtimeKey: run.runtimeKey,
    provider: run.provider,
    fallbackUsed: run.fallbackUsed,
    fallbackChain: safeJson(run.fallbackChain),
    durationMs: run.durationMs,
    automationMode: run.automationMode,
    automationCategory: run.automationCategory,
    input: safeJson(run.input),
    output: safeJson(run.output),
    errorMessage: run.errorMessage,
    steps: run.steps.map((step) => ({
      index: step.stepIndex,
      key: step.stepKey,
      type: step.stepType,
      ref: step.refSlug,
      status: step.status,
      note: step.note,
      output: safeJson(step.output),
    })),
    toolCalls: run.toolCalls.map((call) => ({
      tool: call.toolSlug,
      status: call.status,
      decision: call.decision,
      durationMs: call.durationMs,
      mutationCount: call.mutationCount,
      error: call.errorMessage,
    })),
    createdAt: run.createdAt.toISOString(),
  };
}

function safeJson(raw: string | null | undefined): unknown {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
