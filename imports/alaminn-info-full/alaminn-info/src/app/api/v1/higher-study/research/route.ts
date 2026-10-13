/**
 * GET /api/v1/higher-study/research
 * --------------------------------------------------------------------
 * Paginated, filterable list of published PhD / research projects.
 *
 * Query params:
 *   ?q, ?country, ?university, ?department, ?researchArea, ?supervisor,
 *   ?fundingStatus, ?tuitionMin, ?tuitionMax, ?stipendMin, ?startDateFrom,
 *   ?deadlineFrom, ?deadlineTo, ?studyMode, ?duration, ?featured,
 *   ?verifiedStatus, ?page, ?limit, ?sort, ?order
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
  publicResearchSelect,
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
    const department = safeString(url.searchParams.get("department"));
    const researchArea = safeString(url.searchParams.get("researchArea"));
    const supervisor = safeString(url.searchParams.get("supervisor"));
    const fundingStatus = safeString(url.searchParams.get("fundingStatus"));
    const startDateFrom = dateParam(url.searchParams.get("startDateFrom"));
    const deadlineFrom = dateParam(url.searchParams.get("deadlineFrom"));
    const deadlineTo = dateParam(url.searchParams.get("deadlineTo"));
    const studyMode = safeString(url.searchParams.get("studyMode"));
    const duration = safeString(url.searchParams.get("duration"));
    const featured = boolParam(url.searchParams.get("featured"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));

    const where: Prisma.HigherStudyResearchProjectWhereInput = {
      publicationStatus: "published",
      verificationStatus: verifiedStatus
        ? verifiedStatus
        : { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { projectSummary: { contains: q } },
        { researchObjectives: { contains: q } },
        { candidateProfile: { contains: q } },
      ];
    }
    if (university) where.university = { slug: university };
    if (researchArea) where.researchArea = { slug: researchArea };
    if (supervisor) where.supervisor = { slug: supervisor };
    if (department) where.department = { contains: department };
    if (fundingStatus) where.fundingStatus = fundingStatus;
    if (duration) where.duration = { contains: duration };
    if (featured !== undefined) where.featured = featured;
    if (startDateFrom) where.startDate = { gte: startDateFrom };
    if (deadlineFrom || deadlineTo) {
      const range: Record<string, Date> = {};
      if (deadlineFrom) range.gte = deadlineFrom;
      if (deadlineTo) range.lte = deadlineTo;
      where.applicationDeadline = range;
    }
    if (country) where.university = { ...((where.university as object) || {}), country: { slug: country } };
    void studyMode;

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "title",
      "applicationDeadline",
      "startDate",
      "featured",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.HigherStudyResearchProjectOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "featured") orderBy.push({ featured: "desc" });

    const [items, total] = await Promise.all([
      db.higherStudyResearchProject.findMany({
        where,
        select: {
          ...publicResearchSelect,
          university: {
            select: {
              id: true,
              slug: true,
              officialName: true,
              logoUrl: true,
              country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            },
          },
          researchArea: { select: { id: true, slug: true, name: true } },
          supervisor: { select: { id: true, slug: true, name: true, academicTitle: true } },
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudyResearchProject.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Research projects retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/research] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
