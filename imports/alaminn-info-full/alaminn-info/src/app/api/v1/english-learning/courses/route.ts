/**
 * GET /api/v1/english-learning/courses
 * --------------------------------------------------------------------
 * Paginated, filterable list of published English Learning courses.
 *
 * Query params:
 *  - q          — free-text search across title + summary
 *  - level      — beginner | intermediate | advanced | ielts | toefl |
 *                 pte | det | gre | gmat
 *  - testType   — same vocabulary as level (filters by test-prep courses)
 *  - isFeatured — true / false
 *  - maxPriceUsd — numeric upper bound
 *  - page, limit, sort, order
 *
 * Rate limit: 60 req/min per IP.
 * Cache: public, s-maxage=300, stale-while-revalidate=600.
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  publicCourseSelect,
  safeString,
  boolParam,
  numParam,
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
    const level = safeString(url.searchParams.get("level"));
    const testType = safeString(url.searchParams.get("testType"));
    const featured = boolParam(url.searchParams.get("isFeatured"));
    const maxPriceUsd = numParam(url.searchParams.get("maxPriceUsd"));

    const where: Prisma.EnglishLearningCourseWhereInput = {
      isPublished: true,
      publicationStatus: "published",
      verificationStatus: { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (level) where.level = level;
    if (testType && !level) where.level = testType;
    if (featured !== undefined) where.isFeatured = featured;
    if (maxPriceUsd !== undefined && maxPriceUsd > 0) {
      where.priceUsd = { lte: Math.floor(maxPriceUsd) };
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "priceUsd",
      "durationWeeks",
      "enrollmentCount",
      "isFeatured",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.EnglishLearningCourseOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "isFeatured") {
      orderBy.push({ isFeatured: "desc" });
    }

    const [items, total] = await Promise.all([
      db.englishLearningCourse.findMany({
        where,
        select: {
          ...publicCourseSelect,
          _count: { select: { lessons: true } },
        },
        skip,
        take,
        orderBy,
      }),
      db.englishLearningCourse.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Courses retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[english-learning/courses] error", err);
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
