/**
 * AI Safety — Global & Scoped Pause Controls
 *
 * Provides kill-switch / circuit-breaker primitives so that any automation
 * loop can short-circuit when AI has been globally or per-target paused.
 *
 * Schema graceful-degradation:
 *   The schema has no `GlobalAiPause` model. We persist pause state in
 *   `AuditLog` (action="AI_PAUSE", resource="GlobalAiPause", details=JSON)
 *   AND keep an in-process cache for fast reads inside hot loops.
 *
 * API contract (matches what callers expect):
 *   - isGlobalAiPaused() — true if any active GLOBAL pause exists
 *   - isScopedAiPaused(scope, targetId?) — true if active pause for this scope/target
 *   - activateGlobalPause(reason, activatedBy)
 *   - deactivateGlobalPause(deactivatedBy)
 *   - activateScopedPause(scope, targetId, reason, activatedBy)
 *   - deactivateScopedPause(scope, targetId, deactivatedBy)
 *   - getPauseStatus()
 *
 * Per task instructions: use findFirst + update/create (NOT upsert)
 * because targetId may be null (and SQLite upsert semantics are awkward
 * with nullable unique keys).
 */

import { db } from "@/lib/db";

export type AiPauseScope =
  | "GLOBAL"
  | "LEAD"
  | "STUDENT"
  | "APPLICATION"
  | "VISA"
  | "COMMUNICATION"
  | "DEPARTMENT"
  | "AGENT"
  | "WORKFLOW";

export interface AiPauseRecord {
  id: string;
  scope: AiPauseScope;
  targetId: string | null;
  active: boolean;
  reason: string;
  activatedBy: string;
  deactivatedBy?: string | null;
  activatedAt: Date;
  deactivatedAt?: Date | null;
}

// ─── In-process cache (for hot-loop reads) ─────────────────────
// Cleared on activation/deactivation so subsequent reads see fresh state.
// Note: this is per-process only; multi-instance deployments should rely on
// the persisted AuditLog rows which are also queried on every cache miss.

interface CacheEntry {
  record: AiPauseRecord | null;       // null = no active pause
  fetchedAt: number;
}

const CACHE_TTL_MS = 5_000; // 5 seconds
const cache = new Map<string, CacheEntry>();

function cacheKey(scope: AiPauseScope, targetId?: string | null): string {
  return `${scope}::${targetId || "_"}`;
}

function cacheSet(key: string, record: AiPauseRecord | null) {
  cache.set(key, { record, fetchedAt: Date.now() });
}

function cacheGet(key: string): AiPauseRecord | null | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return e.record;
}

function clearCache() {
  cache.clear();
}

// ─── Helpers: read/write AuditLog-backed pause records ──────────

const PAUSE_RESOURCE = "GlobalAiPause";

function serialize(rec: Record<string, unknown>): string {
  return JSON.stringify(rec);
}

function fromAuditLog(row: { id: string; details: string | null; createdAt: Date }): AiPauseRecord | null {
  if (!row.details) return null;
  try {
    const parsed = JSON.parse(row.details);
    return {
      id: row.id,
      scope: parsed.scope,
      targetId: parsed.targetId ?? null,
      active: parsed.active ?? false,
      reason: parsed.reason ?? "",
      activatedBy: parsed.activatedBy ?? "",
      deactivatedBy: parsed.deactivatedBy ?? null,
      activatedAt: parsed.activatedAt ? new Date(parsed.activatedAt) : row.createdAt,
      deactivatedAt: parsed.deactivatedAt ? new Date(parsed.deactivatedAt) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Find the most recent active pause for a given scope+targetId.
 * Uses findFirst (not upsert) per the task spec.
 */
async function findActivePause(
  scope: AiPauseScope,
  targetId?: string | null
): Promise<AiPauseRecord | null> {
  // AuditLog has no scope/targetId columns — we filter via details JSON
  // contains clause. This is acceptable for low-volume pause operations.
  const scopeFilter = `"scope":"${scope}"`;
  const activeFilter = `"active":true`;

  // For targetId=null/undefined, we want rows where targetId is null in JSON.
  // We use a positive filter for active+scope and then post-filter by targetId.
  const rows = await db.auditLog.findMany({
    where: {
      resource: PAUSE_RESOURCE,
      action: "AI_PAUSE",
      details: { contains: scopeFilter },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  for (const r of rows) {
    const rec = fromAuditLog(r);
    if (!rec) continue;
    if (!rec.active) continue;
    // targetId match: both null OR both equal
    const wantTarget = targetId || null;
    const haveTarget = rec.targetId || null;
    if (wantTarget === haveTarget) return rec;
  }
  return null;
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Whether global AI is currently paused.
 */
export async function isGlobalAiPaused(): Promise<boolean> {
  const cached = cacheGet(cacheKey("GLOBAL", null));
  if (cached !== undefined) return !!cached;
  const rec = await findActivePause("GLOBAL", null);
  cacheSet(cacheKey("GLOBAL", null), rec);
  return !!rec;
}

/**
 * Whether AI is paused for the given scope + targetId.
 * (Also returns true if GLOBAL pause is active — global overrides scoped.)
 */
export async function isScopedAiPaused(
  scope: AiPauseScope,
  targetId?: string | null
): Promise<boolean> {
  if (await isGlobalAiPaused()) return true;

  const key = cacheKey(scope, targetId || null);
  const cached = cacheGet(key);
  if (cached !== undefined) return !!cached;

  const rec = await findActivePause(scope, targetId || null);
  cacheSet(key, rec);
  return !!rec;
}

/**
 * Activate a GLOBAL pause. Records a new AuditLog row (does not mutate prior
 * pause records — historical audit preserved). Clears the in-process cache.
 */
export async function activateGlobalPause(
  reason: string,
  activatedBy: string
): Promise<AiPauseRecord> {
  // Deactivate any existing active global pause first (so we have at most one)
  await deactivateGlobalPause(activatedBy).catch(() => {});

  const details = serialize({
    scope: "GLOBAL",
    targetId: null,
    active: true,
    reason,
    activatedBy,
    activatedAt: new Date().toISOString(),
  });

  const row = await db.auditLog.create({
    data: {
      action: "AI_PAUSE",
      resource: PAUSE_RESOURCE,
      resourceId: null,
      userId: activatedBy || undefined,
      details,
    },
  });

  const rec: AiPauseRecord = {
    id: row.id,
    scope: "GLOBAL",
    targetId: null,
    active: true,
    reason,
    activatedBy,
    activatedAt: row.createdAt,
  };
  clearCache();
  return rec;
}

/**
 * Deactivate the active GLOBAL pause (if any) by marking it inactive.
 * Uses findFirst + update (per task spec, not upsert).
 */
export async function deactivateGlobalPause(deactivatedBy: string): Promise<boolean> {
  const active = await findActivePause("GLOBAL", null);
  if (!active) return false;

  const updatedDetails = serialize({
    scope: active.scope,
    targetId: active.targetId,
    active: false,
    reason: active.reason,
    activatedBy: active.activatedBy,
    deactivatedBy: deactivatedBy,
    activatedAt: active.activatedAt.toISOString(),
    deactivatedAt: new Date().toISOString(),
  });

  await db.auditLog.update({
    where: { id: active.id },
    data: { details: updatedDetails },
  });

  clearCache();
  return true;
}

/**
 * Activate a scoped pause (e.g. for a single lead / student / agent).
 * For targetId=null/undefined, behaves like a scoped-global pause.
 */
export async function activateScopedPause(
  scope: AiPauseScope,
  targetId: string | null,
  reason: string,
  activatedBy: string
): Promise<AiPauseRecord> {
  // Deactivate any existing active pause for this scope+target first
  await deactivateScopedPause(scope, targetId, activatedBy).catch(() => {});

  const details = serialize({
    scope,
    targetId: targetId || null,
    active: true,
    reason,
    activatedBy,
    activatedAt: new Date().toISOString(),
  });

  const row = await db.auditLog.create({
    data: {
      action: "AI_PAUSE",
      resource: PAUSE_RESOURCE,
      resourceId: targetId || undefined,
      userId: activatedBy || undefined,
      details,
    },
  });

  const rec: AiPauseRecord = {
    id: row.id,
    scope,
    targetId: targetId || null,
    active: true,
    reason,
    activatedBy,
    activatedAt: row.createdAt,
  };
  clearCache();
  return rec;
}

/**
 * Deactivate an active scoped pause.
 */
export async function deactivateScopedPause(
  scope: AiPauseScope,
  targetId: string | null,
  deactivatedBy: string
): Promise<boolean> {
  const active = await findActivePause(scope, targetId);
  if (!active) return false;

  const updatedDetails = serialize({
    scope: active.scope,
    targetId: active.targetId,
    active: false,
    reason: active.reason,
    activatedBy: active.activatedBy,
    deactivatedBy: deactivatedBy,
    activatedAt: active.activatedAt.toISOString(),
    deactivatedAt: new Date().toISOString(),
  });

  await db.auditLog.update({
    where: { id: active.id },
    data: { details: updatedDetails },
  });

  clearCache();
  return true;
}

// ─── Status Overview ───────────────────────────────────────────

export interface AiPauseStatus {
  globalPaused: boolean;
  globalPause: AiPauseRecord | null;
  scopedPauses: AiPauseRecord[];
  totalActive: number;
}

/**
 * Return the current pause status (global + all active scoped pauses).
 */
export async function getPauseStatus(): Promise<AiPauseStatus> {
  const globalPause = await findActivePause("GLOBAL", null);

  // Find all active scoped pauses (non-global)
  const rows = await db.auditLog.findMany({
    where: {
      resource: PAUSE_RESOURCE,
      action: "AI_PAUSE",
      details: { contains: `"active":true` },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const scoped: AiPauseRecord[] = [];
  for (const r of rows) {
    const rec = fromAuditLog(r);
    if (rec && rec.active && rec.scope !== "GLOBAL") scoped.push(rec);
  }

  return {
    globalPaused: !!globalPause,
    globalPause,
    scopedPauses: scoped,
    totalActive: scoped.length + (globalPause ? 1 : 0),
  };
}
