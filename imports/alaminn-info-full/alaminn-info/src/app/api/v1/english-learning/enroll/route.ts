/**
 * POST /api/v1/english-learning/enroll
 * --------------------------------------------------------------------
 * Create an enrollment (anonymous session or authenticated user) for a
 * published course. Idempotent — if (sessionId, courseId) already
 * exists, returns the existing enrollment.
 *
 * Body:
 *   {
 *     "sessionId":  "anon-...",         // required (server-generated on client)
 *     "courseSlug": "ielts-reading-bootcamp", // required
 *     "userId"?:    "..."               // optional, if authenticated
 *   }
 *
 * Side effects:
 *   - Increments `course.enrollmentCount` if a new row was created.
 *   - Returns 404 if the course doesn't exist / isn't published.
 *
 * Rate limit: 20 req/min per IP.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/english-learning/api-helpers";
import { rateLimit } from "@/lib/english-learning/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
  );
  if (rateLimit(ip, 20)) {
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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(
        false,
        "Invalid request body.",
        null,
        {},
        ["invalid_body"],
        400,
      );
    }

    const sessionId = safeString(
      (body as Record<string, unknown>).sessionId as string,
    );
    const courseSlug = safeString(
      (body as Record<string, unknown>).courseSlug as string,
    );
    const userId = safeString(
      (body as Record<string, unknown>).userId as string,
    );

    const errors: string[] = [];
    if (!sessionId) errors.push("sessionId_required");
    if (!courseSlug) errors.push("courseSlug_required");
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    const course = await db.englishLearningCourse.findFirst({
      where: { slug: courseSlug, isPublished: true },
      select: { id: true, slug: true, title: true },
    });
    if (!course) {
      return jsonResponse(
        false,
        "Course not found.",
        null,
        {},
        ["course_not_found"],
        404,
      );
    }

    // Idempotent upsert on (sessionId, courseId).
    const enrollment = await db.englishLearningEnrollment.upsert({
      where: {
        sessionId_courseId: { sessionId, courseId: course.id },
      },
      update: {
        // If the user re-enrolls, bump status back to "enrolled" if abandoned.
        status: "enrolled",
        lastAccessedAt: new Date(),
        ...(userId ? { userId } : {}),
      },
      create: {
        sessionId,
        courseId: course.id,
        userId: userId || null,
        status: "enrolled",
        lastAccessedAt: new Date(),
      },
      select: {
        id: true,
        sessionId: true,
        courseId: true,
        userId: true,
        status: true,
        progressPercent: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Increment course.enrollmentCount (best-effort).
    await db.englishLearningCourse
      .update({
        where: { id: course.id },
        data: { enrollmentCount: { increment: 1 } },
      })
      .catch(() => null);

    return jsonResponse(
      true,
      "Enrollment created.",
      {
        ...enrollment,
        course: { id: course.id, slug: course.slug, title: course.title },
      },
    );
  } catch (err) {
    console.error("[english-learning/enroll POST] error", err);
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
