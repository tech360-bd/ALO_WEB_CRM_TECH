/**
 * GET /api/v1/english-learning/courses/[slug]
 * --------------------------------------------------------------------
 * Returns a single published course by slug, including its lessons list
 * (lesson orderIndex ascending, isPublished=true only).
 *
 * 404 if not found, not published, or not verified.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicCourseSelect,
  publicLessonSelect,
  safeString,
} from "@/lib/english-learning/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const cleanSlug = safeString(slug);
    if (!cleanSlug) {
      return jsonResponse(
        false,
        "Slug is required.",
        null,
        {},
        ["slug_required"],
        400,
      );
    }

    const course = await db.englishLearningCourse.findFirst({
      where: {
        slug: cleanSlug,
        isPublished: true,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicCourseSelect,
        lessons: {
          where: { isPublished: true },
          select: publicLessonSelect,
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!course) {
      return jsonResponse(
        false,
        "Course not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    return jsonResponse(true, "Course retrieved.", course);
  } catch (err) {
    console.error("[english-learning/courses/[slug]] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
