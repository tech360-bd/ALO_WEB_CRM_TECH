/**
 * GET /api/v1/higher-study/saved
 * POST /api/v1/higher-study/saved
 * --------------------------------------------------------------------
 * GET: Returns the caller's saved items (universities, courses,
 *      scholarships, research projects, supervisors, resources).
 *      Grouped by entityType in the response.
 *
 * POST: Saves a new item for the caller. Idempotent within (caller,
 *       entityType, entitySlug) — re-saving just updates entityName +
 *       notes (and bumps updatedAt via Prisma). Body:
 *       `{ entityType, entitySlug, entityName, sessionId?, notes? }`
 *
 * Auth: anonymous (sessionId) OR authenticated (signed session cookie).
 * Rate limit: 30 req/min per IP (write), 60/min per IP (read).
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";
import { resolveCaller, callerWhere } from "../_lib/caller";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = new Set([
  "university",
  "course",
  "scholarship",
  "research",
  "supervisor",
  "resource",
]);

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs",
  );
  if (rateLimit(ip, 60)) {
    return jsonResponse(
      false,
      "Too many requests. Please slow down.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

  try {
    const ctx = resolveCaller(req);
    const where = callerWhere(ctx);
    if (!where) {
      return jsonResponse(
        false,
        "Either an authenticated session or a sessionId query param is required.",
        null,
        {},
        ["caller_required"],
        400,
      );
    }

    const items = await db.higherStudySavedItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Group by entityType for the front-end convenience.
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.entityType]) grouped[item.entityType] = [];
      grouped[item.entityType].push(item);
    }

    return jsonResponse(
      true,
      "Saved items retrieved.",
      { items, grouped },
      { total: items.length, authenticated: ctx.authenticated },
    );
  } catch (err) {
    console.error("[higher-study/saved GET] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs",
  );
  if (rateLimit(ip, 30)) {
    return jsonResponse(
      false,
      "Too many requests. Please slow down.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(false, "Invalid request body.", null, {}, ["invalid_body"], 400);
    }

    const ctx = resolveCaller(req, body as Record<string, unknown>);
    if (!ctx.userId && !ctx.sessionId) {
      return jsonResponse(
        false,
        "Either an authenticated session or a sessionId is required.",
        null,
        {},
        ["caller_required"],
        400,
      );
    }

    const entityType = safeString((body as Record<string, unknown>).entityType as string);
    const entitySlug = safeString((body as Record<string, unknown>).entitySlug as string);
    const entityName = safeString((body as Record<string, unknown>).entityName as string);
    const notes = safeString((body as Record<string, unknown>).notes as string) || null;

    const errors: string[] = [];
    if (!entityType || !VALID_ENTITY_TYPES.has(entityType)) {
      errors.push("entityType_invalid");
    }
    if (!entitySlug) errors.push("entitySlug_required");
    if (!entityName) errors.push("entityName_required");
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    // Idempotent upsert — re-saving updates name/notes.
    const where = callerWhere(ctx)!;
    const existing = await db.higherStudySavedItem.findFirst({
      where: { ...where, entityType, entitySlug },
    });

    let item;
    if (existing) {
      item = await db.higherStudySavedItem.update({
        where: { id: existing.id },
        data: { entityName, notes },
      });
    } else {
      item = await db.higherStudySavedItem.create({
        data: {
          userId: ctx.userId,
          sessionId: ctx.sessionId,
          entityType,
          entitySlug,
          entityName,
          notes,
        },
      });
    }

    return jsonResponse(true, "Item saved.", item);
  } catch (err) {
    console.error("[higher-study/saved POST] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
