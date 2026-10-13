/**
 * GET /api/v1/english-learning/courses/[slug]/lessons
 * --------------------------------------------------------------------
 * Returns the lesson list for a published course. By default only
 * `isFreePreview=true` lessons return their content; non-free lessons
 * are returned without `content` and `transcript` fields.
 *
 * Pass `?sessionId=...` to receive full content for all lessons if the
 * caller has an active enrollment for the course.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
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

    const url = new URL(req.url);
    const sessionId = safeString(url.searchParams.get("sessionId"));

    const course = await db.englishLearningCourse.findFirst({
      where: {
        slug: cleanSlug,
        isPublished: true,
        publicationStatus: "published",
      },
      select: { id: true },
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

    let isEnrolled = false;
    if (sessionId) {
      const enrollment = await db.englishLearningEnrollment.findUnique({
        where: { sessionId_courseId: { sessionId, courseId: course.id } },
        select: { id: true },
      });
      isEnrolled = !!enrollment;
    }

    const lessons = await db.englishLearningLesson.findMany({
      where: { courseId: course.id, isPublished: true },
      select: publicLessonSelect,
      orderBy: { orderIndex: "asc" },
    });

    // Strip content + transcript from non-free lessons if not enrolled.
    const items = lessons.map((l) => {
      if (isEnrolled || l.isFreePreview) return l;
      return {
        ...l,
        content: null,
        transcript: null,
        videoUrl: null,
      };
    });

    return jsonResponse(
      true,
      "Lessons retrieved.",
      { items, isEnrolled },
    );
  } catch (err) {
    console.error("[english-learning/courses/[slug]/lessons] error", err);
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
