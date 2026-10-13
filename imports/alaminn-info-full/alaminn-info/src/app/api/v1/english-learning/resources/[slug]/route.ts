/**
 * GET /api/v1/english-learning/resources/[slug]
 * --------------------------------------------------------------------
 * Returns a single published resource by slug.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicResourceSelect,
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

    const resource = await db.englishLearningResource.findFirst({
      where: { slug: cleanSlug, isPublished: true },
      select: publicResourceSelect,
    });

    if (!resource) {
      return jsonResponse(
        false,
        "Resource not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    return jsonResponse(true, "Resource retrieved.", resource);
  } catch (err) {
    console.error("[english-learning/resources/[slug]] error", err);
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
