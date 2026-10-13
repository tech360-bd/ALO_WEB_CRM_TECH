/**
 * GET /api/v1/higher-study/events
 * --------------------------------------------------------------------
 * Returns upcoming + live Higher Study events / webinars.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=120, stale-while-revalidate=300";

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
    const items = await db.higherStudyEvent.findMany({
      where: {
        status: { in: ["upcoming", "live"] },
        eventDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: [{ eventDate: "asc" }],
      take: 20,
    });

    const res = jsonResponse(true, "Events retrieved.", { items });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/events] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
