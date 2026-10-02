/**
 * ALO AI Workforce — agent runner (§7, §11, §21, §26).
 *
 * The runner is the only way an ALO agent executes. It owns:
 *   lifecycle/RBAC admission -> idempotency -> run record -> memory load
 *   -> skill pipeline (tools + gateway, every step persisted)
 *   -> output validation -> automation classification -> telemetry -> audit.
 *
 * A task is never silently dropped: every terminal state is written to
 * `AwfRun`, and a run that needs a human ends as NEEDS_APPROVAL with the
 * reason recorded, not as a success.
 */
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { aiGatewayExecute, GatewayError } from './gateway';
import { executeSkill, getSkillDefinition, type SkillContext } from './skills/registry';
import { executeTool, type ToolExecutionOutcome } from './tools/registry';
import { writeAudit } from './audit';
import { canInvokeAgent } from './rbac';
import { parseMemoryPolicy, readMemory, writeMemory, type MemoryRequest } from './memory';
import { recordTaskLedger } from './automation';
import { redactDeep } from './security';
import { stableHash, truncate } from './text';
import type { ActorContext, RunMode } from './types';

// Importing the catalogues registers every tool and skill exactly once.
import './tools/handlers';
import './skills/catalog';

export interface PipelineStep {
  key: string;
  skill: string;
  input?: Record<string, unknown>;
  /** Step may fail without failing the run. */
  optional?: boolean;
  /** Run only when the referenced value is truthy / matches. */
  when?: { path: string; equals?: unknown; in?: unknown[]; gte?: number };
}

export interface AgentConfig {
  pipeline: PipelineStep[];
  memoryPolicy?: Record<string, unknown>;
  automation?: { eligible?: boolean; category?: string; taskType?: string };
  outputStep?: string;
  requiresApprovalFor?: string[];
}

export interface RunAgentParams {
  agentSlug: string;
  input: Record<string, unknown>;
  actor: ActorContext;
  mode: RunMode;
  correlationId?: string;
  idempotencyKey?: string;
  workflowSlug?: string;
  triggerType?: string;
  approvals?: Record<string, string>;
  parentRunId?: string;
  workflowId?: string;
  triggerEventId?: string;
  /** Workflow-level runs own the automation ledger entry; child runs set false. */
  recordLedger?: boolean;
}

export interface RunAgentResult {
  runId: string;
  runCode: string;
  status: 'COMPLETED' | 'FAILED' | 'AWAITING_APPROVAL';
  output: Record<string, unknown>;
  steps: Array<{ key: string; skill: string; status: string; error?: string }>;
  automation: { eligible: boolean; mode: string; category: string };
  runtimeKeys: string[];
  fallbackUsed: boolean;
  humanReviewRequired: boolean;
  durationMs: number;
  error?: string;
  reused?: boolean;
}

/** `$steps.x.y` / `$input.z` / literal passthrough. */
export function resolveTemplate(value: unknown, scope: Record<string, unknown>): unknown {
  if (typeof value === 'string' && value.startsWith('$')) return readPath(scope, value.slice(1));
  if (Array.isArray(value)) return value.map((entry) => resolveTemplate(entry, scope));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, resolveTemplate(entry, scope)]));
  }
  return value;
}

function readPath(scope: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined) return undefined;
    if (Array.isArray(acc)) {
      const index = Number(segment);
      return Number.isInteger(index) ? acc[index] : undefined;
    }
    if (typeof acc === 'object') return (acc as Record<string, unknown>)[segment];
    return undefined;
  }, scope);
}

function conditionMet(when: PipelineStep['when'], scope: Record<string, unknown>): boolean {
  if (!when) return true;
  const value = readPath(scope, when.path.replace(/^\$/, ''));
  if (when.equals !== undefined) return value === when.equals;
  if (when.in !== undefined) return when.in.includes(value as never);
  if (when.gte !== undefined) return Number(value) >= when.gte;
  return Boolean(value);
}

function parseConfig(raw: string | null | undefined): AgentConfig {
  try {
    const parsed = JSON.parse(raw || '{}');
    return { pipeline: Array.isArray(parsed.pipeline) ? parsed.pipeline : [], ...parsed };
  } catch {
    return { pipeline: [] };
  }
}

function runCodeFor(agentSlug: string): string {
  return `AWF-${agentSlug.replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function runAgent(params: RunAgentParams): Promise<RunAgentResult> {
  const started = Date.now();
  const correlationId = params.correlationId || randomUUID();

  // ── Idempotency (§21): the same key never executes twice. ──
  if (params.idempotencyKey) {
    const existing = await db.awfRun.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) {
      return {
        runId: existing.id,
        runCode: existing.runCode,
        status: existing.status as RunAgentResult['status'],
        output: safeParse(existing.output),
        steps: [],
        automation: {
          eligible: existing.automationCategory === 'ELIGIBLE_ROUTINE',
          mode: existing.automationMode,
          category: existing.automationCategory,
        },
        runtimeKeys: existing.runtimeKey ? [existing.runtimeKey] : [],
        fallbackUsed: Boolean(existing.fallbackChain && existing.fallbackChain !== '[]'),
        humanReviewRequired: existing.status === 'AWAITING_APPROVAL',
        durationMs: existing.durationMs || 0,
        reused: true,
      };
    }
  }

  const agent = await db.awfAgent.findUnique({ where: { slug: params.agentSlug } });
  if (!agent) throw new Error(`AWF_AGENT_UNKNOWN: ${params.agentSlug}`);

  // ── Admission control ──
  if (!canInvokeAgent(params.actor, agent.allowedRoles)) {
    await writeAudit({
      actor: params.actor,
      action: 'AGENT_INVOKE_DENIED',
      objectType: 'AwfAgent',
      objectId: agent.id,
      result: 'DENIED',
      reason: `role ${params.actor.role} is not permitted to invoke ${agent.slug}`,
      correlationId,
    });
    throw new Error('AWF_AGENT_FORBIDDEN');
  }
  if (params.mode === 'PRODUCTION' && agent.status !== 'ACTIVE') {
    throw new Error(`AWF_AGENT_NOT_ACTIVE: ${agent.slug} is ${agent.status}`);
  }

  const versionId = agent.activeVersionId;
  const version = versionId
    ? await db.awfAgentVersion.findUnique({ where: { id: versionId } })
    : await db.awfAgentVersion.findFirst({ where: { agentId: agent.id }, orderBy: { versionNo: 'desc' } });
  if (!version) throw new Error(`AWF_AGENT_NO_VERSION: ${agent.slug}`);
  if (params.mode === 'PRODUCTION' && version.state !== 'DEPLOYED') {
    throw new Error(`AWF_AGENT_VERSION_NOT_DEPLOYED: ${agent.slug} v${version.versionNo} is ${version.state}`);
  }

  const config = parseConfig(version.config);
  if (!config.pipeline.length) throw new Error(`AWF_AGENT_EMPTY_PIPELINE: ${agent.slug}`);

  const run = await db.awfRun.create({
    data: {
      runCode: runCodeFor(agent.slug),
      agentId: agent.id,
      versionId: version.id,
      workflowSlug: params.workflowSlug || '',
      workflowId: params.workflowId || null,
      triggerEventId: params.triggerEventId || null,
      mode: params.mode,
      status: 'RUNNING',
      trigger: params.triggerType || 'MANUAL',
      correlationId,
      idempotencyKey: params.idempotencyKey || null,
      parentRunId: params.parentRunId || null,
      actorUserId: params.actor.userId,
      actorRole: params.actor.role,
      entityType: String(params.input.entityType || ''),
      entityId: String(params.input.studentId || params.input.leadId || params.input.applicationId || ''),
      input: JSON.stringify(redactDeep(params.input)).slice(0, 60_000),
      startedAt: new Date(),
      automationMode: 'AUTOMATED',
      automationCategory: config.automation?.category || 'ELIGIBLE_ROUTINE',
    },
  });

  const runtimeKeys = new Set<string>();
  const fallbackChain: string[] = [];
  const stepSummaries: RunAgentResult['steps'] = [];
  const scope: Record<string, unknown> = { input: params.input, steps: {} as Record<string, unknown> };
  let humanReviewRequired = false;
  let stepIndex = 0;
  let failure: string | undefined;

  // ── Short-term memory: prior context for this correlation. ──
  const memoryOwnerKey = String(params.input.studentId || params.input.leadId || correlationId);
  const memoryAddress: MemoryRequest = {
    scope: 'SHORT_TERM',
    ownerKey: memoryOwnerKey,
    key: `run:${agent.slug}`,
    actor: params.actor,
    agentSlug: agent.slug,
    policy: parseMemoryPolicy(version.memoryPolicy),
  };
  const priorMemory = await readMemory(memoryAddress).catch(() => null);
  if (priorMemory) scope.memory = safeParse(priorMemory.value);

  const recordStep: SkillContext['recordStep'] = async (step) => {
    stepIndex += 1;
    await db.awfRunStep.create({
      data: {
        runId: run.id,
        stepIndex,
        stepKey: step.stepKey,
        stepType: step.stepType,
        refSlug: step.refSlug || '',
        status: step.status,
        input: JSON.stringify(redactDeep(step.input ?? {})).slice(0, 20_000),
        output: JSON.stringify(redactDeep(step.output ?? {})).slice(0, 20_000),
        note: truncate(step.note || '', 500),
        startedAt: new Date(),
        endedAt: new Date(),
      },
    });
  };

  const callTool = async (slug: string, args: Record<string, unknown>, options?: { approvalId?: string }): Promise<ToolExecutionOutcome> =>
    executeTool(slug, args, {
      runId: run.id,
      agentSlug: agent.slug,
      actor: params.actor,
      mode: params.mode,
      correlationId,
      approvalId: options?.approvalId || params.approvals?.[`tool:${slug}`],
      idempotencyKey: params.idempotencyKey,
    });

  const reason: SkillContext['reason'] = async (request) => {
    const result = await aiGatewayExecute({
      task: request.task,
      instructions: request.instructions,
      input: request.input,
      context: request.context,
      outputSchemaKey: request.outputSchemaKey,
      correlationId,
      agentSlug: agent.slug,
      runId: run.id,
      confidential: request.confidential,
    });
    runtimeKeys.add(result.runtimeKey);
    for (const attempt of result.attempts) {
      if (!fallbackChain.includes(attempt.runtimeKey)) fallbackChain.push(attempt.runtimeKey);
    }
    return { data: result.data, runtimeKey: result.runtimeKey, deterministic: result.deterministic, fallbackUsed: result.attempts.length > 1 };
  };

  const skillContext: SkillContext = {
    actor: params.actor,
    agentSlug: agent.slug,
    runId: run.id,
    mode: params.mode,
    correlationId,
    callTool,
    reason,
    recordStep,
    approvals: params.approvals,
  };

  // ── Pipeline ──
  for (const step of config.pipeline) {
    if (!conditionMet(step.when, scope)) {
      stepSummaries.push({ key: step.key, skill: step.skill, status: 'SKIPPED' });
      await recordStep({ stepKey: step.key, stepType: 'SKILL', refSlug: step.skill, status: 'SKIPPED', note: 'condition not met' });
      continue;
    }
    if (!getSkillDefinition(step.skill)) {
      failure = `AWF_SKILL_UNKNOWN: ${step.skill}`;
      stepSummaries.push({ key: step.key, skill: step.skill, status: 'FAILED', error: failure });
      break;
    }
    const resolvedInput = (resolveTemplate(step.input ?? {}, scope) ?? {}) as Record<string, unknown>;
    let result;
    try {
      result = await executeSkill(step.skill, resolvedInput, skillContext);
    } catch (error) {
      const message = error instanceof GatewayError ? `${error.category}: ${error.message}` : error instanceof Error ? error.message : 'skill crashed';
      result = { ok: false as const, output: {}, evidence: {}, error: message, substantive: false };
    }
    (scope.steps as Record<string, unknown>)[step.key] = result.output;
    if (result.humanReviewRequired) humanReviewRequired = true;
    stepSummaries.push({ key: step.key, skill: step.skill, status: result.ok ? 'COMPLETED' : 'FAILED', error: result.error });
    await recordStep({
      stepKey: step.key,
      stepType: 'SKILL',
      refSlug: step.skill,
      status: result.ok ? 'COMPLETED' : 'FAILED',
      input: resolvedInput,
      output: result.ok ? result.output : { error: result.error },
      note: result.error || '',
    });
    if (!result.ok && !step.optional) {
      failure = result.error || `skill ${step.skill} failed`;
      break;
    }
  }

  const output = config.outputStep
    ? ((scope.steps as Record<string, unknown>)[config.outputStep] as Record<string, unknown>) ?? {}
    : (scope.steps as Record<string, unknown>);

  const status: RunAgentResult['status'] = failure ? 'FAILED' : humanReviewRequired ? 'AWAITING_APPROVAL' : 'COMPLETED';
  const durationMs = Date.now() - started;

  // ── Automation classification (§24). Human-approval outcomes are recorded
  //    as HUMAN_APPROVAL, never as automation failures. ──
  const eligible = config.automation?.eligible !== false;
  const automationCategory = eligible ? config.automation?.category || 'ELIGIBLE_ROUTINE' : 'NOT_ELIGIBLE';
  const automationMode = !eligible ? 'NOT_ELIGIBLE' : status === 'COMPLETED' ? 'AUTOMATED' : status === 'AWAITING_APPROVAL' ? 'PENDING_APPROVAL' : 'ESCALATED';
  const toolCallCount = await db.awfToolCall.count({ where: { runId: run.id } });

  await db.awfRun.update({
    where: { id: run.id },
    data: {
      status,
      output: JSON.stringify(redactDeep(output)).slice(0, 60_000),
      errorMessage: truncate(failure || '', 1000),
      endedAt: new Date(),
      durationMs,
      runtimeKey: [...runtimeKeys][0] || '',
      provider: [...runtimeKeys][0]?.startsWith('alo-deterministic') ? 'alo-deterministic' : 'alo-runtime',
      fallbackUsed: fallbackChain.length > 1,
      fallbackChain: JSON.stringify(fallbackChain),
      toolCallCount,
      approvalRequired: humanReviewRequired,
      humanIntervened: humanReviewRequired,
      automationMode,
      automationCategory,
    },
  });

  if (params.mode === 'PRODUCTION' && params.recordLedger !== false) {
    await recordTaskLedger({
      ledgerKey: `${params.workflowSlug || agent.slug}:${run.id}`,
      workflowSlug: params.workflowSlug || agent.slug,
      department: config.automation?.taskType || agent.slug,
      entityType: String(params.input.entityType || ''),
      entityId: String(params.input.studentId || params.input.leadId || params.input.applicationId || ''),
      eligible,
      outcome: status === 'COMPLETED' ? 'AGENT_COMPLETED' : status === 'AWAITING_APPROVAL' ? 'HUMAN_APPROVED' : 'FAILED',
      runId: run.id,
      humanTouches: humanReviewRequired ? 1 : 0,
      durationMs,
      substantive: status !== 'FAILED',
    });
  }

  // ── Short-term memory write: the run outcome is available to the next run. ──
  if (status !== 'FAILED') {
    await writeMemory({
      ...memoryAddress,
      value: JSON.stringify({ runCode: run.runCode, status, summary: truncate(JSON.stringify(output), 2000) }),
      confidentiality: 'INTERNAL',
      expiresAt: new Date(Date.now() + 86_400_000),
      sourceRunId: run.id,
    }).catch(() => undefined);
  }

  await writeAudit({
    actor: params.actor,
    action: status === 'COMPLETED' ? 'RUN_COMPLETED' : status === 'AWAITING_APPROVAL' ? 'RUN_ESCALATED' : 'RUN_FAILED',
    objectType: 'AwfRun',
    objectId: run.id,
    after: { runCode: run.runCode, agent: agent.slug, mode: params.mode, status, durationMs, runtimeKeys: [...runtimeKeys] },
    result: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    reason: failure,
    correlationId,
  });

  return {
    runId: run.id,
    runCode: run.runCode,
    status,
    output,
    steps: stepSummaries,
    automation: { eligible, mode: automationMode, category: automationCategory },
    runtimeKeys: [...runtimeKeys],
    fallbackUsed: fallbackChain.length > 1,
    humanReviewRequired,
    durationMs,
    error: failure,
  };
}

function safeParse(raw: string | null | undefined): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Deterministic idempotency key for event-driven triggers. */
export function idempotencyKeyFor(parts: Record<string, unknown>): string {
  return stableHash(parts);
}
