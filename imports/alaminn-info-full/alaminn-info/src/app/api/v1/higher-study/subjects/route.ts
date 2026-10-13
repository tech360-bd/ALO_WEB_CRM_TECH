/**
 * GET /api/v1/higher-study/subjects
 * --------------------------------------------------------------------
 * Returns all subjects with course counts.
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
    const subjects = await db.higherStudySubject.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            courses: { where: { publicationStatus: "published" } },
          },
        },
      },
    });

    const items = subjects.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      description: s.description,
      iconUrl: s.iconUrl,
      courseCount: s._count.courses,
    }));

    const res = jsonResponse(true, "Subjects retrieved.", { items });
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/subjects] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
