/**
 * GET /api/v1/higher-study/supervisors/[slug]
 * --------------------------------------------------------------------
 * Returns a single published supervisor by slug.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  publicSupervisorSelect,
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

    const supervisor = await db.higherStudySupervisor.findFirst({
      where: {
        slug: cleanSlug,
        publicationStatus: "published",
        verificationStatus: { in: ["verified", "published"] },
      },
      select: {
        ...publicSupervisorSelect,
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
        researchProjects: {
          where: { publicationStatus: "published" },
          select: {
            id: true,
            slug: true,
            title: true,
            fundingStatus: true,
            applicationDeadline: true,
          },
          take: 8,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!supervisor) {
      return jsonResponse(false, "Supervisor not found.", null, {}, ["not_found"], 404);
    }

    return jsonResponse(true, "Supervisor retrieved.", supervisor);
  } catch (err) {
    console.error("[higher-study/supervisors/[slug]] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
