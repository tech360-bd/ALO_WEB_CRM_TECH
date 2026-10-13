/**
 * GET /api/v1/english-learning/lessons/[id]
 * --------------------------------------------------------------------
 * Returns a single lesson by ID. Access is gated:
 *   - If `lesson.isFreePreview === true`, anyone can view the full lesson.
 *   - Otherwise, the caller must pass `?sessionId=...` and have an
 *     active `EnglishLearningEnrollment` row for the lesson's course.
 *
 * Returns 404 if the lesson doesn't exist or isn't published, 403 if
 * access is gated and the caller has no enrollment.
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cleanId = safeString(id);
    if (!cleanId) {
      return jsonResponse(
        false,
        "Lesson ID is required.",
        null,
        {},
        ["id_required"],
        400,
      );
    }

    const url = new URL(req.url);
    const sessionId = safeString(url.searchParams.get("sessionId"));

    const lesson = await db.englishLearningLesson.findUnique({
      where: { id: cleanId },
      select: {
        ...publicLessonSelect,
        isFreePreview: true,
        courseId: true,
        course: { select: { id: true, slug: true, isPublished: true } },
      },
    });

    if (!lesson || !lesson.isPublished || !lesson.course?.isPublished) {
      return jsonResponse(
        false,
        "Lesson not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    // Free preview lessons are open.
    if (lesson.isFreePreview) {
      return jsonResponse(true, "Lesson retrieved.", lesson);
    }

    // Gated lesson — require enrollment.
    if (!sessionId) {
      return jsonResponse(
        false,
        "This lesson requires enrollment. Pass ?sessionId= after enrolling.",
        null,
        {},
        ["enrollment_required"],
        403,
      );
    }

    const enrollment = await db.englishLearningEnrollment.findUnique({
      where: {
        sessionId_courseId: {
          sessionId,
          courseId: lesson.courseId,
        },
      },
      select: { id: true },
    });

    if (!enrollment) {
      return jsonResponse(
        false,
        "You are not enrolled in this course.",
        null,
        {},
        ["not_enrolled"],
        403,
      );
    }

    return jsonResponse(true, "Lesson retrieved.", lesson);
  } catch (err) {
    console.error("[english-learning/lessons/[id]] error", err);
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
