/**
 * GET /api/v1/higher-study/scholarships
 * --------------------------------------------------------------------
 * Paginated, filterable list of published scholarships.
 *
 * Query params:
 *   ?q, ?country, ?university, ?studyLevel, ?subject, ?nationality,
 *   ?fundingType, ?fundingMin, ?fundingMax, ?deadlineFrom, ?deadlineTo,
 *   ?tuitionCoverage, ?livingCostCoverage, ?travelSupport, ?healthInsurance,
 *   ?workExperienceRequired, ?featured, ?verifiedStatus, ?page, ?limit, ?sort, ?order
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
  publicScholarshipSelect,
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

function dateParam(v: string | null): Date | undefined {
  if (v === null || v === "") return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
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
    const studyLevel = safeString(url.searchParams.get("studyLevel"));
    const subject = safeString(url.searchParams.get("subject"));
    const nationality = safeString(url.searchParams.get("nationality"));
    const fundingType = safeString(url.searchParams.get("fundingType"));
    const deadlineFrom = dateParam(url.searchParams.get("deadlineFrom"));
    const deadlineTo = dateParam(url.searchParams.get("deadlineTo"));
    const tuitionCoverage = boolParam(url.searchParams.get("tuitionCoverage"));
    const livingCostCoverage = boolParam(url.searchParams.get("livingCostCoverage"));
    const travelSupport = boolParam(url.searchParams.get("travelSupport"));
    const healthInsurance = boolParam(url.searchParams.get("healthInsurance"));
    const workExperienceRequired = boolParam(url.searchParams.get("workExperienceRequired"));
    const featured = boolParam(url.searchParams.get("featured"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));

    const where: Prisma.HigherStudyScholarshipWhereInput = {
      publicationStatus: "published",
      verificationStatus: verifiedStatus
        ? verifiedStatus
        : { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { provider: { contains: q } },
        { fundingAmount: { contains: q } },
        { otherBenefits: { contains: q } },
      ];
    }
    if (country) where.country = { slug: country };
    if (university) where.university = { slug: university };
    if (fundingType) where.fundingType = fundingType;
    if (studyLevel) where.eligibleStudyLevels = { contains: studyLevel };
    if (subject) where.eligibleSubjects = { contains: subject };
    if (nationality) where.eligibleNationalities = { contains: nationality };
    if (featured !== undefined) where.featured = featured;
    if (tuitionCoverage !== undefined) where.tuitionCoverage = tuitionCoverage;
    if (livingCostCoverage !== undefined) where.livingCostCoverage = livingCostCoverage;
    if (travelSupport !== undefined) where.travelSupport = travelSupport;
    if (healthInsurance !== undefined) where.healthInsurance = healthInsurance;
    if (workExperienceRequired !== undefined) where.workExperienceRequired = workExperienceRequired;
    if (deadlineFrom || deadlineTo) {
      const range: Record<string, Date> = {};
      if (deadlineFrom) range.gte = deadlineFrom;
      if (deadlineTo) range.lte = deadlineTo;
      where.deadline = range;
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "deadline",
      "openingDate",
      "featured",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.HigherStudyScholarshipOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "featured") orderBy.push({ featured: "desc" });

    const [items, total] = await Promise.all([
      db.higherStudyScholarship.findMany({
        where,
        select: {
          ...publicScholarshipSelect,
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          university: {
            select: {
              id: true,
              slug: true,
              officialName: true,
              logoUrl: true,
            },
          },
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudyScholarship.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Scholarships retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/scholarships] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
