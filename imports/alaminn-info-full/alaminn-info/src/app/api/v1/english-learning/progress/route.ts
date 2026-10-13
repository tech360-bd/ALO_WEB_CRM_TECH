/**
 * POST /api/v1/english-learning/progress
 * --------------------------------------------------------------------
 * Upsert progress for an enrollment on a lesson or practice test.
 *
 * Body:
 *   {
 *     "enrollmentId": "...",         // required
 *     "lessonId"?:    "...",          // mutually exclusive with testId
 *     "testId"?:      "...",
 *     "status":       "in-progress" | "completed", // default in-progress
 *     "scorePercent"?: 75,
 *     "timeSpentMinutes"?: 30
 *   }
 *
 * If a progress row already exists for (enrollmentId, lessonId) or
 * (enrollmentId, testId), it is updated; otherwise a new row is
 * created. `attemptsCount` is incremented on update.
 *
 * Rate limit: 60 req/min per IP.
 *
 * GET /api/v1/english-learning/progress?sessionId=...
 * --------------------------------------------------------------------
 * Returns all enrollments + progress rows for an anonymous session.
 * Used by the /english-learning/progress dashboard. No PII — sessionId
 * is a browser-generated random string.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
  numParam,
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

    const enrollmentId = safeString(
      (body as Record<string, unknown>).enrollmentId as string,
    );
    const lessonId = safeString(
      (body as Record<string, unknown>).lessonId as string,
    );
    const testId = safeString(
      (body as Record<string, unknown>).testId as string,
    );
    const status = safeString(
      (body as Record<string, unknown>).status as string,
    ) as "not-started" | "in-progress" | "completed";
    const scorePercent = numParam(
      (body as Record<string, unknown>).scorePercent as unknown as string,
    );
    const timeSpentMinutes = numParam(
      (body as Record<string, unknown>).timeSpentMinutes as unknown as string,
    );

    const errors: string[] = [];
    if (!enrollmentId) errors.push("enrollmentId_required");
    if (!lessonId && !testId) errors.push("lesson_or_test_required");
    if (lessonId && testId) errors.push("lesson_or_test_not_both");
    if (
      status &&
      !["not-started", "in-progress", "completed"].includes(status)
    ) {
      errors.push("status_invalid");
    }
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    // Verify the enrollment exists.
    const enrollment = await db.englishLearningEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, courseId: true, status: true },
    });
    if (!enrollment) {
      return jsonResponse(
        false,
        "Enrollment not found.",
        null,
        {},
        ["enrollment_not_found"],
        404,
      );
    }

    const where = {
      enrollmentId,
      ...(lessonId ? { lessonId } : {}),
      ...(testId ? { testId } : {}),
    };
    const existing = await db.englishLearningProgress.findFirst({
      where,
      select: { id: true },
    });

    const finalStatus = status || "in-progress";
    const now = new Date();

    let progress;
    if (existing) {
      progress = await db.englishLearningProgress.update({
        where: { id: existing.id },
        data: {
          status: finalStatus,
          scorePercent: scorePercent ?? undefined,
          ...(timeSpentMinutes
            ? { timeSpentMinutes: { increment: timeSpentMinutes } }
            : {}),
          lastAttemptAt: now,
          attemptsCount: { increment: 1 },
        },
      });
    } else {
      progress = await db.englishLearningProgress.create({
        data: {
          enrollmentId,
          lessonId: lessonId || null,
          testId: testId || null,
          status: finalStatus,
          scorePercent: scorePercent ?? undefined,
          timeSpentMinutes: timeSpentMinutes ?? 0,
          lastAttemptAt: now,
          attemptsCount: 1,
        },
      });
    }

    // If the status is "completed" for a lesson, recalc the course-level
    // progressPercent on the enrollment (best-effort).
    if (finalStatus === "completed") {
      try {
        const totalLessons = await db.englishLearningLesson.count({
          where: { courseId: enrollment.courseId, isPublished: true },
        });
        const completedLessons =
          await db.englishLearningProgress.count({
            where: {
              enrollmentId,
              status: "completed",
              lessonId: { not: null },
            },
          });
        const pct =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;
        await db.englishLearningEnrollment.update({
          where: { id: enrollmentId },
          data: {
            progressPercent: pct,
            lastAccessedAt: now,
            status: pct >= 100 ? "completed" : "started",
            ...(pct >= 100 ? { completedAt: now } : {}),
          },
        });
      } catch {
        // best-effort
      }
    } else {
      // Just bump lastAccessedAt for in-progress.
      await db.englishLearningEnrollment
        .update({
          where: { id: enrollmentId },
          data: { lastAccessedAt: now, status: "started" },
        })
        .catch(() => null);
    }

    return jsonResponse(true, "Progress saved.", progress);
  } catch (err) {
    console.error("[english-learning/progress POST] error", err);
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

export async function GET(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
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
    const sessionId = safeString(url.searchParams.get("sessionId"));
    if (!sessionId) {
      return jsonResponse(
        false,
        "sessionId query param is required.",
        null,
        {},
        ["sessionId_required"],
        400,
      );
    }

    const enrollments = await db.englishLearningEnrollment.findMany({
      where: { sessionId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        sessionId: true,
        courseId: true,
        status: true,
        progressPercent: true,
        lastAccessedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            level: true,
            heroImageUrl: true,
          },
        },
        progress: {
          select: {
            id: true,
            status: true,
            scorePercent: true,
            timeSpentMinutes: true,
            lastAttemptAt: true,
            attemptsCount: true,
            lessonId: true,
            testId: true,
            lesson: {
              select: { id: true, slug: true, title: true, lessonType: true },
            },
            test: {
              select: { id: true, slug: true, title: true, testType: true },
            },
          },
        },
      },
    });

    return jsonResponse(
      true,
      "Progress retrieved.",
      { enrollments, count: enrollments.length },
    );
  } catch (err) {
    console.error("[english-learning/progress GET] error", err);
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
