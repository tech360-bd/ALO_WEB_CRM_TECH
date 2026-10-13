/**
 * GET /api/v1/higher-study/courses
 * --------------------------------------------------------------------
 * Paginated, filterable list of published courses.
 *
 * Query params:
 *   ?q, ?country, ?city, ?university, ?subject, ?studyLevel, ?studyMode,
 *   ?intake, ?specialisation, ?duration, ?fundingAvailable, ?workExperienceRequired,
 *   ?portfolioRequired, ?researchComponent, ?placementAvailable,
 *   ?tuitionMin, ?tuitionMax, ?featured, ?verifiedStatus, ?page, ?limit, ?sort, ?order
 *
 * Rate limit: 60 req/min per IP. Cache: public, s-maxage=300, swr=600.
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
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=300, stale-while-revalidate=600";

function boolParam(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  const s = v.toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return undefined;
}

function numParam(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

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
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const q = safeString(url.searchParams.get("q"));
    const country = safeString(url.searchParams.get("country"));
    const university = safeString(url.searchParams.get("university"));
    const subject = safeString(url.searchParams.get("subject"));
    const studyLevel = safeString(url.searchParams.get("studyLevel"));
    const studyMode = safeString(url.searchParams.get("studyMode"));
    const intake = safeString(url.searchParams.get("intake"));
    const specialisation = safeString(url.searchParams.get("specialisation"));
    const tuitionMin = numParam(url.searchParams.get("tuitionMin"));
    const tuitionMax = numParam(url.searchParams.get("tuitionMax"));
    const fundingAvailable = boolParam(url.searchParams.get("fundingAvailable"));
    const workExperienceRequired = boolParam(url.searchParams.get("workExperienceRequired"));
    const portfolioRequired = boolParam(url.searchParams.get("portfolioRequired"));
    const featured = boolParam(url.searchParams.get("featured"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));

    const where: Prisma.HigherStudyCourseWhereInput = {
      publicationStatus: "published",
      verificationStatus: verifiedStatus
        ? verifiedStatus
        : { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { specialisation: { contains: q } },
        { overview: { contains: q } },
        { qualification: { contains: q } },
      ];
    }
    if (country) where.country = { slug: country };
    if (university) where.university = { slug: university };
    if (subject) where.subject = { slug: subject };
    if (studyLevel) where.studyLevel = studyLevel;
    if (studyMode) where.studyMode = studyMode;
    if (intake) where.intake = { slug: intake };
    if (specialisation) {
      where.specialisation = { contains: specialisation };
    }
    if (featured !== undefined) where.featured = featured;
    if (fundingAvailable !== undefined) where.scholarshipAvailable = fundingAvailable;
    if (workExperienceRequired !== undefined) where.workExperienceRequired = workExperienceRequired;
    if (portfolioRequired !== undefined) where.portfolioRequired = portfolioRequired;
    if (tuitionMin !== undefined || tuitionMax !== undefined) {
      const range: Record<string, number> = {};
      if (tuitionMin !== undefined) range.gte = tuitionMin;
      if (tuitionMax !== undefined) range.lte = tuitionMax;
      where.tuitionFee = range;
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "studyLevel",
      "tuitionFee",
      "featured",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.HigherStudyCourseOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "featured") orderBy.push({ featured: "desc" });

    const [items, total] = await Promise.all([
      db.higherStudyCourse.findMany({
        where,
        select: {
          ...publicCourseSelect,
          university: {
            select: {
              id: true,
              slug: true,
              officialName: true,
              logoUrl: true,
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            },
          },
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          subject: { select: { id: true, slug: true, name: true } },
          intake: { select: { id: true, slug: true, name: true } },
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudyCourse.count({ where }),
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
    console.error("[higher-study/courses] error", err);
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
