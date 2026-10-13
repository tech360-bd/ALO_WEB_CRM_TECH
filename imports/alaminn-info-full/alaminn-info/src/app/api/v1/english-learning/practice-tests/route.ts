/**
 * GET /api/v1/english-learning/practice-tests
 * --------------------------------------------------------------------
 * Paginated, filterable list of published practice tests.
 *
 * Query params:
 *  - q          — free-text search across title + description
 *  - testType   — ielts-reading | ielts-listening | ... | gmat-verbal
 *  - level      — beginner | intermediate | advanced | ielts | toefl | ...
 *  - isFeatured — true / false
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
  publicTestSelect,
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
    const testType = safeString(url.searchParams.get("testType"));
    const level = safeString(url.searchParams.get("level"));
    const featured = boolParam(url.searchParams.get("isFeatured"));

    const where: Prisma.EnglishLearningPracticeTestWhereInput = {
      isPublished: true,
    };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (testType) where.testType = testType;
    if (level) where.level = level;
    if (featured !== undefined) where.isFeatured = featured;

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "durationMinutes",
      "totalQuestions",
      "isFeatured",
    ]);
    const sortField = sortWhitelist.has(params.sort)
      ? params.sort
      : "createdAt";
    const orderBy: Prisma.EnglishLearningPracticeTestOrderByWithRelationInput[] =
      [{ [sortField]: params.order }];
    if (sortField !== "isFeatured") {
      orderBy.push({ isFeatured: "desc" });
    }

    const [items, total] = await Promise.all([
      db.englishLearningPracticeTest.findMany({
        where,
        select: {
          ...publicTestSelect,
          _count: { select: { questions: true } },
        },
        skip,
        take,
        orderBy,
      }),
      db.englishLearningPracticeTest.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Practice tests retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[english-learning/practice-tests] error", err);
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
