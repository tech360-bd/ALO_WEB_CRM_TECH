/**
 * GET /api/v1/higher-study/courses/[slug]
 * --------------------------------------------------------------------
 * Returns a single published course by slug, including the public
 * select fields + related university/country/subject/intake.
 *
 * 404 if not found, not published, or not verified.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicCourseSelect,
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

    const course = await db.higherStudyCourse.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicCourseSelect,
        university: {
          select: {
            id: true,
            slug: true,
            officialName: true,
            logoUrl: true,
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          },
        },
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
        subject: { select: { id: true, slug: true, name: true, category: true } },
        intake: { select: { id: true, slug: true, name: true, applicationDeadline: true } },
      },
    });

    if (!course) {
      return jsonResponse(false, "Course not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Course retrieved.", course);
  } catch (err) {
    console.error("[higher-study/courses/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
