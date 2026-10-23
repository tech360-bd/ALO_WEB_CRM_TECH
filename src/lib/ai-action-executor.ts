/**
 * AI Action Executor — Risk-aware execution layer for AI commands.
 *
 * Every AI-initiated write goes through this module:
 *   1. Risk is assessed (`assessRisk`) → LOW | MEDIUM | HIGH | CRITICAL.
 *   2. A SHA-256 payload hash is computed (`computePayloadHash`).
 *   3. `executeAiAction`:
 *        - Checks `isGlobalAiPaused()` first.
 *        - Looks up by idempotencyKey — if EXECUTED → cached return.
 *        - If FAILED → retry (subject to max 3 retries).
 *        - On P2002 (race) → fetch + return cached.
 *        - LOW + autoApprove → execute immediately.
 *        - MEDIUM+ → PENDING (awaiting human approval).
 *   4. `approveAndExecute` for human-in-the-loop approval.
 *   5. Failed/uncertain outcomes require reconciliation; generic replay is disabled.
 *
 * Each execution writes an AuditLog with structured JSON details.
 *
 * Model: AiCommandAction (idempotencyKey @unique, retryCount, lastError, ...)
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { isGlobalAiPaused } from "@/lib/ai-safety";

// ─── Types ──────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AiActionParams {
  actionType: string;
  targetType: string;
  targetId?: string | null;
  requestedBy: string;
  aiAgentId?: string | null;
  trigger?: string;
  actor?: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  autoApprove?: boolean; // allow LOW-risk auto-execution
  executor?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface AiActionResult {
  actionId: string;
  status: "EXECUTED" | "PENDING" | "APPROVED" | "EXECUTING" | "REJECTED" | "FAILED" | "PERMANENTLY_FAILED" | "SKIPPED_PAUSED" | "CACHED";
  riskLevel: RiskLevel;
  result?: Record<string, unknown>;
  error?: string;
  cached?: boolean;
  retryCount?: number;
}

// ─── Risk assessment ────────────────────────────────────────────

/**
 * Map action types to risk levels. Heuristics:
 *   - LOW: read-only, tag-write, lead-score, follow-up task creation.
 *   - MEDIUM: lead assignment, status change, message draft creation.
 *   - HIGH: sending external comms (WhatsApp/Email), document status change.
 *   - CRITICAL: payments, visa submission, data deletion, role changes.
 *
 * Payload-level modifiers can escalate risk:
 *   - amount > 1000 → bump to CRITICAL
 *   - contains "delete" or "remove" → bump to HIGH (at least)
 */
export function assessRisk(
  actionType: string,
  payload: Record<string, unknown>
): RiskLevel {
  const LOW_ACTIONS = new Set([
    "READ", "FETCH", "LIST", "TAG_WRITE", "LEAD_SCORE", "FOLLOW_UP_TASK_CREATE",
    "TIMELINE_APPEND", "NOTE_CREATE", "LEAD_TAGGING", "WELCOME_SEND",
  ]);
  const MEDIUM_ACTIONS = new Set([
    "LEAD_ASSIGN", "STATUS_CHANGE", "MESSAGE_DRAFT", "TASK_CREATE", "TASK_ASSIGN",
    "NOTIFICATION_SEND_INTERNAL", "STAGE_UPDATE",
  ]);
  const HIGH_ACTIONS = new Set([
    "MESSAGE_SEND_EXTERNAL", "WHATSAPP_SEND", "EMAIL_SEND", "SMS_SEND",
    "DOC_STATUS_CHANGE", "DOC_APPROVE", "DOC_REJECT", "APPOINTMENT_SCHEDULE",
    "PROFILE_UPDATE",
  ]);
  const CRITICAL_ACTIONS = new Set([
    "PAYMENT_CREATE", "PAYMENT_UPDATE", "PAYMENT_REFUND", "VISA_SUBMIT",
    "DELETE_RECORD", "ROLE_CHANGE", "PERMISSION_CHANGE", "USER_DEACTIVATE",
    "DATA_EXPORT", "COMMISSION_APPROVE", "SALARY_ACCESS",
  ]);

  let level: RiskLevel = "HIGH";
  if (CRITICAL_ACTIONS.has(actionType)) level = "CRITICAL";
  else if (HIGH_ACTIONS.has(actionType)) level = "HIGH";
  else if (MEDIUM_ACTIONS.has(actionType)) level = "MEDIUM";
  else if (LOW_ACTIONS.has(actionType)) level = "LOW";

  // Payload-based escalation
  const payloadStr = JSON.stringify(payload || {}).toLowerCase();
  if (/\b(delete|remove|refund|deactivate|revoke)\b/.test(payloadStr) && level === "LOW") {
    level = "HIGH";
  }
  const amount = (payload as any)?.amount;
  if (typeof amount === "number" && amount > 1000 && (level === "LOW" || level === "MEDIUM")) {
    level = "HIGH";
  }
  if (typeof amount === "number" && amount > 10000) {
    level = "CRITICAL";
  }
  // Recipient = external party → bump to at least HIGH
  if (payload && (payload as any).recipientType === "EXTERNAL_STUDENT" && level === "LOW") {
    level = "HIGH";
  }

  return level;
}

// ─── Payload hashing ────────────────────────────────────────────

/**
 * Compute a stable SHA-256 hash of the payload. Used for change
 * detection — if the same idempotencyKey is reused with a different
 * hash, we know the payload drifted.
 */
export function computePayloadHash(payload: Record<string, unknown>): string {
  const stable = JSON.stringify(sortKeys(payload || {}));
  return crypto.createHash("sha256").update(stable, "utf8").digest("hex");
}

function actionMatchesParams(existing: any, params: AiActionParams): boolean {
  if (
    existing.actionType !== params.actionType ||
    existing.targetType !== params.targetType ||
    (existing.targetId ?? null) !== (params.targetId ?? null) ||
    existing.requestedBy !== params.requestedBy
  ) return false;
  try {
    const savedPayload = JSON.parse(existing.payload || "{}");
    return Boolean(savedPayload && typeof savedPayload === "object" && !Array.isArray(savedPayload))
      && computePayloadHash(savedPayload) === computePayloadHash(params.payload);
  } catch {
    return false;
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return sorted;
  }
  return value;
}

// ─── Execute AI action ──────────────────────────────────────────

/**
 * Execute an AI action with full safety:
 *   1. Global AI pause check → return SKIPPED_PAUSED.
 *   2. IdempotencyKey lookup:
 *        - EXECUTED  → cached return.
 *        - FAILED    → return failure without running the executor again.
 *        - PENDING   → return as-is (still awaiting approval or execution).
 *   3. Create AiCommandAction row (P2002 race-safe).
 *   4. If risk === LOW && autoApprove → execute now.
 *      If risk >= MEDIUM → leave as PENDING (human must approve).
 *      If risk === CRITICAL → never auto-execute (always PENDING).
 *
 * Each execution writes an AuditLog entry with structured JSON.
 */
export async function executeAiAction(params: AiActionParams): Promise<AiActionResult> {
  // 1) Pause check — fail-closed
  const paused = await isGlobalAiPaused();
  if (paused) {
    return {
      actionId: "",
      status: "SKIPPED_PAUSED",
      riskLevel: "LOW",
      error: "Global AI pause is active",
    };
  }

  // 2) Idempotency lookup
  const existing = await db.aiCommandAction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  }).catch(() => null);

  if (existing) {
    if (!actionMatchesParams(existing, params)) {
      return {
        actionId: existing.id,
        status: "FAILED",
        riskLevel: existing.riskLevel as RiskLevel,
        error: "IDEMPOTENCY_KEY_REUSED: this key is bound to a different actor or action payload.",
        retryCount: existing.retryCount,
      };
    }
    if (existing.status === "EXECUTED") {
      return {
        actionId: existing.id,
        status: "CACHED",
        riskLevel: existing.riskLevel as RiskLevel,
        result: safeParseJson(existing.result),
        cached: true,
        retryCount: existing.retryCount,
      };
    }
    if (existing.status === "PENDING") {
      return {
        actionId: existing.id,
        status: "PENDING",
        riskLevel: existing.riskLevel as RiskLevel,
        retryCount: existing.retryCount,
      };
    }
    if (existing.status === "FAILED") {
      // A thrown executor may have completed an external side effect before
      // failing to report it. Replaying here could duplicate that operation.
      // Require reconciliation and a separately authorized, action-specific
      // retry path instead of silently invoking the executor again.
      return {
        actionId: existing.id,
        status: "FAILED",
        riskLevel: existing.riskLevel as RiskLevel,
        error: existing.lastError
          ? `${existing.lastError}. Execution outcome may be uncertain; reconcile before any retry.`
          : "Previous execution failed or is uncertain; reconcile before any retry.",
        retryCount: existing.retryCount,
      };
    }
    // PERMANENTLY_FAILED or other
    return {
      actionId: existing.id,
      status: existing.status as AiActionResult["status"],
      riskLevel: existing.riskLevel as RiskLevel,
      error: existing.lastError ?? undefined,
      retryCount: existing.retryCount,
    };
  }

  // 3) Assess risk
  const riskLevel = assessRisk(params.actionType, params.payload);
  const payloadHash = computePayloadHash(params.payload);

  // 4) Create the AiCommandAction row
  let actionId: string;
  try {
    const created = await db.aiCommandAction.create({
      data: {
        actionType: params.actionType,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        requestedBy: params.requestedBy,
        aiAgentId: params.aiAgentId ?? null,
        trigger: params.trigger ?? null,
        actor: params.actor ?? null,
        idempotencyKey: params.idempotencyKey,
        payload: JSON.stringify(params.payload),
        riskLevel,
        riskFlags: JSON.stringify({ payloadHash }),
        status: "PENDING",
      },
    });
    actionId = created.id;
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Raced — another process created it. Fetch + return cached.
      const raced = await db.aiCommandAction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      }).catch(() => null);
      if (raced) {
        if (!actionMatchesParams(raced, params)) {
          return { actionId: raced.id, status: "FAILED", riskLevel: raced.riskLevel as RiskLevel, error: "IDEMPOTENCY_KEY_REUSED: this key is bound to a different actor or action payload.", retryCount: raced.retryCount };
        }
        return {
          actionId: raced.id,
          status: raced.status === "EXECUTED" ? "CACHED" : (raced.status as AiActionResult["status"]),
          riskLevel: raced.riskLevel as RiskLevel,
          result: safeParseJson(raced.result),
          cached: raced.status === "EXECUTED",
          retryCount: raced.retryCount,
        };
      }
    }
    throw err;
  }

  // 5) Decide: auto-execute or wait for approval
  const canAutoExecute =
    riskLevel === "LOW" && params.autoApprove === true && typeof params.executor === "function";

  if (!canAutoExecute) {
    // MEDIUM+ or no executor provided → leave as PENDING
    return {
      actionId,
      status: "PENDING",
      riskLevel,
      retryCount: 0,
    };
  }

  // 6) Claim auto-execution durably before any side effect. The same status
  // gate is used by the human approval path, preventing a concurrent approval
  // request from racing a low-risk automatic executor.
  let claimed = false;
  try {
    claimed = await db.$transaction(async (tx) => {
      const update = await tx.aiCommandAction.updateMany({
        where: { id: actionId, status: "PENDING", executedAt: null },
        data: { status: "EXECUTING" },
      });
      if (update.count !== 1) return false;
      await tx.auditLog.create({
        data: {
          action: "AI_ACTION",
          resource: "AiCommandAction",
          resourceId: actionId,
          details: JSON.stringify({ action: "AUTO_EXECUTION_CLAIMED", actionType: params.actionType, riskLevel, requestedBy: params.requestedBy }),
        },
      });
      return true;
    });
  } catch (error) {
    console.error(`[ai-action-executor] auto-execution claim failed for ${actionId}:`, error instanceof Error ? error.name : "UnknownError");
    return { actionId, status: "PENDING", riskLevel, retryCount: 0, error: "Execution claim could not be durably recorded; no action was executed." };
  }
  if (!claimed) {
    const current = await db.aiCommandAction.findUnique({ where: { id: actionId } }).catch(() => null);
    return {
      actionId,
      status: current?.status === "EXECUTED" ? "CACHED" : (current?.status as AiActionResult["status"] || "PENDING"),
      riskLevel: (current?.riskLevel || riskLevel) as RiskLevel,
      result: safeParseJson(current?.result),
      cached: current?.status === "EXECUTED",
      retryCount: current?.retryCount ?? 0,
      error: current?.status === "EXECUTING" ? "Another worker owns this action; inspect its durable status." : undefined,
    };
  }
  return await runExecution(actionId, params);
}

// ─── Internal: run execution + update row + audit log ───────────

async function runExecution(
  actionId: string,
  params: AiActionParams
): Promise<AiActionResult> {
  const start = Date.now();
  let success = false;
  let resultData: Record<string, unknown> | undefined;
  let errorMessage: string | undefined;

  try {
    if (typeof params.executor !== "function") throw new Error("No executor provided");
    resultData = await params.executor(params.payload);
    success = true;
  } catch (err: any) {
    errorMessage = err?.message ?? String(err);
    console.error(`[ai-action-executor] execution failed for ${actionId}:`, err instanceof Error ? err.name : "UnknownError");
  }
  const durationMs = Date.now() - start;

  // Completion and its audit are one transaction. If persistence is uncertain
  // after a side effect, keep the row in EXECUTING so no generic retry can replay it.
  try {
    const committed = await db.$transaction(async (tx) => {
      const update = await tx.aiCommandAction.updateMany({
        where: { id: actionId, status: "EXECUTING", executedAt: null },
        data: {
          status: success ? "EXECUTED" : "FAILED",
          result: resultData ? JSON.stringify(resultData) : null,
          lastError: errorMessage ?? null,
          executedAt: success ? new Date() : null,
        },
      });
      if (update.count !== 1) return false;
      await tx.auditLog.create({
        data: {
          action: "AI_ACTION",
          resource: "AiCommandAction",
          resourceId: actionId,
          details: JSON.stringify({
            actionType: params.actionType,
            targetType: params.targetType,
            targetId: params.targetId,
            requestedBy: params.requestedBy,
            aiAgentId: params.aiAgentId,
            trigger: params.trigger,
            actor: params.actor,
            idempotencyKey: params.idempotencyKey,
            success,
            errorMessage,
            durationMs,
            result: resultData ?? null,
          }),
        },
      });
      return true;
    });
    if (!committed) {
      const current = await db.aiCommandAction.findUnique({ where: { id: actionId } }).catch(() => null);
      return {
        actionId,
        status: current?.status === "EXECUTED" ? "CACHED" : (current?.status as AiActionResult["status"] || "EXECUTING"),
        riskLevel: (current?.riskLevel || assessRisk(params.actionType, params.payload)) as RiskLevel,
        result: safeParseJson(current?.result),
        cached: current?.status === "EXECUTED",
        retryCount: current?.retryCount ?? 0,
        error: "Execution result could not be claimed for completion; inspect the durable action state before retrying.",
      };
    }
  } catch (err) {
    console.error(`[ai-action-executor] completion commit failed for ${actionId}:`, err instanceof Error ? err.name : "UnknownError");
    return {
      actionId,
      status: "EXECUTING",
      riskLevel: assessRisk(params.actionType, params.payload),
      error: "Execution outcome is uncertain and the action remains claimed. Inspect and reconcile before retrying.",
    };
  }

  return {
    actionId,
    status: success ? "EXECUTED" : "FAILED",
    riskLevel: assessRisk(params.actionType, params.payload),
    result: resultData,
    error: errorMessage,
    retryCount: 0,
  };
}

// ─── Public: explicit retry ─────────────────────────────────────

/**
 * Compatibility inspector for callers of the old retry API. It is intentionally
 * read-only: a generic executor failure may have followed a successful side effect.
 */
export async function retryFailedAction(actionId: string): Promise<AiActionResult> {
  const action = await db.aiCommandAction.findUnique({ where: { id: actionId } });
  if (!action) {
    return { actionId, status: "FAILED", riskLevel: "LOW", error: "Action not found" };
  }
  if (action.status === "EXECUTED") {
    return {
      actionId,
      status: "CACHED",
      riskLevel: action.riskLevel as RiskLevel,
      result: safeParseJson(action.result),
      cached: true,
      retryCount: action.retryCount,
    };
  }
  if (action.status === "PENDING" || action.status === "APPROVED" || action.status === "EXECUTING") {
    return {
      actionId,
      status: action.status,
      riskLevel: action.riskLevel as RiskLevel,
      retryCount: action.retryCount,
      error: action.status === "EXECUTING" ? "Another worker owns this action; inspect its durable status." : undefined,
    };
  }
  return {
    actionId,
    status: action.status as AiActionResult["status"],
    riskLevel: action.riskLevel as RiskLevel,
    error: "Automatic retry is disabled because a failed executor may have completed a side effect. Reconcile the action before creating a replacement.",
    retryCount: action.retryCount,
  };
}

// ─── Public: approve + execute ──────────────────────────────────

/**
 * Approve a PENDING action and execute it. Only callable by a human.
 */
export async function approveAndExecute(
  actionId: string,
  approvedBy: string,
  executor?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>
): Promise<AiActionResult> {
  const action = await db.aiCommandAction.findUnique({ where: { id: actionId } });
  if (!action) {
    return { actionId, status: "FAILED", riskLevel: "HIGH", error: "Action not found" };
  }
  if (action.status === "EXECUTED") {
    return {
      actionId,
      status: "CACHED",
      riskLevel: action.riskLevel as RiskLevel,
      result: safeParseJson(action.result),
      cached: true,
      retryCount: action.retryCount,
    };
  }
  if (action.status !== "PENDING" && action.status !== "APPROVED") {
    return {
      actionId,
      status: action.status === "EXECUTING" ? "EXECUTING" : action.status === "REJECTED" ? "REJECTED" : "FAILED",
      riskLevel: action.riskLevel as RiskLevel,
      retryCount: action.retryCount,
      error: action.status === "EXECUTING"
        ? "Another worker already claimed this action; inspect the action record before retrying."
        : `Action is not awaiting approval (current status: ${action.status}).`,
    };
  }

  // Claim the action and persist the human approval audit atomically. A single
  // compare-and-set winner may run the callback; concurrent/replayed requests
  // cannot execute the same non-idempotent action twice.
  let claimed = false;
  try {
    claimed = await db.$transaction(async (tx) => {
      const result = await tx.aiCommandAction.updateMany({
        where: { id: actionId, status: action.status, executedAt: null },
        data: { approvedBy, approvedAt: new Date(), status: "EXECUTING" },
      });
      if (result.count !== 1) return false;
      await tx.auditLog.create({
        data: {
          userId: approvedBy,
          action: "AI_ACTION",
          resource: "AiCommandAction",
          resourceId: actionId,
          details: JSON.stringify({ action: "APPROVED_FOR_EXECUTION", approvedBy, actionType: action.actionType, riskLevel: action.riskLevel }),
        },
      });
      return true;
    });
  } catch (error) {
    console.error(`[ai-action-executor] approval claim failed for ${actionId}:`, error instanceof Error ? error.name : "UnknownError");
    return { actionId, status: "FAILED", riskLevel: action.riskLevel as RiskLevel, retryCount: action.retryCount, error: "Approval could not be durably recorded; no action was executed." };
  }

  if (!claimed) {
    const current = await db.aiCommandAction.findUnique({ where: { id: actionId } });
    if (current?.status === "EXECUTED") {
      return { actionId, status: "CACHED", riskLevel: current.riskLevel as RiskLevel, result: safeParseJson(current.result), cached: true, retryCount: current.retryCount };
    }
    return {
      actionId,
      status: current?.status === "EXECUTING" ? "EXECUTING" : current?.status === "REJECTED" ? "REJECTED" : "FAILED",
      riskLevel: (current?.riskLevel || action.riskLevel) as RiskLevel,
      retryCount: current?.retryCount ?? action.retryCount,
      error: `Action could not be claimed for approval (current status: ${current?.status || "missing"}).`,
    };
  }

  // No executor means no side effect. Restore the approval queue state using a
  // compare-and-set so a later, authorized request may supply the handler.
  if (typeof executor !== "function") {
    await db.aiCommandAction.updateMany({
      where: { id: actionId, status: "EXECUTING", approvedBy },
      data: { status: "APPROVED" },
    });
    return { actionId, status: "APPROVED", riskLevel: action.riskLevel as RiskLevel, retryCount: action.retryCount };
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = action.payload ? JSON.parse(action.payload) : {};
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) payload = {};
  } catch {
    payload = {};
  }
  return await runExecution(actionId, {
    actionType: action.actionType,
    targetType: action.targetType,
    targetId: action.targetId,
    requestedBy: action.requestedBy,
    aiAgentId: action.aiAgentId,
    trigger: action.trigger ?? undefined,
    actor: action.actor ?? undefined,
    idempotencyKey: action.idempotencyKey ?? `approve-${actionId}`,
    payload,
    autoApprove: true,
    executor,
  });
}

// ─── JSON helpers ───────────────────────────────────────────────

function safeParseJson(s: string | null | undefined): Record<string, unknown> | undefined {
  if (!s) return undefined;
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : { value: v };
  } catch {
    return undefined;
  }
}
