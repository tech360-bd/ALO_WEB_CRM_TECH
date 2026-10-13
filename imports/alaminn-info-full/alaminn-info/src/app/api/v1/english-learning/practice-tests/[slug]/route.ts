/**
 * GET /api/v1/english-learning/practice-tests/[slug]
 * --------------------------------------------------------------------
 * Returns a single published practice test by slug, including all
 * questions. IMPORTANT: `correctAnswer` and `explanation` are stripped
 * from each question (set to null) so the client cannot see them until
 * the test is submitted via the `/submit` endpoint.
 *
 * 404 if not found, not published.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicTestSelect,
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

    const test = await db.englishLearningPracticeTest.findFirst({
      where: { slug: cleanSlug, isPublished: true },
      select: {
        ...publicTestSelect,
        questions: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            testId: true,
            questionType: true,
            questionText: true,
            options: true,
            points: true,
            orderIndex: true,
            skillArea: true,
            // correctAnswer + explanation deliberately omitted
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

    return jsonResponse(true, "Practice test retrieved.", test);
  } catch (err) {
    console.error("[english-learning/practice-tests/[slug]] error", err);
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
