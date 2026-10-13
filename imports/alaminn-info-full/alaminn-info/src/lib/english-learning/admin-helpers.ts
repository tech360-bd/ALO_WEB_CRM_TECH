/**
 * English Learning admin API helpers — shared utilities for the
 * /api/v1/english-learning/admin/* route family.
 * --------------------------------------------------------------------
 * Mirrors `src/lib/higher-study/admin-helpers.ts`. Provides:
 *  - `writeAuditLog()` — persists an EnglishLearningAuditLog entry.
 *  - `resolveActor()` — extracts { userId, ipHash, userAgent }.
 *  - `parseBody()` — safe JSON body parser.
 *  - `slugifyUnique()` — generates a slug + verifies uniqueness.
 *  - `applyVerificationUpdate()` — bumps `lastVerifiedAt`/`lastVerifiedBy`.
 *  - Common error envelopes (validationError, notFoundError, internalError).
 *  - `pickFields()`, `toNumberOrNull`, `toDateOrNull`, `toBooleanOrNull`.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
  slugify,
} from "@/lib/english-learning/api-helpers";

// ─── Audit log writer ────────────────────────────────────────────────

export interface AuditContext {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entitySlug?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipHash?: string | null;
  userAgent?: string | null;
}

export async function writeAuditLog(ctx: AuditContext): Promise<void> {
  try {
    await db.englishLearningAuditLog.create({
      data: {
        actorUserId: ctx.actorUserId ?? null,
        action: safeString(ctx.action).slice(0, 80) || "update",
        entityType: safeString(ctx.entityType).slice(0, 60) || "unknown",
        entityId: safeString(ctx.entityId).slice(0, 60) || "unknown",
        beforeData:
          ctx.beforeData !== undefined
            ? (toJsonObject(ctx.beforeData) as never)
            : undefined,
        afterData:
          ctx.afterData !== undefined
            ? (toJsonObject(ctx.afterData) as never)
            : undefined,
        ipHash: ctx.ipHash ?? null,
        userAgent: ctx.userAgent ? safeString(ctx.userAgent).slice(0, 500) : null,
      },
    });
  } catch (err) {
    console.error("[english-learning] audit log write failed", err);
  }
}

/**
 * Coerce an unknown value to a Prisma-compatible JSON object. Strings,
 * numbers, booleans, arrays and plain objects are returned as-is (cast
 * to `unknown`); `null` is preserved; `undefined` returns `null`.
 */
function toJsonObject(v: unknown): unknown {
  if (v === undefined) return null;
  if (v === null) return null;
  if (typeof v === "string") {
    try {
      // If the string is already JSON, parse it; otherwise wrap as { value: ... }.
      const parsed = JSON.parse(v);
      return parsed;
    } catch {
      return { value: v };
    }
  }
  return v;
}

export function resolveActor(
  req: NextRequest,
  userId?: string | null,
): { userId: string | null; ipHash: string; userAgent: string } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return {
    userId: userId ?? null,
    ipHash: hashIp(
      ip,
      process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
    ),
    userAgent: req.headers.get("user-agent") ?? "",
  };
}

// ─── Body parsing ────────────────────────────────────────────────────

export async function parseBody<T = Record<string, unknown>>(
  req: NextRequest,
): Promise<T | null> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as T;
  } catch {
    return null;
  }
}

// ─── Common error envelopes ──────────────────────────────────────────

export function validationError(message: string, errors: unknown[]) {
  return jsonResponse(false, message, null, {}, errors, 400);
}

export function notFoundError(message = "Entity not found.") {
  return jsonResponse(false, message, null, {}, ["not_found"], 404);
}

export function internalError(message = "Internal server error.") {
  return jsonResponse(false, message, null, {}, ["internal"], 500);
}

// ─── Verification update helper ──────────────────────────────────────

export function applyVerificationUpdate(
  before: { verificationStatus?: string | null } | null,
  after: Record<string, unknown>,
  actorUserId: string | null,
): Record<string, unknown> {
  const next = after.verificationStatus;
  if (next && typeof next === "string" && next !== before?.verificationStatus) {
    return {
      ...after,
      lastVerifiedAt: new Date(),
      lastVerifiedBy: actorUserId ?? null,
    };
  }
  return after;
}

// ─── Slug helpers ────────────────────────────────────────────────────

export async function slugifyUnique(
  source: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(source) || `entity-${Date.now().toString(36)}`;
  let candidate = base;
  let i = 2;
  while (i < 1000) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${base}-${i}`;
    i += 1;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// ─── Coercion helpers ────────────────────────────────────────────────

export function pickFields<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowed: readonly (keyof T)[],
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) out[key as string] = body[key as string];
  }
  return out as Partial<T>;
}

export function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function toBooleanOrNull(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return null;
}
