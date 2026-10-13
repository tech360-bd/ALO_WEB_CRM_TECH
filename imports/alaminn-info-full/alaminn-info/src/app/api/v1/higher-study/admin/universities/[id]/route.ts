/**
 * GET /api/v1/higher-study/admin/universities/[id]
 * PUT /api/v1/higher-study/admin/universities/[id]
 * DELETE /api/v1/higher-study/admin/universities/[id]
 * --------------------------------------------------------------------
 * Admin read/update/delete for a single university by ID.
 *
 * Permissions:
 *   GET    → higher-study.universities.view
 *   PUT    → higher-study.universities.update
 *   DELETE → higher-study.universities.delete
 *
 * PUT: applies verification-status update (sets lastVerifiedAt +
 *      lastVerifiedBy when verificationStatus changes). Writes a
 *      HigherStudyAuditLog entry with before/after data.
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  jsonResponse,
} from "@/lib/higher-study/api-helpers";
import {
  writeAuditLog,
  resolveActor,
  parseBody,
  applyVerificationUpdate,
  validationError,
  notFoundError,
  internalError,
  toNumberOrNull,
  toBooleanOrNull,
} from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "slug", "officialName", "alternativeNames", "overview", "establishedYear",
  "institutionType", "countryId", "cityId", "campusLocations", "officialWebsite",
  "contactEmail", "contactPhone", "availableIntakes", "studyLevels",
  "undergraduateCount", "postgraduateCount", "hasMBA", "hasMRes", "hasMPhil",
  "hasPhD", "hasProfessionalDoctorate", "researchDepartments", "researchStrengths",
  "tuitionFeeRange", "depositInfo", "academicEntryRequirements",
  "countrySpecificRequirements", "ieltsRequirement", "ieltsUkviRequirement",
  "pteRequirement", "toeflRequirement", "duolingoRequirement",
  "languageCertRequirement", "oxfordElltRequirement", "englishWaiverPolicy",
  "workExperienceRequired", "portfolioRequired", "interviewRequired",
  "applicationDeadlines", "accommodationOptions", "estimatedLivingCosts",
  "internationalStudentServices", "disabilitySupport", "careerSupport",
  "graduateOutcomes", "graduateRouteGuidance", "applicationGuidance",
  "officialLinks", "rankingsJson", "logoUrl", "featured", "verificationStatus",
  "publicationStatus", "officialSourceUrl", "lastVerifiedAt", "lastVerifiedBy",
] as const;

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requirePermission(req, "higher-study.universities.view");
  if (guard.denied) return guard.response;

  try {
    const { id } = await params;
    const item = await db.higherStudyUniversity.findUnique({
      where: { id },
      include: {
        country: true,
        city: true,
        _count: {
          select: { courses: true, scholarships: true, supervisors: true, researchProjects: true },
        },
      },
    });
    if (!item) return notFoundError();
    return jsonResponse(true, "University retrieved.", item);
  } catch (err) {
    console.error("[admin/universities/[id] GET] error", err);
    return internalError();
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requirePermission(req, "higher-study.universities.update");
  if (guard.denied) return guard.response;

  const body = await parseBody(req);
  if (!body) return validationError("Invalid request body.", ["invalid_body"]);

  try {
    const { id } = await params;
    const before = await db.higherStudyUniversity.findUnique({ where: { id } });
    if (!before) return notFoundError();

    // Build update payload, coercing types.
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue;
      const v = body[key];
      if (v === undefined) continue;
      if (
        [
          "hasMBA", "hasMRes", "hasMPhil", "hasPhD", "hasProfessionalDoctorate",
          "workExperienceRequired", "portfolioRequired", "interviewRequired",
          "featured",
        ].includes(key)
      ) {
        const b = toBooleanOrNull(v);
        if (b !== null) data[key] = b;
        continue;
      }
      if (["establishedYear", "undergraduateCount", "postgraduateCount"].includes(key)) {
        const n = toNumberOrNull(v);
        if (n !== null) data[key] = n;
        continue;
      }
      if (v === null || typeof v === "string") {
        data[key] = v;
      }
    }

    // If slug is changing, verify uniqueness.
    if (typeof data.slug === "string" && data.slug !== before.slug) {
      const clash = await db.higherStudyUniversity.findUnique({
        where: { slug: data.slug as string },
        select: { id: true },
      });
      if (clash && clash.id !== id) {
        return validationError("Slug already in use.", ["slug_duplicate"]);
      }
    }

    const finalData = applyVerificationUpdate(
      { verificationStatus: before.verificationStatus },
      data,
      guard.session.userId,
    ) as Record<string, unknown>;

    const updated = await db.higherStudyUniversity.update({
      where: { id },
      data: finalData as Prisma.HigherStudyUniversityUpdateInput,
    });

    const actor = resolveActor(req, guard.session.userId);
    await writeAuditLog({
      actorUserId: actor.userId,
      action: "update",
      entityType: "university",
      entityId: id,
      entitySlug: updated.slug,
      beforeData: before,
      afterData: updated,
      ipHash: actor.ipHash,
      userAgent: actor.userAgent,
    });

    return jsonResponse(true, "University updated.", updated);
  } catch (err) {
    console.error("[admin/universities/[id] PUT] error", err);
    return internalError();
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requirePermission(req, "higher-study.universities.delete");
  if (guard.denied) return guard.response;

  try {
    const { id } = await params;
    const before = await db.higherStudyUniversity.findUnique({
      where: { id },
      select: { id: true, slug: true, officialName: true },
    });
    if (!before) return notFoundError();

    await db.higherStudyUniversity.delete({ where: { id } });

    const actor = resolveActor(req, guard.session.userId);
    await writeAuditLog({
      actorUserId: actor.userId,
      action: "delete",
      entityType: "university",
      entityId: id,
      entitySlug: before.slug,
      beforeData: before,
      ipHash: actor.ipHash,
      userAgent: actor.userAgent,
    });

    return jsonResponse(true, "University deleted.", { id });
  } catch (err) {
    console.error("[admin/universities/[id] DELETE] error", err);
    return internalError();
  }
}
