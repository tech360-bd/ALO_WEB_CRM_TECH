/**
 * GET /api/v1/english-learning/resources
 * --------------------------------------------------------------------
 * Paginated, filterable list of published English Learning resources.
 *
 * Query params:
 *  - q            — search across title + summary
 *  - resourceType — article | video | infographic | audio | pdf
 *  - level        — beginner | intermediate | advanced | ielts | ...
 *  - isFeatured   — true / false
 *  - page, limit, sort, order
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  publicResourceSelect,
  safeString,
  boolParam,
  hashIp,
} from "@/lib/english-learning/api-helpers";
import { rateLimit } from "@/lib/english-learning/rate-limit";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
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
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const q = safeString(url.searchParams.get("q"));
    const resourceType = safeString(url.searchParams.get("resourceType"));
    const level = safeString(url.searchParams.get("level"));
    const featured = boolParam(url.searchParams.get("isFeatured"));

    const where: Prisma.EnglishLearningResourceWhereInput = {
      isPublished: true,
    };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
      ];
    }
    if (resourceType) where.resourceType = resourceType;
    if (level) where.level = level;
    if (featured !== undefined) where.isFeatured = featured;

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "readingTimeMinutes",
      "durationMinutes",
      "isFeatured",
    ]);
    const sortField = sortWhitelist.has(params.sort)
      ? params.sort
      : "createdAt";
    const orderBy: Prisma.EnglishLearningResourceOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "isFeatured") {
      orderBy.push({ isFeatured: "desc" });
    }

    const [items, total] = await Promise.all([
      db.englishLearningResource.findMany({
        where,
        select: publicResourceSelect,
        skip,
        take,
        orderBy,
      }),
      db.englishLearningResource.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Resources retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[english-learning/resources] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
