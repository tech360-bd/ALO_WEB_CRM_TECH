/**
 * GET /api/v1/higher-study/student-stories
 * --------------------------------------------------------------------
 * Returns featured student stories / testimonials.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  hashIp,
  safeString,
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
    const featured = safeString(url.searchParams.get("featured"));

    const where: { featured?: boolean; publishedAt?: { gte: Date } } = {};
    if (featured === "true") where.featured = true;
    // Only show published stories
    where.publishedAt = { gte: new Date(0) };

    const items = await db.higherStudyStudentStory.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 20,
    });

    const res = jsonResponse(true, "Student stories retrieved.", { items });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/student-stories] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
