/**
 * GET /api/v1/higher-study/research/[slug]
 * --------------------------------------------------------------------
 * Returns a single published research project by slug.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicResearchSelect,
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

    const project = await db.higherStudyResearchProject.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicResearchSelect,
        university: {
          select: {
            id: true,
            slug: true,
            officialName: true,
            logoUrl: true,
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          },
        },
        researchArea: { select: { id: true, slug: true, name: true } },
        supervisor: { select: { id: true, slug: true, name: true, academicTitle: true, publicProfileUrl: true } },
      },
    });

    if (!project) {
      return jsonResponse(false, "Research project not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Research project retrieved.", project);
  } catch (err) {
    console.error("[higher-study/research/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
