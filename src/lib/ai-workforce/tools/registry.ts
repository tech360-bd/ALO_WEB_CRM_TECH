/**
 * ALO AI Workforce — central tool registry and execution gateway (§14, §15).
 *
 * Nothing executes against ALO data except through `executeTool`, which
 * enforces, in order:
 *   registry lookup -> argument screening -> schema validation -> agent grant
 *   -> actor RBAC -> approval binding -> rate limit -> simulation guard
 *   -> timeout-bounded execution -> output validation -> persistence -> audit.
 *
 * Agents cannot register tools, grant themselves tools, widen a grant, or
 * reach a handler directly: handlers are module-private and only reachable via
 * this function.
 */
import { z } from 'zod';
import { describeZod } from './../zod-introspect';
import { db } from '@/lib/db';
import { writeAudit } from './../audit';
import { consumeApproval } from './../approvals';
import { redactDeep, screenToolArguments } from './../security';
import { can, type AwfCapability } from './../rbac';
import type { ProposedMutation, RiskLevel, ToolExecutionContext, ToolPermission, ToolResult } from './../types';

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  permission: ToolPermission;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  timeoutMs: number;
  rateLimitPerMin: number;
  securityClass: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  mutates: boolean;
  auditPolicy: 'ALWAYS' | 'ON_WRITE';
  input: z.ZodTypeAny;
  output: z.ZodTypeAny;
  /** Executed only after every gate above has passed. */
  handler: (args: Record<string, unknown>, ctx: ToolExecutionContext) => Promise<ToolResult>;
}

const REGISTRY = new Map<string, ToolDefinition>();

/** Registration happens at module load from ALO source only. */
export function registerTool(definition: ToolDefinition): void {
  if (REGISTRY.has(definition.slug)) throw new Error(`AWF_TOOL_DUPLICATE: ${definition.slug}`);
  REGISTRY.set(definition.slug, definition);
}

export function getToolDefinition(slug: string): ToolDefinition | undefined {
  return REGISTRY.get(slug);
}

export function listToolDefinitions(): ToolDefinition[] {
  return [...REGISTRY.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

const PERMISSION_CAPABILITY: Record<ToolPermission, AwfCapability> = {
  TOOL_READ: 'awf.run.execute',
  TOOL_WRITE: 'awf.run.execute',
  TOOL_EXTERNAL_SEND: 'awf.approval.decide',
  TOOL_FINANCE: 'awf.approval.decide',
  TOOL_ADMIN: 'awf.tool.manage',
};

const PERMISSION_RANK: Record<ToolPermission, number> = {
  TOOL_READ: 1,
  TOOL_WRITE: 2,
  TOOL_EXTERNAL_SEND: 3,
  TOOL_FINANCE: 4,
  TOOL_ADMIN: 5,
};

// ───────────────────────────── rate limiting ─────────────────────────────

const rateWindow = new Map<string, { windowStart: number; count: number }>();

export function checkRateLimit(key: string, limitPerMin: number): boolean {
  const now = Date.now();
  const entry = rateWindow.get(key);
  if (!entry || now - entry.windowStart >= 60_000) {
    rateWindow.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= limitPerMin) return false;
  entry.count += 1;
  return true;
}

export function resetRateLimits(): void {
  rateWindow.clear();
}

// ───────────────────────────── execution ─────────────────────────────

export class ToolDenied extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`AWF_TOOL_DENIED: ${reason}`);
    this.reason = reason;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AWF_TOOL_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface ToolExecutionOutcome extends ToolResult {
  toolCallId: string;
  durationMs: number;
  decision: string;
}

export async function executeTool(
  slug: string,
  rawArgs: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolExecutionOutcome> {
  const started = Date.now();
  const definition = REGISTRY.get(slug);

  const persist = async (status: string, decision: string, payload: Partial<ToolResult> & { error?: string }, mutationCount = 0) => {
    const row = await db.awfToolCall.create({
      data: {
        runId: ctx.runId,
        toolSlug: slug,
        toolId: dbToolId,
        mode: ctx.mode,
        status,
        decision,
        args: JSON.stringify(redactDeep(rawArgs)).slice(0, 40_000),
        result: JSON.stringify(redactDeep(payload.data ?? payload.proposedMutations ?? {})).slice(0, 40_000),
        errorMessage: String(payload.error || '').slice(0, 1000),
        durationMs: Date.now() - started,
        approvalId: ctx.approvalId || null,
        mutationCount,
      },
    });
    return row.id;
  };

  let dbToolId: string | null = null;

  if (!definition) {
    const id = await persist('DENIED', 'UNKNOWN_TOOL', { error: 'unknown tool' });
    await writeAudit({ actor: ctx.actor, action: 'TOOL_DENIED', objectType: 'AwfTool', objectId: slug, result: 'DENIED', reason: 'unknown tool', correlationId: ctx.correlationId });
    return { ok: false, error: 'AWF_TOOL_DENIED: unknown tool', toolCallId: id, durationMs: Date.now() - started, decision: 'UNKNOWN_TOOL' };
  }

  const dbTool = await db.awfTool.findUnique({ where: { slug } });
  dbToolId = dbTool?.id ?? null;

  const deny = async (reason: string, decision: string): Promise<ToolExecutionOutcome> => {
    const id = await persist('DENIED', decision, { error: reason });
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_DENIED',
      objectType: 'AwfTool',
      objectId: slug,
      result: 'DENIED',
      reason,
      correlationId: ctx.correlationId,
    });
    return { ok: false, error: `AWF_TOOL_DENIED: ${reason}`, toolCallId: id, durationMs: Date.now() - started, decision };
  };

  if (!dbTool || dbTool.status !== 'ACTIVE') return deny('tool is not active in the registry', 'TOOL_INACTIVE');

  // 1. Argument screening (privilege escalation / traversal / shell / SQL).
  const screening = screenToolArguments(rawArgs);
  if (!screening.ok) return deny(`unsafe argument: ${screening.violations[0]}`, 'UNSAFE_ARGUMENTS');

  // 2. Schema validation.
  const parsedArgs = definition.input.safeParse(rawArgs);
  if (!parsedArgs.success) {
    return deny(`argument schema validation failed: ${parsedArgs.error.issues[0]?.message ?? 'invalid'}`, 'INVALID_ARGUMENTS');
  }

  // 3. Agent grant. Registry risk/permission are authoritative; a grant can
  //    only ever be narrower, never wider.
  const agent = await db.awfAgent.findUnique({ where: { slug: ctx.agentSlug }, select: { id: true, status: true } });
  if (!agent) return deny('agent is not registered', 'AGENT_UNKNOWN');
  if (ctx.mode === 'PRODUCTION' && agent.status !== 'ACTIVE') {
    return deny(`agent status ${agent.status} may not execute production tools`, 'AGENT_NOT_ACTIVE');
  }
  const grant = await db.awfToolGrant.findUnique({ where: { agentId_toolId: { agentId: agent.id, toolId: dbTool.id } } });
  if (!grant || grant.status !== 'ACTIVE') return deny('no active tool grant for this agent', 'NO_GRANT');
  if (PERMISSION_RANK[grant.permission as ToolPermission] < PERMISSION_RANK[definition.permission]) {
    return deny('tool grant permission is below the tool requirement', 'INSUFFICIENT_GRANT');
  }

  // 4. Actor RBAC — the human on whose behalf the agent acts must hold the capability.
  const capability = PERMISSION_CAPABILITY[definition.permission];
  if (!can(ctx.actor.role, capability)) return deny(`actor role ${ctx.actor.role} lacks ${capability}`, 'ACTOR_FORBIDDEN');

  // 5. Rate limit.
  const limit = Math.min(definition.rateLimitPerMin, dbTool.rateLimitPerMin || definition.rateLimitPerMin);
  if (!checkRateLimit(`${ctx.agentSlug}:${slug}`, limit)) return deny('tool rate limit exceeded', 'RATE_LIMITED');

  // 6. Approval binding for high-risk / explicitly gated tools.
  const approvalNeeded =
    definition.requiresApproval ||
    dbTool.requiresApproval ||
    grant.approvalRequired ||
    ['HIGH', 'CRITICAL'].includes(definition.riskLevel) ||
    ['TOOL_EXTERNAL_SEND', 'TOOL_FINANCE', 'TOOL_ADMIN'].includes(definition.permission);

  if (approvalNeeded && ctx.mode === 'PRODUCTION') {
    if (!ctx.approvalId) return deny('an action-bound human approval is required for this tool', 'APPROVAL_REQUIRED');
    const consumed = await consumeApproval({
      approvalId: ctx.approvalId,
      runId: ctx.runId,
      action: `tool:${slug}`,
      toolSlug: slug,
      payload: parsedArgs.data as Record<string, unknown>,
    });
    if (!consumed.ok) return deny(`approval rejected: ${consumed.reason}`, 'APPROVAL_INVALID');
  }

  // 7. Simulation guard — mutating tools never touch the database in a dry run.
  if (ctx.mode !== 'PRODUCTION' && definition.mutates) {
    const proposed: ProposedMutation[] = [
      {
        operation: 'CREATE',
        entity: definition.category,
        summary: `${definition.name} would execute with ${Object.keys(parsedArgs.data as object).length} argument(s)`,
        data: redactDeep(parsedArgs.data as Record<string, unknown>),
      },
    ];
    const id = await persist('SIMULATED', 'DRY_RUN', { proposedMutations: proposed });
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_INVOKED',
      objectType: 'AwfTool',
      objectId: slug,
      after: { mode: ctx.mode, simulated: true },
      correlationId: ctx.correlationId,
    });
    return {
      ok: true,
      proposedMutations: proposed,
      mutationCount: 0,
      toolCallId: id,
      durationMs: Date.now() - started,
      decision: 'DRY_RUN',
    };
  }

  // 8. Bounded execution.
  let result: ToolResult;
  try {
    result = await withTimeout(definition.handler(parsedArgs.data as Record<string, unknown>, ctx), Math.min(definition.timeoutMs, dbTool.timeoutMs || definition.timeoutMs));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'tool execution failed';
    const id = await persist('FAILED', 'HANDLER_ERROR', { error: message });
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_FAILED',
      objectType: 'AwfTool',
      objectId: slug,
      result: 'FAILED',
      reason: message,
      correlationId: ctx.correlationId,
    });
    return { ok: false, error: message, toolCallId: id, durationMs: Date.now() - started, decision: 'HANDLER_ERROR' };
  }

  if (!result.ok) {
    const id = await persist('FAILED', 'HANDLER_REJECTED', { error: result.error });
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_FAILED',
      objectType: 'AwfTool',
      objectId: slug,
      result: 'FAILED',
      reason: result.error || 'handler rejected',
      correlationId: ctx.correlationId,
    });
    return { ...result, toolCallId: id, durationMs: Date.now() - started, decision: 'HANDLER_REJECTED' };
  }

  // 9. Output validation — a tool cannot return an unexpected shape.
  const parsedOutput = definition.output.safeParse(result.data ?? {});
  if (!parsedOutput.success) {
    const id = await persist('FAILED', 'INVALID_OUTPUT', { error: 'tool output schema validation failed' });
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_FAILED',
      objectType: 'AwfTool',
      objectId: slug,
      result: 'FAILED',
      reason: 'output schema validation failed',
      correlationId: ctx.correlationId,
    });
    return { ok: false, error: 'AWF_TOOL_INVALID_OUTPUT', toolCallId: id, durationMs: Date.now() - started, decision: 'INVALID_OUTPUT' };
  }

  const id = await persist('COMPLETED', 'EXECUTED', { data: parsedOutput.data as Record<string, unknown> }, result.mutationCount ?? 0);
  if (definition.auditPolicy === 'ALWAYS' || definition.mutates) {
    await writeAudit({
      actor: ctx.actor,
      action: 'TOOL_INVOKED',
      objectType: 'AwfTool',
      objectId: slug,
      after: { runId: ctx.runId, mutationCount: result.mutationCount ?? 0, mode: ctx.mode },
      correlationId: ctx.correlationId,
    });
  }
  return {
    ok: true,
    data: parsedOutput.data as Record<string, unknown>,
    mutationCount: result.mutationCount ?? 0,
    toolCallId: id,
    durationMs: Date.now() - started,
    decision: 'EXECUTED',
  };
}

/** Mirror the in-code registry into the database so the UI reads real rows. */
export async function syncToolRegistry(): Promise<number> {
  let count = 0;
  for (const tool of listToolDefinitions()) {
    await db.awfTool.upsert({
      where: { slug: tool.slug },
      create: {
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        handlerKey: tool.slug,
        category: tool.category,
        inputSchema: JSON.stringify(describeZod(tool.input)),
        outputSchema: JSON.stringify(describeZod(tool.output)),
        permission: tool.permission,
        riskLevel: tool.riskLevel,
        requiresApproval: tool.requiresApproval,
        timeoutMs: tool.timeoutMs,
        rateLimitPerMin: tool.rateLimitPerMin,
        auditPolicy: tool.auditPolicy,
        securityClass: tool.securityClass,
        mutates: tool.mutates,
        status: 'ACTIVE',
      },
      update: {
        name: tool.name,
        description: tool.description,
        handlerKey: tool.slug,
        category: tool.category,
        inputSchema: JSON.stringify(describeZod(tool.input)),
        outputSchema: JSON.stringify(describeZod(tool.output)),
        permission: tool.permission,
        riskLevel: tool.riskLevel,
        requiresApproval: tool.requiresApproval,
        timeoutMs: tool.timeoutMs,
        rateLimitPerMin: tool.rateLimitPerMin,
        auditPolicy: tool.auditPolicy,
        securityClass: tool.securityClass,
        mutates: tool.mutates,
      },
    });
    count += 1;
  }
  return count;
}

export { describeZod } from './../zod-introspect';
