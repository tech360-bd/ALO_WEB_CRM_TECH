/**
 * GET /api/v1/higher-study/intakes
 * --------------------------------------------------------------------
 * Returns all intakes with course counts, sorted by startDate.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
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
    const intakes = await db.higherStudyIntake.findMany({
      orderBy: [{ startDate: "asc" }],
      include: {
        _count: {
          select: {
            courses: { where: { publicationStatus: "published" } },
          },
        },
      },
    });

    const items = intakes.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      startDate: i.startDate,
      endDate: i.endDate,
      applicationDeadline: i.applicationDeadline,
      status: i.status,
      courseCount: i._count.courses,
    }));

    const res = jsonResponse(true, "Intakes retrieved.", { items });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/intakes] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
