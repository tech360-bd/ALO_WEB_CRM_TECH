/**
 * GET /api/v1/higher-study/scholarships/[slug]
 * --------------------------------------------------------------------
 * Returns a single published scholarship by slug.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicScholarshipSelect,
  safeString,
} from "@/lib/higher-study/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const cleanSlug = safeString(slug);
    if (!cleanSlug) {
      return jsonResponse(false, "Slug is required.", null, {}, ["slug_required"], 400);
    }

    const scholarship = await db.higherStudyScholarship.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicScholarshipSelect,
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        university: {
          select: {
            id: true,
            slug: true,
            officialName: true,
            logoUrl: true,
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          },
        },
      },
    });

    if (!scholarship) {
      return jsonResponse(false, "Scholarship not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Scholarship retrieved.", scholarship);
  } catch (err) {
    console.error("[higher-study/scholarships/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
