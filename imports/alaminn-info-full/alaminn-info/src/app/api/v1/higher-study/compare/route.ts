/**
 * GET /api/v1/higher-study/compare
 * POST /api/v1/higher-study/compare
 * --------------------------------------------------------------------
 * GET: Returns the caller's saved comparison groups.
 *
 * POST: Creates a new comparison group. Body:
 *       `{ entityType, entitySlugs: string[], name?, sessionId? }`
 *       Max 4 entities per comparison (MAX_COMPARISON_ITEMS).
 *       Returns the comparison record + the full entity data for each
 *       slug so the front-end can render a side-by-side table without a
 *       second round-trip.
 *
 * Auth: anonymous (sessionId) OR authenticated (signed session cookie).
 * Rate limit: 30 req/min per IP.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";
import { MAX_COMPARISON_ITEMS } from "@/lib/higher-study/constants";
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
        "Either an authenticated session or a sessionId is required.",
        null,
        {},
        ["caller_required"],
        400,
      );
    }

    const items = await db.higherStudyComparison.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonResponse(true, "Comparisons retrieved.", { items });
  } catch (err) {
    console.error("[higher-study/compare GET] error", err);
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
    const name = safeString((body as Record<string, unknown>).name as string) || null;
    const slugsRaw = (body as Record<string, unknown>).entitySlugs;
    if (!Array.isArray(slugsRaw)) {
      return jsonResponse(
        false,
        "entitySlugs must be an array of strings.",
        null,
        {},
        ["entitySlugs_invalid"],
        400,
      );
    }
    const entitySlugs = slugsRaw
      .map((s) => safeString(typeof s === "string" ? s : ""))
      .filter(Boolean)
      .slice(0, MAX_COMPARISON_ITEMS);

    const errors: string[] = [];
    if (!entityType || !VALID_ENTITY_TYPES.has(entityType)) errors.push("entityType_invalid");
    if (entitySlugs.length < 2) errors.push("entitySlugs_min_2");
    if (entitySlugs.length > MAX_COMPARISON_ITEMS) errors.push("entitySlugs_max_exceeded");
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    // Persist the comparison record.
    const comparison = await db.higherStudyComparison.create({
      data: {
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        entityType,
        entitySlugs: entitySlugs.join(","),
        name,
      },
    });

    // Fetch the full entity data for each slug so the front-end can
    // render the comparison grid without a second request.
    const entities = await fetchEntitiesForComparison(entityType, entitySlugs);

    return jsonResponse(
      true,
      "Comparison created.",
      {
        comparison,
        entities,
      },
      { count: entities.length },
    );
  } catch (err) {
    console.error("[higher-study/compare POST] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}

// ─── Entity fetcher ───────────────────────────────────────────────────

async function fetchEntitiesForComparison(
  entityType: string,
  slugs: string[],
): Promise<unknown[]> {
  const published = { publicationStatus: "published" as const };
  switch (entityType) {
    case "university":
      return db.higherStudyUniversity.findMany({
        where: { slug: { in: slugs }, ...published },
        include: {
          country: { select: { slug: true, name: true, flagEmoji: true } },
          city: { select: { slug: true, name: true } },
        },
      });
    case "course":
      return db.higherStudyCourse.findMany({
        where: { slug: { in: slugs }, ...published },
        include: {
          university: { select: { slug: true, officialName: true, logoUrl: true } },
          country: { select: { slug: true, name: true, flagEmoji: true } },
        },
      });
    case "scholarship":
      return db.higherStudyScholarship.findMany({
        where: { slug: { in: slugs }, ...published },
        include: {
          country: { select: { slug: true, name: true, flagEmoji: true } },
          university: { select: { slug: true, officialName: true } },
        },
      });
    case "research":
      return db.higherStudyResearchProject.findMany({
        where: { slug: { in: slugs }, ...published },
        include: {
          university: { select: { slug: true, officialName: true } },
          supervisor: { select: { slug: true, name: true } },
        },
      });
    case "supervisor":
      return db.higherStudySupervisor.findMany({
        where: { slug: { in: slugs }, ...published },
        include: {
          university: { select: { slug: true, officialName: true } },
        },
      });
    case "resource":
      return db.higherStudyResource.findMany({
        where: { slug: { in: slugs }, ...published },
      });
    default:
      return [];
  }
}
