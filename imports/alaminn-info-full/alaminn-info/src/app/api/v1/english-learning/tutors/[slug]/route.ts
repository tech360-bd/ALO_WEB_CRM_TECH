/**
 * GET /api/v1/english-learning/tutors/[slug]
 * --------------------------------------------------------------------
 * Returns a single published tutor by slug.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicTutorSelect,
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

    const tutor = await db.englishLearningTutor.findFirst({
      where: { slug: cleanSlug, isPublished: true },
      select: publicTutorSelect,
    });

    if (!tutor) {
      return jsonResponse(
        false,
        "Tutor not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    return jsonResponse(true, "Tutor retrieved.", tutor);
  } catch (err) {
    console.error("[english-learning/tutors/[slug]] error", err);
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
