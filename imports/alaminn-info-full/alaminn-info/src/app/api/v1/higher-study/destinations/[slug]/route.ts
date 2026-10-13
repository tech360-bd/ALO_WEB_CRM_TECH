/**
 * GET /api/v1/higher-study/destinations/[slug]
 * --------------------------------------------------------------------
 * Returns a single published country (study destination) by slug with
 * related university count + cities list.
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

    const country = await db.higherStudyCountry.findFirst({
      where: { slug: cleanSlug, status: "published" },
      include: {
        cities: {
          where: { status: "published" },
          select: {
            id: true,
            slug: true,
            name: true,
            overview: true,
            livingCost: true,
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            universities: { where: { publicationStatus: "published" } },
            courses: { where: { publicationStatus: "published" } },
            scholarships: { where: { publicationStatus: "published" } },
          },
        },
      },
    });

    if (!country) {
      return jsonResponse(false, "Destination not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Destination retrieved.", country);
  } catch (err) {
    console.error("[higher-study/destinations/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
