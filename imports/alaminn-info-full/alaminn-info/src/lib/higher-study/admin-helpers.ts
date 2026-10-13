/**
 * Higher Study admin API helpers — shared utilities for the
 * /api/v1/higher-study/admin/* route family.
 * --------------------------------------------------------------------
 * Provides:
 *  - `writeAuditLog()` — persists a HigherStudyAuditLog entry for every
 *    create/update/delete/publish/verify/import action.
 *  - `resolveActor()` — extracts { userId, ipHash, userAgent } from a
 *    NextRequest + authenticated session.
 *  - `parseBody()` — safe JSON body parser returning a typed object.
 *  - `slugifyUnique()` — generates a slug + verifies uniqueness.
 *  - `applyVerificationUpdate()` — sets `lastVerifiedAt` / `lastVerifiedBy`
 *    when the verification status changes.
 *  - Common error envelopes (`validationError`, `notFoundError`,
 *    `internalError`) built on top of `jsonResponse()`.
 *
 * All helpers are pure (no side effects beyond DB writes) and safe to
 * import from both route handlers and server actions.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
  slugify,
} from "@/lib/higher-study/api-helpers";

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

/**
 * Persist a HigherStudyAuditLog entry. Failures are non-fatal — the
 * audit log is best-effort and must never break the user-facing
 * operation. The error is logged to stderr for diagnosis.
 */
export async function writeAuditLog(ctx: AuditContext): Promise<void> {
  try {
    await db.higherStudyAuditLog.create({
      data: {
        actorUserId: ctx.actorUserId ?? null,
        action: safeString(ctx.action).slice(0, 80) || "update",
        entityType: safeString(ctx.entityType).slice(0, 60) || "unknown",
        entityId: safeString(ctx.entityId).slice(0, 60) || "unknown",
        entitySlug: ctx.entitySlug ? safeString(ctx.entitySlug).slice(0, 200) : null,
        beforeData: ctx.beforeData !== undefined ? safeJson(ctx.beforeData) : null,
        afterData: ctx.afterData !== undefined ? safeJson(ctx.afterData) : null,
        ipHash: ctx.ipHash ?? null,
        userAgent: ctx.userAgent ? safeString(ctx.userAgent).slice(0, 500) : null,
      },
    });
  } catch (err) {
    console.error("[higher-study] audit log write failed", err);
  }
}

/**
 * Resolve the actor context (userId, ipHash, userAgent) for an admin
 * request. The userId comes from the authenticated session; the IP
 * hash is derived from the request's forwarded-for header.
 */
export function resolveActor(req: NextRequest, userId?: string | null): {
  userId: string | null;
  ipHash: string;
  userAgent: string;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return {
    userId: userId ?? null,
    ipHash: hashIp(ip, process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs"),
    userAgent: req.headers.get("user-agent") ?? "",
  };
}

// ─── Body parsing ────────────────────────────────────────────────────

/**
 * Parse a JSON request body, returning `null` on invalid JSON or
 * non-object payloads. Always safe to call.
 */
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

/**
 * Detects whether the `verificationStatus` field is changing on an
 * update, and if so returns the additional fields to set
 * (`lastVerifiedAt`, `lastVerifiedBy`).
 */
export function applyVerificationUpdate(
  before: { verificationStatus?: string | null } | null,
  after: Record<string, unknown>,
  actorUserId: string | null,
): Record<string, unknown> {
  const next = after.verificationStatus;
  if (
    next &&
    typeof next === "string" &&
    next !== before?.verificationStatus
  ) {
    return {
      ...after,
      lastVerifiedAt: new Date(),
      lastVerifiedBy: actorUserId ?? null,
    };
  }
  return after;
}

// ─── Slug helpers ────────────────────────────────────────────────────

/**
 * Generate a unique slug for an entity by appending `-2`, `-3`, …
 * until the slug is available. Uses the provided `exists` callback to
 * check uniqueness (so the caller can scope by entity type).
 */
export async function slugifyUnique(
  source: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(source) || `entity-${Date.now().toString(36)}`;
  let candidate = base;
  let i = 2;
  // Hard cap to avoid infinite loops in pathological cases.
  while (i < 1000) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${base}-${i}`;
    i += 1;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// ─── Internal utilities ──────────────────────────────────────────────

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 8192);
  } catch {
    return "";
  }
}

/**
 * Pick a known-safe subset of keys from an unknown body, ignoring
 * unknown fields. Used to whitelist inputs on create/update.
 */
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

/**
 * Coerce a value to a number, returning `null` if it can't be parsed.
 */
export function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Coerce a value to a Date, returning `null` if it can't be parsed.
 */
export function toDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Coerce a value to a boolean. Accepts true/false, "true"/"false" (case
 * insensitive), 1/0.
 */
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
