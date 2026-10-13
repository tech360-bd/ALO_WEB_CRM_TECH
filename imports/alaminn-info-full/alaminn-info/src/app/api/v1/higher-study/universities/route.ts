/**
 * GET /api/v1/higher-study/universities
 * --------------------------------------------------------------------
 * Paginated, filterable list of published universities for the public
 * Higher Study hub. See the docstring at the top of file for the full
 * query param list.
 *
 * Rate limit: 60 req/min per IP (in-memory).
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
  publicUniversitySelect,
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
    const city = safeString(url.searchParams.get("city"));
    const institutionType = safeString(url.searchParams.get("institutionType"));
    const studyLevel = safeString(url.searchParams.get("studyLevel"));
    const subjectSlug = safeString(url.searchParams.get("subject"));
    const scholarshipAvailable = boolParam(url.searchParams.get("scholarshipAvailable"));
    const featured = boolParam(url.searchParams.get("featured"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));

    const where: Prisma.HigherStudyUniversityWhereInput = {
      publicationStatus: "published",
      verificationStatus: verifiedStatus
        ? verifiedStatus
        : { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { officialName: { contains: q } },
        { alternativeNames: { contains: q } },
        { overview: { contains: q } },
        { researchStrengths: { contains: q } },
      ];
    }
    if (country) where.country = { slug: country };
    if (city) where.city = { slug: city };
    if (institutionType) where.institutionType = institutionType;
    if (studyLevel) where.studyLevels = { contains: studyLevel };
    if (featured !== undefined) where.featured = featured;
    if (scholarshipAvailable) {
      where.scholarships = { some: { publicationStatus: "published" } };
    }
    if (subjectSlug) {
      where.courses = {
        some: { subject: { slug: subjectSlug }, publicationStatus: "published" },
      };
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "officialName",
      "establishedYear",
      "undergraduateCount",
      "postgraduateCount",
      "featured",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.HigherStudyUniversityOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "featured") {
      orderBy.push({ featured: "desc" });
    }

    const [items, total] = await Promise.all([
      db.higherStudyUniversity.findMany({
        where,
        select: {
          ...publicUniversitySelect,
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          city: { select: { id: true, slug: true, name: true } },
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudyUniversity.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Universities retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/universities] error", err);
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
