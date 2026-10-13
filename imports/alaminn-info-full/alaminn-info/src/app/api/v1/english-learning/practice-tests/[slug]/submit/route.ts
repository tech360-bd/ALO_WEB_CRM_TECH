/**
 * POST /api/v1/english-learning/practice-tests/[slug]/submit
 * --------------------------------------------------------------------
 * Submit answers for a practice test, returns the score + correct
 * answers + per-question explanations.
 *
 * Body shape:
 *   {
 *     "answers": [
 *       { "questionId": "...", "answer": "B" },
 *       { "questionId": "...", "answer": "true" },
 *       ...
 *     ],
 *     "sessionId"?: "..."  // optional, used to record progress
 *   }
 *
 * Score is computed as:
 *   sum(points for correct answers) / sum(all points) * 100
 *
 * For each submitted answer we return:
 *   { questionId, correct: bool, correctAnswer, explanation, pointsAwarded }
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

interface SubmittedAnswer {
  questionId?: string;
  answer?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
  );
  if (rateLimit(ip, 20)) {
    return jsonResponse(
      false,
      "Too many submissions. Please slow down.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

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

    const rawAnswers = (body as Record<string, unknown>).answers;
    if (!Array.isArray(rawAnswers)) {
      return jsonResponse(
        false,
        "`answers` must be an array.",
        null,
        {},
        ["answers_required"],
        400,
      );
    }
    const sessionId = safeString((body as Record<string, unknown>).sessionId as string);

    const test = await db.englishLearningPracticeTest.findFirst({
      where: { slug: cleanSlug, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        passingScore: true,
        totalQuestions: true,
        questions: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            questionType: true,
            questionText: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            points: true,
            orderIndex: true,
            skillArea: true,
          },
        },
      },
    });

    if (!test) {
      return jsonResponse(
        false,
        "Practice test not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    // Build answer lookup
    const answerMap = new Map<string, string>();
    for (const raw of rawAnswers as SubmittedAnswer[]) {
      if (raw && typeof raw === "object" && raw.questionId && raw.answer !== undefined) {
        answerMap.set(raw.questionId, String(raw.answer).trim());
      }
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const results: Array<{
      questionId: string;
      correct: boolean;
      correctAnswer: string | null;
      explanation: string | null;
      pointsAwarded: number;
    }> = [];

    for (const q of test.questions) {
      totalPoints += q.points;
      const submitted = answerMap.get(q.id) ?? "";
      const correct = normalize(submitted) === normalize(q.correctAnswer || "");
      if (correct) earnedPoints += q.points;
      results.push({
        questionId: q.id,
        correct,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        pointsAwarded: correct ? q.points : 0,
      });
    }

    const scorePercent =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed =
      test.passingScore != null ? scorePercent >= test.passingScore : null;

    // Optionally persist progress if sessionId was provided.
    if (sessionId) {
      try {
        // Find any enrollment for this session — if none, skip progress persist.
        const enrollment = await db.englishLearningEnrollment.findFirst({
          where: { sessionId },
          select: { id: true },
        });
        if (enrollment) {
          const existing = await db.englishLearningProgress.findFirst({
            where: { enrollmentId: enrollment.id, testId: test.id },
            select: { id: true },
          });
          if (existing) {
            await db.englishLearningProgress.update({
              where: { id: existing.id },
              data: {
                status: "completed",
                scorePercent,
                lastAttemptAt: new Date(),
                attemptsCount: { increment: 1 },
              },
            });
          } else {
            await db.englishLearningProgress.create({
              data: {
                enrollmentId: enrollment.id,
                testId: test.id,
                status: "completed",
                scorePercent,
                lastAttemptAt: new Date(),
                attemptsCount: 1,
              },
            });
          }
        }
      } catch {
        // Best-effort — don't fail the submission.
      }
    }

    return jsonResponse(
      true,
      "Test submitted.",
      {
        test: {
          id: test.id,
          slug: test.slug,
          title: test.title,
          passingScore: test.passingScore,
        },
        scorePercent,
        earnedPoints,
        totalPoints,
        passed,
        results,
      },
    );
  } catch (err) {
    console.error("[english-learning/practice-tests/[slug]/submit] error", err);
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

/** Case-insensitive, whitespace-trimmed comparison. */
function normalize(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
