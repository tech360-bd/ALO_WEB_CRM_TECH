/**
 * GET /api/v1/higher-study/resources
 * --------------------------------------------------------------------
 * Paginated list of published study resources / guides.
 *
 * Query params:
 *   ?q, ?category, ?featured, ?readingTimeMax, ?page, ?limit, ?sort, ?order
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
    const category = safeString(url.searchParams.get("category"));
    const featured = boolParam(url.searchParams.get("featured"));
    const readingTimeMax = numParam(url.searchParams.get("readingTimeMax"));

    const where: Prisma.HigherStudyResourceWhereInput = {
      publicationStatus: "published",
      verificationStatus: { in: ["verified", "published"] },
    };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { content: { contains: q } },
      ];
    }
    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured;
    if (readingTimeMax !== undefined) {
      where.readingTimeMinutes = { lte: readingTimeMax };
    }

    const sortWhitelist = new Set([
      "createdAt",
      "updatedAt",
      "publishedAt",
      "title",
      "readingTimeMinutes",
      "featured",
      "lastVerifiedAt",
    ]);
    const sortField = sortWhitelist.has(params.sort) ? params.sort : "publishedAt";
    const orderBy: Prisma.HigherStudyResourceOrderByWithRelationInput[] = [
      { [sortField]: params.order },
    ];
    if (sortField !== "featured") orderBy.push({ featured: "desc" });

    const [items, total] = await Promise.all([
      db.higherStudyResource.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          summary: true,
          author: true,
          reviewer: true,
          publishedAt: true,
          updatedAt: true,
          lastVerifiedAt: true,
          readingTimeMinutes: true,
          featured: true,
          officialSourceUrl: true,
          verificationStatus: true,
          publicationStatus: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy,
      }),
      db.higherStudyResource.count({ where }),
    ]);

    const meta = buildPaginationMeta(params, total);
    const res = jsonResponse(true, "Resources retrieved.", { items }, { pagination: meta });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/resources] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
