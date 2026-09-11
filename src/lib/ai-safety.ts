/**
 * AI Safety — Global & Scoped AI Pause Controls
 *
 * Server-side safety override for the entire ALO AI automation layer.
 * Fail-closed: on DB errors we return TRUE (paused) so no automated
 * action proceeds when the safety state cannot be verified.
 *
 * Models:
 *   - GlobalAiPause { scope, targetId, active, reason, activatedBy, ... }
 *
 * Scope values:
 *   - "GLOBAL"  — system-wide kill switch (no targetId)
 *   - "WORKFLOW"|'LEAD'|'STUDENT'|'CHANNEL'|'AGENT' — scoped pause
 */

import { db } from "@/lib/db";

export type AiPauseScope =
  | "GLOBAL"
  | "WORKFLOW"
  | "LEAD"
  | "STUDENT"
  | "CHANNEL"
  | "AGENT";

export interface AiPauseStatus {
  globalPaused: boolean;
  globalReason?: string | null;
  globalActivatedBy?: string | null;
  globalActivatedAt?: Date | null;
  scopedPauses: Array<{
    id: string;
    scope: string;
    targetId: string | null;
    reason: string | null;
    activatedBy: string | null;
    activatedAt: Date | null;
  }>;
}

/**
 * Check whether GLOBAL AI pause is active.
 *
 * Fail-closed: returns true on DB error so automations stop.
 */
export async function isGlobalAiPaused(): Promise<boolean> {
  try {
    const record = await db.globalAiPause.findFirst({
      where: { scope: "GLOBAL", active: true },
    });
    return Boolean(record);
  } catch (err) {
    console.error("[ai-safety] isGlobalAiPaused error — failing closed (paused=true):", err);
    return true;
  }
}

/**
 * Check whether a scoped AI pause is active.
 *
 * If `targetId` is omitted, checks for ANY active pause with the given scope.
 * Fail-closed: returns true on DB error.
 */
export async function isScopedAiPaused(
  scope: AiPauseScope | string,
  targetId?: string | null
): Promise<boolean> {
  try {
    const where: any = { scope, active: true };
    if (targetId !== undefined && targetId !== null) {
      where.targetId = targetId;
    }
    const record = await db.globalAiPause.findFirst({ where });
    return Boolean(record);
  } catch (err) {
    console.error("[ai-safety] isScopedAiPaused error — failing closed (paused=true):", err);
    return true;
  }
}

/**
 * Activate the GLOBAL AI pause. Idempotent — finds existing GLOBAL row
 * (targetId is null so the compound unique key cannot be used directly
 * in a Prisma `upsert`, hence findFirst + update/create).
 */
export async function activateGlobalPause(
  reason: string,
  activatedBy: string
): Promise<void> {
  const now = new Date();
  try {
    const existing = await db.globalAiPause.findFirst({
      where: { scope: "GLOBAL" },
    });

    if (existing) {
      await db.globalAiPause.update({
        where: { id: existing.id },
        data: {
          active: true,
          reason,
          activatedBy,
          activatedAt: now,
          deactivatedBy: null,
          deactivatedAt: null,
        },
      });
    } else {
      await db.globalAiPause.create({
        data: {
          scope: "GLOBAL",
          targetId: null,
          active: true,
          reason,
          activatedBy,
          activatedAt: now,
        },
      });
    }

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "GlobalAiPause",
        details: JSON.stringify({
          action: "ACTIVATE_GLOBAL_PAUSE",
          reason,
          activatedBy,
          at: now.toISOString(),
        }),
      },
    }).catch(() => {});
  } catch (err) {
    console.error("[ai-safety] activateGlobalPause error:", err);
    throw err;
  }
}

/**
 * Deactivate the GLOBAL AI pause.
 */
export async function deactivateGlobalPause(deactivatedBy: string): Promise<void> {
  const now = new Date();
  try {
    await db.globalAiPause.updateMany({
      where: { scope: "GLOBAL", active: true },
      data: { active: false, deactivatedBy, deactivatedAt: now },
    });

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "GlobalAiPause",
        details: JSON.stringify({
          action: "DEACTIVATE_GLOBAL_PAUSE",
          deactivatedBy,
          at: now.toISOString(),
        }),
      },
    }).catch(() => {});
  } catch (err) {
    console.error("[ai-safety] deactivateGlobalPause error:", err);
    throw err;
  }
}

/**
 * Activate a scoped pause. Idempotent via upsert on (scope, targetId).
 */
export async function activateScopedPause(
  scope: AiPauseScope | string,
  targetId: string,
  reason: string,
  activatedBy: string
): Promise<void> {
  const now = new Date();
  try {
    await db.globalAiPause.upsert({
      where: { scope_targetId: { scope, targetId } },
      update: { active: true, reason, activatedBy, activatedAt: now, deactivatedBy: null, deactivatedAt: null },
      create: { scope, targetId, active: true, reason, activatedBy, activatedAt: now },
    });

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "GlobalAiPause",
        resourceId: targetId,
        details: JSON.stringify({
          action: "ACTIVATE_SCOPED_PAUSE",
          scope,
          targetId,
          reason,
          activatedBy,
          at: now.toISOString(),
        }),
      },
    }).catch(() => {});
  } catch (err) {
    console.error("[ai-safety] activateScopedPause error:", err);
    throw err;
  }
}

/**
 * Deactivate a scoped pause.
 */
export async function deactivateScopedPause(
  scope: AiPauseScope | string,
  targetId: string,
  deactivatedBy: string
): Promise<void> {
  const now = new Date();
  try {
    await db.globalAiPause.updateMany({
      where: { scope, targetId, active: true },
      data: { active: false, deactivatedBy, deactivatedAt: now },
    });

    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "GlobalAiPause",
        resourceId: targetId,
        details: JSON.stringify({
          action: "DEACTIVATE_SCOPED_PAUSE",
          scope,
          targetId,
          deactivatedBy,
          at: now.toISOString(),
        }),
      },
    }).catch(() => {});
  } catch (err) {
    console.error("[ai-safety] deactivateScopedPause error:", err);
    throw err;
  }
}

/**
 * Get full pause status (global + all active scoped pauses).
 *
 * Fail-closed: on DB error, returns { globalPaused: true, scopedPauses: [] }.
 */
export async function getPauseStatus(): Promise<AiPauseStatus> {
  try {
    const globalRecord = await db.globalAiPause.findFirst({
      where: { scope: "GLOBAL", active: true },
    });

    const scopedRecords = await db.globalAiPause.findMany({
      where: { active: true, scope: { not: "GLOBAL" } },
      orderBy: { activatedAt: "desc" },
    });

    return {
      globalPaused: Boolean(globalRecord),
      globalReason: globalRecord?.reason ?? null,
      globalActivatedBy: globalRecord?.activatedBy ?? null,
      globalActivatedAt: globalRecord?.activatedAt ?? null,
      scopedPauses: scopedRecords.map((r) => ({
        id: r.id,
        scope: r.scope,
        targetId: r.targetId,
        reason: r.reason,
        activatedBy: r.activatedBy,
        activatedAt: r.activatedAt,
      })),
    };
  } catch (err) {
    console.error("[ai-safety] getPauseStatus error — failing closed:", err);
    return {
      globalPaused: true,
      globalReason: "Failed to query pause status — fail-closed",
      globalActivatedBy: null,
      globalActivatedAt: null,
      scopedPauses: [],
    };
  }
}
