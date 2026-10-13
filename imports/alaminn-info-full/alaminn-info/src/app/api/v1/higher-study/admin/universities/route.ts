/**
 * GET /api/v1/higher-study/admin/universities
 * POST /api/v1/higher-study/admin/universities
 * --------------------------------------------------------------------
 * Admin list + create for Higher Study universities.
 *
 * GET: paginated list with full admin fields (including audit columns).
 *      Permission: `higher-study.universities.view`
 *
 * POST: create a new university. Sets lastVerifiedAt / lastVerifiedBy
 *       if verificationStatus is set on input. Writes a HigherStudyAuditLog
 *       entry. Permission: `higher-study.universities.create`
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
  slugify,
} from "@/lib/higher-study/api-helpers";
import {
  writeAuditLog,
  resolveActor,
  parseBody,
  applyVerificationUpdate,
  validationError,
  internalError,
  toNumberOrNull,
  toBooleanOrNull,
} from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

// ─── GET ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.universities.view");
  if (guard.denied) return guard.response;

  try {
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const q = safeString(url.searchParams.get("q"));
    const country = safeString(url.searchParams.get("country"));
    const verifiedStatus = safeString(url.searchParams.get("verifiedStatus"));
    const publicationStatus = safeString(url.searchParams.get("publicationStatus"));

    const where: Prisma.HigherStudyUniversityWhereInput = {};
    if (q) {
      where.OR = [
        { officialName: { contains: q } },
        { alternativeNames: { contains: q } },
        { slug: { contains: q } },
      ];
    }
    if (country) where.country = { slug: country };
    if (verifiedStatus) where.verificationStatus = verifiedStatus;
    if (publicationStatus) where.publicationStatus = publicationStatus;

    const [items, total] = await Promise.all([
      db.higherStudyUniversity.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
          city: { select: { id: true, slug: true, name: true } },
          _count: {
            select: { courses: true, scholarships: true, supervisors: true },
          },
        },
      }),
      db.higherStudyUniversity.count({ where }),
    ]);

    return jsonResponse(
      true,
      "Universities retrieved.",
      { items },
      { pagination: buildPaginationMeta(params, total) },
    );
  } catch (err) {
    console.error("[admin/universities GET] error", err);
    return internalError();
  }
}

// ─── POST ─────────────────────────────────────────────────────────────

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
  "publicationStatus", "officialSourceUrl",
] as const;

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.universities.create");
  if (guard.denied) return guard.response;

  const body = await parseBody(req);
  if (!body) return validationError("Invalid request body.", ["invalid_body"]);

  try {
    const officialName = safeString(body.officialName as string);
    if (!officialName) {
      return validationError("officialName is required.", ["officialName_required"]);
    }
    const countryId = safeString(body.countryId as string);
    if (!countryId) {
      return validationError("countryId is required.", ["countryId_required"]);
    }

    // Resolve slug — auto-generate from officialName if not provided.
    let slug = safeString(body.slug as string);
    if (!slug) slug = slugify(officialName);
    if (!slug) {
      return validationError("Could not derive a valid slug.", ["slug_invalid"]);
    }

    // Confirm slug uniqueness.
    const existing = await db.higherStudyUniversity.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      return validationError("Slug already exists.", ["slug_duplicate"]);
    }

    // Build the data payload, coercing types.
    const data: Record<string, unknown> = { slug, officialName, countryId };
    for (const key of ALLOWED_FIELDS) {
      if (key === "slug" || key === "officialName" || key === "countryId") continue;
      if (!(key in body)) continue;
      const v = body[key];
      if (v === undefined) continue;
      // Boolean coercion for known boolean fields
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
      // Numeric coercion for known integer fields
      if (["establishedYear", "undergraduateCount", "postgraduateCount"].includes(key)) {
        const n = toNumberOrNull(v);
        if (n !== null) data[key] = n;
        continue;
      }
      // Strings (and null)
      if (v === null || typeof v === "string") {
        data[key] = v;
      }
    }

    // Apply verification update on create.
    const finalData = applyVerificationUpdate(null, data, guard.session.userId) as Record<string, unknown>;

    const created = await db.higherStudyUniversity.create({
      data: finalData as Prisma.HigherStudyUniversityCreateInput,
      include: {
        country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
      },
    });

    // Audit log
    const actor = resolveActor(req, guard.session.userId);
    await writeAuditLog({
      actorUserId: actor.userId,
      action: "create",
      entityType: "university",
      entityId: created.id,
      entitySlug: created.slug,
      afterData: created,
      ipHash: actor.ipHash,
      userAgent: actor.userAgent,
    });

    return jsonResponse(true, "University created.", created);
  } catch (err) {
    console.error("[admin/universities POST] error", err);
    return internalError();
  }
}
