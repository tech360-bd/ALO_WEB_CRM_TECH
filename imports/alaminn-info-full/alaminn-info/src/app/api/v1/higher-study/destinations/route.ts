/**
 * GET /api/v1/higher-study/destinations
 * --------------------------------------------------------------------
 * Returns a list of all published countries (study destinations).
 * Optional filter: ?region (Europe | North America | Asia-Pacific | Middle East).
 *
 * Rate limit: 60 req/min per IP. Cache: public, s-maxage=300, swr=600.
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=300, stale-while-revalidate=600";

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
    const region = safeString(url.searchParams.get("region"));

    const where: Prisma.HigherStudyCountryWhereInput = {
      status: "published",
    };
    if (region) where.region = region;

    const items = await db.higherStudyCountry.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        officialName: true,
        region: true,
        flagEmoji: true,
        imageUrl: true,
        overview: true,
        scholarshipsAvailable: true,
        researchOpportunities: true,
        tuitionFeeRange: true,
        livingCostRange: true,
        popularSubjects: true,
        majorStudentCities: true,
        availableIntakes: true,
      },
      orderBy: [{ name: "asc" }],
    });

    const res = jsonResponse(true, "Destinations retrieved.", { items });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/destinations] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
