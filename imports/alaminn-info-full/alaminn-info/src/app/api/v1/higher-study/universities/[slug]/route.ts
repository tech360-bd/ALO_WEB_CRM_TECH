/**
 * GET /api/v1/higher-study/universities/[slug]
 * --------------------------------------------------------------------
 * Returns a single published university by slug, including the public
 * select fields + related country/city + a short list of related
 * courses/scholarships/supervisors/research projects.
 *
 * 404 if not found, not published, or not verified.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicUniversitySelect,
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
      return jsonResponse(
        false,
        "Slug is required.",
        null,
        {},
        ["slug_required"],
        400,
      );
    }

    const university = await db.higherStudyUniversity.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicUniversitySelect,
        country: { select: { id: true, slug: true, name: true, flagEmoji: true, region: true } },
        city: { select: { id: true, slug: true, name: true } },
        courses: {
          where: { publicationStatus: "published" },
          select: {
            id: true,
            slug: true,
            title: true,
            studyLevel: true,
            qualification: true,
            tuitionFee: true,
            tuitionCurrency: true,
            featured: true,
          },
          take: 12,
          orderBy: { featured: "desc" },
        },
        scholarships: {
          where: { publicationStatus: "published" },
          select: {
            id: true,
            slug: true,
            name: true,
            fundingType: true,
            deadline: true,
            featured: true,
          },
          take: 8,
          orderBy: { featured: "desc" },
        },
        supervisors: {
          where: { publicationStatus: "published" },
          select: {
            id: true,
            slug: true,
            name: true,
            academicTitle: true,
            department: true,
            acceptingStudents: true,
          },
          take: 8,
          orderBy: { acceptingStudents: "desc" },
        },
        researchProjects: {
          where: { publicationStatus: "published" },
          select: {
            id: true,
            slug: true,
            title: true,
            department: true,
            fundingStatus: true,
            featured: true,
          },
          take: 8,
          orderBy: { featured: "desc" },
        },
      },
    });

    if (!university) {
      return jsonResponse(
        false,
        "University not found.",
        null,
        {},
        ["not_found"],
        404,
      );
    }

    return jsonResponse(true, "University retrieved.", university);
  } catch (err) {
    console.error("[higher-study/universities/[slug]] error", err);
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
