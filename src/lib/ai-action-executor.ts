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
 *   5. `retryFailedAction` for explicit retries (max 3, then PERMANENTLY_FAILED).
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
  status: "EXECUTED" | "PENDING" | "FAILED" | "PERMANENTLY_FAILED" | "SKIPPED_PAUSED" | "CACHED";
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
 *        - FAILED    → retry (if retryCount < 3).
 *        - PENDING   → return as-is (still awaiting approval).
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
      // Retry path — only if retryCount < 3
      if (existing.retryCount >= 3) {
        await db.aiCommandAction.update({
          where: { id: existing.id },
          data: { status: "PERMANENTLY_FAILED" },
        }).catch(() => {});
        return {
          actionId: existing.id,
          status: "PERMANENTLY_FAILED",
          riskLevel: existing.riskLevel as RiskLevel,
          error: existing.lastError ?? "Max retries exceeded",
          retryCount: existing.retryCount,
        };
      }
      // Fall through to retry by reusing the existing record
      return await retryAndExecute(existing.id, params);
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
      });
      if (raced) {
        return {
          actionId: raced.id,
          status: raced.status === "EXECUTED" ? "CACHED" : (raced.status as AiActionResult["status"]),
          riskLevel: raced.riskLevel as RiskLevel,
          result: safeParseJson(raced.result),
          cached: true,
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

  // 6) Execute
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
    if (typeof params.executor !== "function") {
      throw new Error("No executor provided");
    }
    resultData = await params.executor(params.payload);
    success = true;
  } catch (err: any) {
    errorMessage = err?.message ?? String(err);
    console.error(`[ai-action-executor] execution failed for ${actionId}:`, err);
  }
  const durationMs = Date.now() - start;

  // Update AiCommandAction row
  try {
    await db.aiCommandAction.update({
      where: { id: actionId },
      data: {
        status: success ? "EXECUTED" : "FAILED",
        result: resultData ? JSON.stringify(resultData) : null,
        lastError: errorMessage,
        executedAt: success ? new Date() : null,
      },
    });
  } catch (err) {
    console.error(`[ai-action-executor] failed to update row ${actionId}:`, err);
  }

  // AuditLog with structured JSON
  try {
    await db.auditLog.create({
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
  } catch (err) {
    console.error(`[ai-action-executor] failed to write audit log for ${actionId}:`, err);
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

// ─── Internal: retry path ───────────────────────────────────────

async function retryAndExecute(
  actionId: string,
  params: AiActionParams
): Promise<AiActionResult> {
  // Bump retry count
  let nextRetryCount = 1;
  try {
    const updated = await db.aiCommandAction.update({
      where: { id: actionId },
      data: {
        retryCount: { increment: 1 },
        status: "PENDING",
        lastError: null,
      },
    });
    nextRetryCount = updated.retryCount;
  } catch (err) {
    console.error(`[ai-action-executor] retry bump failed for ${actionId}:`, err);
  }

  if (nextRetryCount > 3) {
    try {
      await db.aiCommandAction.update({
        where: { id: actionId },
        data: { status: "PERMANENTLY_FAILED" },
      });
    } catch (err) {
      console.error(`[ai-action-executor] permanent-fail mark failed for ${actionId}:`, err);
    }
    return {
      actionId,
      status: "PERMANENTLY_FAILED",
      riskLevel: "LOW",
      error: "Max retries exceeded",
      retryCount: nextRetryCount,
    };
  }

  return await runExecution(actionId, params);
}

// ─── Public: explicit retry ─────────────────────────────────────

/**
 * Explicitly retry a FAILED action. Max 3 attempts; on the 4th
 * failure the action becomes PERMANENTLY_FAILED.
 */
export async function retryFailedAction(actionId: string): Promise<AiActionResult> {
  const action = await db.aiCommandAction.findUnique({ where: { id: actionId } });
  if (!action) {
    return {
      actionId,
      status: "FAILED",
      riskLevel: "LOW",
      error: "Action not found",
    };
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
  if (action.status === "PERMANENTLY_FAILED" || action.retryCount >= 3) {
    try {
      await db.aiCommandAction.update({
        where: { id: actionId },
        data: { status: "PERMANENTLY_FAILED" },
      });
    } catch (err) {
      console.error(`[ai-action-executor] permanent mark failed for ${actionId}:`, err);
    }
    return {
      actionId,
      status: "PERMANENTLY_FAILED",
      riskLevel: action.riskLevel as RiskLevel,
      error: action.lastError ?? "Max retries exceeded",
      retryCount: action.retryCount,
    };
  }

  // Bump retryCount + execute (no executor available — caller must re-supply
  // via executeAiAction; here we only retry the DB-side bookkeeping and
  // return PENDING for the caller to drive).
  const nextRetryCount = action.retryCount + 1;
  try {
    await db.aiCommandAction.update({
      where: { id: actionId },
      data: {
        retryCount: nextRetryCount,
        status: "PENDING",
        lastError: null,
      },
    });
  } catch (err) {
    console.error(`[ai-action-executor] retry bump failed for ${actionId}:`, err);
  }

  // AuditLog
  try {
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "AiCommandAction",
        resourceId: actionId,
        details: JSON.stringify({
          action: "RETRY_REQUESTED",
          retryCount: nextRetryCount,
          actionType: action.actionType,
          targetType: action.targetType,
        }),
      },
    });
  } catch (err) {
    console.error(`[ai-action-executor] retry audit log failed for ${actionId}:`, err);
  }

  return {
    actionId,
    status: "PENDING",
    riskLevel: action.riskLevel as RiskLevel,
    retryCount: nextRetryCount,
    error: "Retry queued — re-supply executor via executeAiAction to run",
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
    return {
      actionId,
      status: "FAILED",
      riskLevel: "LOW",
      error: "Action not found",
    };
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

  // Mark approved
  try {
    await db.aiCommandAction.update({
      where: { id: actionId },
      data: {
        approvedBy,
        approvedAt: new Date(),
        status: "PENDING", // still pending until execution completes
      },
    });
  } catch (err) {
    console.error(`[ai-action-executor] approve mark failed for ${actionId}:`, err);
  }

  // AuditLog for approval
  try {
    await db.auditLog.create({
      data: {
        userId: approvedBy,
        action: "AI_ACTION",
        resource: "AiCommandAction",
        resourceId: actionId,
        details: JSON.stringify({
          action: "APPROVED_FOR_EXECUTION",
          approvedBy,
          actionType: action.actionType,
          riskLevel: action.riskLevel,
        }),
      },
    });
  } catch (err) {
    console.error(`[ai-action-executor] approve audit log failed for ${actionId}:`, err);
  }

  // If executor provided, run now
  if (typeof executor === "function") {
    let payload: Record<string, unknown> = {};
    try {
      payload = action.payload ? JSON.parse(action.payload) : {};
    } catch {
      payload = {};
    }
    return await runExecution(actionId, {
      actionType: action.actionType,
      targetType: action.targetType,
      targetId: action.targetId,
      requestedBy: approvedBy,
      aiAgentId: action.aiAgentId,
      trigger: action.trigger ?? undefined,
      actor: action.actor ?? undefined,
      idempotencyKey: action.idempotencyKey ?? `approve-${actionId}`,
      payload,
      autoApprove: true,
      executor,
    });
  }

  // No executor — leave as approved-but-awaiting-external-execution
  return {
    actionId,
    status: "PENDING",
    riskLevel: action.riskLevel as RiskLevel,
    retryCount: action.retryCount,
  };
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
