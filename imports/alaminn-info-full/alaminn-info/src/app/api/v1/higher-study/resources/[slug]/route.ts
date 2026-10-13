/**
 * GET /api/v1/higher-study/resources/[slug]
 * --------------------------------------------------------------------
 * Returns a single published study resource by slug (full content).
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
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

    const resource = await db.higherStudyResource.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
    });

    if (!resource) {
      return jsonResponse(false, "Resource not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Resource retrieved.", resource);
  } catch (err) {
    console.error("[higher-study/resources/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
