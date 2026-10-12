/**
 * ALO AI Workforce — workflow engine (§16, §21).
 *
 * A workflow is a persisted, versioned definition that chains ALO agents with
 * conditions, retries, approval gates and a declared automation unit. Events
 * are deduplicated on an idempotency key before anything runs, and the
 * workflow's own ledger entry is the unit of automation measurement, so a
 * multi-agent workflow counts once, not once per agent.
 */
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { runAgent, resolveTemplate, type RunAgentResult } from './runner';
import { recordTaskLedger } from './automation';
import { writeAudit } from './audit';
import { requireCapability } from './rbac';
import { stableHash } from './text';
import type { ActorContext, RunMode } from './types';

export interface WorkflowStep {
  key: string;
  agent: string;
  input?: Record<string, unknown>;
  when?: { path: string; equals?: unknown; in?: unknown[]; gte?: number };
  optional?: boolean;
  retries?: number;
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
  outputStep?: string;
  entityType?: string;
  entityIdPath?: string;
  automation?: { eligible?: boolean; department?: string };
}

export interface WorkflowRunResult {
  workflowSlug: string;
  correlationId: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'AWAITING_APPROVAL';
  steps: Array<{ key: string; agent: string; status: string; runCode?: string; error?: string }>;
  output: Record<string, unknown>;
  runCodes: string[];
  durationMs: number;
  automationOutcome: string;
  reused?: boolean;
}

function readPath(scope: Record<string, unknown>, path: string): unknown {
  return path
    .replace(/^\$/, '')
    .split('.')
    .reduce<unknown>((acc, segment) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[segment] : undefined), scope);
}

function conditionMet(when: WorkflowStep['when'], scope: Record<string, unknown>): boolean {
  if (!when) return true;
  const value = readPath(scope, when.path);
  if (when.equals !== undefined) return value === when.equals;
  if (when.in !== undefined) return when.in.includes(value as never);
  if (when.gte !== undefined) return Number(value) >= when.gte;
  return Boolean(value);
}

export interface RunWorkflowParams {
  workflowSlug: string;
  input: Record<string, unknown>;
  actor: ActorContext;
  mode: RunMode;
  correlationId?: string;
  idempotencyKey?: string;
  triggerEventId?: string;
  triggerType?: string;
  approvals?: Record<string, string>;
}

export async function runWorkflow(params: RunWorkflowParams): Promise<WorkflowRunResult> {
  const started = Date.now();
  const correlationId = params.correlationId || randomUUID();
  requireCapability(params.actor, params.mode === 'PRODUCTION' ? 'awf.workflow.trigger' : 'awf.run.simulate');

  const workflow = await db.awfWorkflow.findUnique({ where: { slug: params.workflowSlug } });
  if (!workflow) throw new Error(`AWF_WORKFLOW_UNKNOWN: ${params.workflowSlug}`);
  if (params.mode === 'PRODUCTION' && workflow.status !== 'ACTIVE') {
    throw new Error(`AWF_WORKFLOW_NOT_ACTIVE: ${params.workflowSlug} is ${workflow.status}`);
  }

  const definition = JSON.parse(workflow.definition || '{}') as WorkflowDefinition;
  const steps = Array.isArray(definition.steps) ? definition.steps : [];
  if (!steps.length) throw new Error(`AWF_WORKFLOW_EMPTY: ${params.workflowSlug}`);

  const ledgerKey = params.idempotencyKey
    ? `${workflow.slug}:${stableHash({ key: params.idempotencyKey, actor: params.actor.userId, mode: params.mode })}`
    : `${workflow.slug}:${stableHash({ input: params.input, correlationId })}`;

  // Workflow-level idempotency: a replayed trigger returns the first result.
  if (params.idempotencyKey) {
    const existing = await db.awfTaskLedger.findUnique({ where: { ledgerKey } });
    if (existing && params.mode === 'PRODUCTION') {
      return {
        workflowSlug: workflow.slug,
        correlationId,
        status: existing.outcome === 'AGENT_COMPLETED' ? 'COMPLETED' : ['PENDING', 'HUMAN_APPROVED'].includes(existing.outcome) ? 'AWAITING_APPROVAL' : 'FAILED',
        steps: [],
        output: {},
        runCodes: [],
        durationMs: existing.durationMs,
        automationOutcome: existing.outcome,
        reused: true,
      };
    }
  }

  const scope: Record<string, unknown> = { input: params.input, steps: {} as Record<string, unknown> };
  const stepResults: WorkflowRunResult['steps'] = [];
  const runCodes: string[] = [];
  // The ledger references the primary key of the first agent run so the audit
  // can always join a measured task back to its execution record.
  const runIds: string[] = [];
  let failed = false;
  let awaitingApproval = false;

  for (const step of steps) {
    if (!conditionMet(step.when, scope)) {
      stepResults.push({ key: step.key, agent: step.agent, status: 'SKIPPED' });
      continue;
    }
    const stepInput = (resolveTemplate(step.input ?? {}, scope) ?? {}) as Record<string, unknown>;
    const attempts = Math.max(1, (step.retries ?? workflow.maxRetries ?? 0) + 1);
    let result: RunAgentResult | null = null;
    let lastError = '';

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        result = await runAgent({
          agentSlug: step.agent,
          input: stepInput,
          actor: params.actor,
          mode: params.mode,
          correlationId,
          workflowSlug: workflow.slug,
          workflowId: workflow.id,
          triggerEventId: params.triggerEventId,
          triggerType: params.triggerType || workflow.triggerType,
          approvals: params.approvals,
          recordLedger: false,
          idempotencyKey: params.idempotencyKey ? stableHash({ key: ledgerKey, step: step.key, attempt: 1 }) : undefined,
        });
        if (result.status !== 'FAILED') break;
        lastError = result.error || 'agent run failed';
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'agent run crashed';
        result = null;
      }
    }

    if (result) {
      runCodes.push(result.runCode);
      runIds.push(result.runId);
      (scope.steps as Record<string, unknown>)[step.key] = result.output;
      if (result.humanReviewRequired) {
        awaitingApproval = true;
      }
      stepResults.push({ key: step.key, agent: step.agent, status: result.status, runCode: result.runCode, error: result.error });
      if (result.status === 'FAILED' && !step.optional) {
        failed = true;
        break;
      }
    } else {
      stepResults.push({ key: step.key, agent: step.agent, status: 'FAILED', error: lastError });
      if (!step.optional) {
        failed = true;
        break;
      }
    }
  }

  const status: WorkflowRunResult['status'] = failed
    ? 'FAILED'
    : awaitingApproval
      ? 'AWAITING_APPROVAL'
      : stepResults.some((entry) => entry.status === 'FAILED')
        ? 'PARTIAL'
        : 'COMPLETED';

  const output = definition.outputStep
    ? ((scope.steps as Record<string, unknown>)[definition.outputStep] as Record<string, unknown>) ?? {}
    : (scope.steps as Record<string, unknown>);

  const durationMs = Date.now() - started;
  const outcome = status === 'COMPLETED' ? 'AGENT_COMPLETED' : status === 'AWAITING_APPROVAL' ? 'PENDING' : status === 'PARTIAL' ? 'AGENT_ASSISTED' : 'FAILED';

  if (params.mode === 'PRODUCTION') {
    await recordTaskLedger({
      ledgerKey,
      workflowSlug: workflow.slug,
      department: definition.automation?.department || '',
      entityType: definition.entityType || '',
      entityId: definition.entityIdPath ? String(readPath(scope, definition.entityIdPath) ?? '') : String(params.input.entityId || ''),
      eligible: definition.automation?.eligible !== false && workflow.eligible,
      outcome,
      runId: runIds[0] || '',
      humanTouches: 0,
      durationMs,
      substantive: status !== 'FAILED',
    });
  }

  await writeAudit({
    actor: params.actor,
    action: 'WORKFLOW_TRIGGERED',
    objectType: 'AwfWorkflow',
    objectId: workflow.id,
    after: { slug: workflow.slug, status, steps: stepResults.length, mode: params.mode, runCodes },
    result: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    correlationId,
  });

  return { workflowSlug: workflow.slug, correlationId, status, steps: stepResults, output, runCodes, durationMs, automationOutcome: outcome };
}

// ───────────────────────────── event ingestion ─────────────────────────────

export interface IngestEventInput {
  eventType: string;
  payload: Record<string, unknown>;
  source?: string;
  entityType?: string;
  entityId?: string;
  /** Caller-supplied key; derived deterministically when absent. */
  eventKey?: string;
  actor: ActorContext;
  mode?: RunMode;
}

export interface IngestEventResult {
  eventId: string;
  status: 'PROCESSED' | 'DUPLICATE' | 'SKIPPED' | 'FAILED';
  workflows: string[];
  results: WorkflowRunResult[];
  reason?: string;
}

/**
 * Deduplicated, auditable entry point for event-driven automation. A duplicate
 * event is recorded as DUPLICATE and never re-executes; an event with no
 * matching workflow is recorded as SKIPPED rather than discarded.
 */
export async function ingestEvent(input: IngestEventInput): Promise<IngestEventResult> {
  const eventKey = input.eventKey || stableHash({ type: input.eventType, entityId: input.entityId, payload: input.payload });
  const existing = await db.awfEvent.findUnique({ where: { eventKey } });
  if (existing) {
    return { eventId: existing.id, status: 'DUPLICATE', workflows: [], results: [], reason: 'event key already processed' };
  }

  const event = await db.awfEvent.create({
    data: {
      eventKey,
      eventType: input.eventType,
      source: input.source || 'ALO_PLATFORM',
      payload: JSON.stringify(input.payload).slice(0, 60_000),
      entityType: input.entityType || '',
      entityId: input.entityId || '',
      status: 'PROCESSING',
      attempts: 1,
    },
  });

  const workflows = await db.awfWorkflow.findMany({ where: { triggerEvent: input.eventType, status: 'ACTIVE' }, select: { slug: true } });
  if (!workflows.length) {
    await db.awfEvent.update({ where: { id: event.id }, data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'no active workflow subscribes to this event' } });
    return { eventId: event.id, status: 'SKIPPED', workflows: [], results: [], reason: 'no active workflow subscribes to this event' };
  }

  const results: WorkflowRunResult[] = [];
  let failure = '';
  for (const workflow of workflows) {
    try {
      results.push(
        await runWorkflow({
          workflowSlug: workflow.slug,
          input: input.payload,
          actor: input.actor,
          mode: input.mode || 'PRODUCTION',
          idempotencyKey: `${eventKey}:${workflow.slug}`,
          triggerEventId: event.id,
          triggerType: 'EVENT',
        })
      );
    } catch (error) {
      failure = error instanceof Error ? error.message : 'workflow execution failed';
    }
  }

  await db.awfEvent.update({
    where: { id: event.id },
    data: {
      status: failure ? 'FAILED' : 'PROCESSED',
      processedAt: new Date(),
      runId: results[0]?.runCodes[0] || '',
      lastError: failure.slice(0, 1000),
    },
  });

  return { eventId: event.id, status: failure ? 'FAILED' : 'PROCESSED', workflows: workflows.map((row) => row.slug), results, reason: failure || undefined };
}

export async function upsertWorkflow(
  input: {
    slug: string;
    name: string;
    description?: string;
    departmentSlug?: string;
    triggerType?: string;
    triggerEvent?: string;
    definition: WorkflowDefinition;
    status?: string;
    eligible?: boolean;
  },
  actor: ActorContext
) {
  requireCapability(actor, 'awf.workflow.manage');
  const department = input.departmentSlug
    ? await db.awfDepartment.findUnique({ where: { slug: input.departmentSlug }, select: { id: true } })
    : null;
  const existing = await db.awfWorkflow.findUnique({ where: { slug: input.slug }, select: { id: true, version: true } });
  const workflow = await db.awfWorkflow.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      description: input.description || '',
      departmentId: department?.id || null,
      triggerType: input.triggerType || 'MANUAL',
      triggerEvent: input.triggerEvent || '',
      definition: JSON.stringify(input.definition),
      status: input.status || 'ACTIVE',
      eligible: input.eligible !== false,
      createdById: actor.userId,
    },
    update: {
      name: input.name,
      description: input.description || '',
      departmentId: department?.id || null,
      triggerType: input.triggerType || 'MANUAL',
      triggerEvent: input.triggerEvent || '',
      definition: JSON.stringify(input.definition),
      status: input.status || 'ACTIVE',
      eligible: input.eligible !== false,
      version: (existing?.version ?? 0) + 1,
    },
  });
  await writeAudit({
    actor,
    action: existing ? 'WORKFLOW_UPDATED' : 'WORKFLOW_CREATED',
    objectType: 'AwfWorkflow',
    objectId: workflow.id,
    after: { slug: workflow.slug, steps: input.definition.steps.length, triggerEvent: workflow.triggerEvent },
  });
  return workflow;
}
