/**
 * ALO AI Workforce — automation measurement (§24).
 *
 * The KPI is computed from real rows only. Every production run writes one
 * `AwfTaskLedger` entry (the unit of automatable work) and one platform
 * `AutomationEvent` (so the existing ALO KPI reporting includes AI Workforce
 * output). The percentage is derived with the canonical ALO formula:
 *
 *   automationRate = agent-completed eligible tasks / all eligible tasks × 100
 *
 * Safety, legal and financial approvals are reported separately as
 * `humanApproved` — they are human-in-the-loop by design, not failures.
 */
import { db } from '@/lib/db';
import { measureAutomation, type AutomationBucket } from '@/lib/automation-measurement';

export type LedgerOutcome = 'AGENT_COMPLETED' | 'AGENT_ASSISTED' | 'HUMAN_APPROVED' | 'HUMAN_ONLY' | 'FAILED' | 'ESCALATED' | 'PENDING';

export interface TaskLedgerInput {
  ledgerKey: string;
  workflowSlug: string;
  department?: string;
  entityType?: string;
  entityId?: string;
  eligible: boolean;
  outcome: LedgerOutcome;
  runId?: string;
  humanTouches?: number;
  durationMs?: number;
  substantive?: boolean;
  evidenceId?: string;
}

/** Ledger entries are idempotent on `ledgerKey`, so a replay cannot inflate the KPI. */
export async function recordTaskLedger(input: TaskLedgerInput): Promise<string> {
  const row = await db.awfTaskLedger.upsert({
    where: { ledgerKey: input.ledgerKey },
    create: {
      ledgerKey: input.ledgerKey,
      workflowSlug: input.workflowSlug,
      department: input.department || '',
      entityType: input.entityType || '',
      entityId: input.entityId || '',
      eligible: input.eligible,
      outcome: input.outcome,
      runId: input.runId || '',
      humanTouches: input.humanTouches ?? 0,
      durationMs: input.durationMs ?? 0,
      substantive: input.substantive ?? true,
      evidenceId: input.evidenceId || '',
    },
    update: {
      outcome: input.outcome,
      humanTouches: input.humanTouches ?? 0,
      durationMs: input.durationMs ?? 0,
      substantive: input.substantive ?? true,
    },
  });

  // Mirror into the platform-wide automation KPI stream.
  await db.automationEvent.upsert({
    where: { idempotencyKey: `awf:${input.ledgerKey}` },
    create: {
      workflow: input.workflowSlug,
      category: input.eligible ? 'ELIGIBLE_ROUTINE' : 'HUMAN_REQUIRED',
      mode: ledgerOutcomeToMode(input.outcome),
      trigger: 'AI_WORKFORCE',
      actor: 'ALO_AI_WORKFORCE',
      targetType: input.entityType || 'AwfRun',
      targetId: input.entityId || input.runId || null,
      action: input.workflowSlug,
      riskLevel: 'LOW',
      success: input.outcome === 'AGENT_COMPLETED' || input.outcome === 'AGENT_ASSISTED' || input.outcome === 'HUMAN_APPROVED',
      durationMs: input.durationMs ?? 0,
      idempotencyKey: `awf:${input.ledgerKey}`,
    },
    update: {
      mode: ledgerOutcomeToMode(input.outcome),
      success: input.outcome === 'AGENT_COMPLETED' || input.outcome === 'AGENT_ASSISTED' || input.outcome === 'HUMAN_APPROVED',
      durationMs: input.durationMs ?? 0,
    },
  });

  return row.id;
}

function ledgerOutcomeToMode(outcome: LedgerOutcome): string {
  switch (outcome) {
    case 'AGENT_COMPLETED':
      return 'AUTOMATED';
    case 'AGENT_ASSISTED':
      return 'AI_ASSISTED';
    case 'HUMAN_APPROVED':
      return 'HUMAN';
    case 'PENDING':
      return 'PENDING_APPROVAL';
    case 'HUMAN_ONLY':
      return 'HUMAN';
    case 'ESCALATED':
    case 'FAILED':
      return 'ESCALATED';
    default:
      return 'PENDING';
  }
}

export interface AutomationReport {
  formula: string;
  totalTasks: number;
  eligibleTasks: number;
  agentCompleted: number;
  humanApproved: number;
  humanOnly: number;
  failed: number;
  pending: number;
  automationRate: number;
  humanInterventionRate: number;
  targetMet: boolean;
  hasData: boolean;
  byWorkflow: Array<{ workflow: string; eligible: number; agentCompleted: number; automationRate: number }>;
  /** Cross-check against the platform-wide AutomationEvent stream. */
  platformCrossCheck: { automationRate: number; eligible: number; automated: number; hasData: boolean };
  measuredAt: string;
}

export async function computeAutomationReport(period?: { from: Date; to: Date }): Promise<AutomationReport> {
  const where = period ? { createdAt: { gte: period.from, lte: period.to } } : {};
  const rows = await db.awfTaskLedger.groupBy({
    by: ['workflowSlug', 'eligible', 'outcome'],
    where,
    _count: { _all: true },
  });

  let totalTasks = 0;
  let eligibleTasks = 0;
  let agentCompleted = 0;
  let humanApproved = 0;
  let humanOnly = 0;
  let failed = 0;
  let pending = 0;
  const byWorkflowMap = new Map<string, { eligible: number; agentCompleted: number }>();

  for (const row of rows) {
    const count = row._count._all;
    totalTasks += count;
    if (row.eligible) {
      eligibleTasks += count;
      const bucket = byWorkflowMap.get(row.workflowSlug) || { eligible: 0, agentCompleted: 0 };
      bucket.eligible += count;
      if (row.outcome === 'AGENT_COMPLETED') bucket.agentCompleted += count;
      byWorkflowMap.set(row.workflowSlug, bucket);
    }
    switch (row.outcome) {
      case 'AGENT_COMPLETED':
        if (row.eligible) agentCompleted += count;
        break;
      case 'HUMAN_APPROVED':
        humanApproved += count;
        break;
      case 'HUMAN_ONLY':
        humanOnly += count;
        break;
      case 'FAILED':
      case 'ESCALATED':
        failed += count;
        break;
      default:
        pending += count;
    }
  }

  const percent = (numerator: number, denominator: number) => (denominator ? Math.round((numerator / denominator) * 10000) / 100 : 0);
  const humanTouched = await db.awfTaskLedger.count({ where: { ...where, eligible: true, humanTouches: { gt: 0 } } });

  const platformBuckets: AutomationBucket[] = (
    await db.automationEvent.groupBy({
      by: ['workflow', 'category', 'mode', 'success'],
      where: period ? { createdAt: { gte: period.from, lte: period.to } } : undefined,
      _count: { _all: true },
    })
  ).map((row) => ({ workflow: row.workflow, category: row.category, mode: row.mode, success: row.success, count: row._count._all }));
  const platform = measureAutomation(platformBuckets);

  return {
    formula: 'automationRate = agent-completed eligible tasks / total eligible automatable tasks * 100',
    totalTasks,
    eligibleTasks,
    agentCompleted,
    humanApproved,
    humanOnly,
    failed,
    pending,
    automationRate: percent(agentCompleted, eligibleTasks),
    humanInterventionRate: percent(humanTouched, eligibleTasks),
    targetMet: eligibleTasks > 0 && percent(agentCompleted, eligibleTasks) >= 70,
    hasData: eligibleTasks > 0,
    byWorkflow: [...byWorkflowMap.entries()]
      .map(([workflow, bucket]) => ({
        workflow,
        eligible: bucket.eligible,
        agentCompleted: bucket.agentCompleted,
        automationRate: percent(bucket.agentCompleted, bucket.eligible),
      }))
      .sort((a, b) => a.workflow.localeCompare(b.workflow)),
    platformCrossCheck: {
      automationRate: platform.automationRate,
      eligible: platform.eligible,
      automated: platform.automated,
      hasData: platform.hasData,
    },
    measuredAt: new Date().toISOString(),
  };
}
