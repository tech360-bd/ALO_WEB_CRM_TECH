/**
 * GET /api/v1/english-learning/tutors
 * --------------------------------------------------------------------
 * Paginated, filterable list of published English Learning tutors.
 *
 * Query params:
 *  - q             — search across name + bio
 *  - specialty     — substring match against `specialties` JSON
 *  - maxHourlyRate — numeric upper bound on hourlyRateUsd
 *  - minRating     — numeric lower bound on rating
 *  - isAvailable   — true / false
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
  publicTutorSelect,
  safeString,
  numParam,
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
    const specialty = safeString(url.searchParams.get("specialty"));
    const maxHourlyRate = numParam(url.searchParams.get("maxHourlyRate"));
    const minRating = numParam(url.searchParams.get("minRating"));
    const isAvailable = boolParam(url.searchParams.get("isAvailable"));

    const where: Prisma.EnglishLearningTutorWhereInput = {
      isPublished: true,
    };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { bio: { contains: q } },
      ];
    }
    if (specialty) {
      where.specialties = { string_contains: specialty };
    }
    if (maxHourlyRate !== undefined && maxHourlyRate > 0) {
      where.hourlyRateUsd = { lte: Math.floor(maxHourlyRate) };
    }
    if (minRating !== undefined && minRating > 0) {
      where.rating = { gte: minRating };
    }
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "hourlyRateUsd",
      "rating",
      "reviewCount",
      "yearsExperience",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "rating";
    const orderBy: Prisma.EnglishLearningTutorOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];

    const [items, total] = await Promise.all([
      db.englishLearningTutor.findMany({
        where,
        select: publicTutorSelect,
        skip,
        take,
        orderBy,
      }),
      db.englishLearningTutor.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Tutors retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[english-learning/tutors] error", err);
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
