/**
 * GET /api/v1/higher-study/supervisors
 * --------------------------------------------------------------------
 * Paginated, filterable list of published supervisors.
 *
 * Query params:
 *   ?q, ?university, ?country, ?department, ?researchArea,
 *   ?acceptingStudents, ?verifiedStatus, ?page, ?limit, ?sort, ?order
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
  publicSupervisorSelect,
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
    const university = safeString(url.searchParams.get("university"));
    const country = safeString(url.searchParams.get("country"));
    const department = safeString(url.searchParams.get("department"));
    const researchArea = safeString(url.searchParams.get("researchArea"));
    const acceptingStudents = boolParam(url.searchParams.get("acceptingStudents"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));

    const where: Prisma.HigherStudySupervisorWhereInput = {
      publicationStatus: "published",
      verificationStatus: verifiedStatus
        ? verifiedStatus
        : { in: ["verified", "published"] },
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { department: { contains: q } },
        { researchInterests: { contains: q } },
        { applicationGuidance: { contains: q } },
      ];
    }
    if (university) where.university = { slug: university };
    if (researchArea) where.researchArea = { slug: researchArea };
    if (department) where.department = { contains: department };
    if (acceptingStudents !== undefined) where.acceptingStudents = acceptingStudents;
    if (country) {
      where.university = {
        ...((where.university as object) || {}),
        country: { slug: country },
      };
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "name",
      "acceptingStudents",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "createdAt";
    const orderBy: Prisma.HigherStudySupervisorOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "acceptingStudents") orderBy.push({ acceptingStudents: "desc" });

    const [items, total] = await Promise.all([
      db.higherStudySupervisor.findMany({
        where,
        select: {
          ...publicSupervisorSelect,
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
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudySupervisor.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(
      true,
      "Supervisors retrieved.",
      { items },
      { pagination: meta },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/supervisors] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
