/**
 * University Research Brain — builds/maintains digital twins of universities,
 * creates knowledge objects, detects outdated knowledge, summarizes intelligence.
 *
 * All data is REAL — pulled from UniversityPage, CoursePage, Scholarship,
 * KnowledgeObject, and UniversityDigitalTwin tables.
 */

import { db } from "@/lib/db";

/**
 * Build (or rebuild) the digital twin for a university by aggregating
 * real data: total courses, total scholarships, total intakes, verification status.
 */
export async function buildUniversityDigitalTwin(universitySlug: string) {
  const university = await db.universityPage.findUnique({
    where: { slug: universitySlug },
    include: {
      courses: {
        select: { id: true, intake: true, lastVerifiedAt: true, verificationStatus: true },
      },
    },
  });

  if (!university) {
    throw new Error(`University not found: ${universitySlug}`);
  }

  // Distinct intakes
  const intakes = new Set<string>();
  for (const c of university.courses) {
    if (c.intake) {
      c.intake.split(/[,\s|]+/).forEach((i) => {
        const trimmed = i.trim();
        if (trimmed) intakes.add(trimmed);
      });
    }
  }

  // Scholarships linked to this university
  const totalScholarships = await db.scholarship.count({
    where: { universitySlug },
  });

  // Recent changes (knowledge objects updated in last 30 days)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentChangeCount = await db.knowledgeObject.count({
    where: { entitySlug: universitySlug, updatedAt: { gte: since30 } },
  });

  // Verification status
  const unverifiedCount = university.courses.filter(
    (c) => c.verificationStatus === "UNVERIFIED" || c.verificationStatus === "NEEDS_REVIEW"
  ).length;
  const verificationStatus =
    unverifiedCount === 0
      ? "VERIFIED"
      : unverifiedCount > university.courses.length / 2
      ? "NEEDS_REVIEW"
      : "PARTIAL";

  // Related content count
  const relatedContentCount = await db.contentAsset.count({
    where: { tags: { contains: universitySlug } },
  });

  const intelligenceSummary = `University: ${university.name} (${university.city}, ${university.countrySlug}). ${university.courses.length} courses, ${totalScholarships} scholarships, ${intakes.size} intakes. Verification: ${verificationStatus} (${unverifiedCount} courses need review).`;

  return db.universityDigitalTwin.upsert({
    where: { universitySlug },
    update: {
      totalCourses: university.courses.length,
      totalScholarships,
      totalIntakes: intakes.size,
      lastVerifiedAt: university.lastVerifiedAt,
      verificationStatus,
      recentChangeCount,
      lastChangeAt: recentChangeCount > 0 ? new Date() : null,
      relatedContentCount,
      intelligenceSummary,
    },
    create: {
      universitySlug,
      totalCourses: university.courses.length,
      totalScholarships,
      totalIntakes: intakes.size,
      lastVerifiedAt: university.lastVerifiedAt,
      verificationStatus,
      recentChangeCount,
      relatedContentCount,
      intelligenceSummary,
    },
  });
}

/**
 * Fetch the digital twin (without rebuilding).
 */
export async function getUniversityDigitalTwin(universitySlug: string) {
  return db.universityDigitalTwin.findUnique({ where: { universitySlug } });
}

export interface CreateKnowledgeObjectParams {
  entityType: string; // University | Course | Scholarship | Country
  entitySlug: string;
  fieldName: string;
  fieldValue: string;
  sourceUrl?: string;
  sourceTitle?: string;
  contentHash?: string;
  confidence?: number;
  verificationStatus?: string;
  approvedBy?: string;
}

export async function createKnowledgeObject(params: CreateKnowledgeObjectParams) {
  // Detect previous value (version history)
  const previous = await db.knowledgeObject.findFirst({
    where: {
      entityType: params.entityType,
      entitySlug: params.entitySlug,
      fieldName: params.fieldName,
    },
    orderBy: { version: "desc" },
  });

  const previousValue = previous?.fieldValue || null;
  const newVersion = (previous?.version || 0) + 1;

  return db.knowledgeObject.create({
    data: {
      entityType: params.entityType,
      entitySlug: params.entitySlug,
      fieldName: params.fieldName,
      fieldValue: params.fieldValue,
      sourceUrl: params.sourceUrl || null,
      sourceTitle: params.sourceTitle || null,
      contentHash: params.contentHash || null,
      confidence: params.confidence ?? (params.sourceUrl ? 0.7 : 0.4),
      verificationStatus: params.verificationStatus || (params.sourceUrl ? "NEEDS_REVIEW" : "UNVERIFIED"),
      previousValue,
      version: newVersion,
      approvedBy: params.approvedBy || null,
      approvedAt: params.approvedBy ? new Date() : null,
    },
  });
}

/**
 * Get all knowledge objects for an entity, newest first.
 */
export async function getKnowledgeObjects(entityType: string, entitySlug: string) {
  return db.knowledgeObject.findMany({
    where: { entityType, entitySlug },
    orderBy: [{ fieldName: "asc" }, { version: "desc" }],
  });
}

/**
 * Find knowledge that's outdated: either explicitly marked NEEDS_REVIEW,
 * or not updated in 90+ days, or has confidence < 0.5.
 */
export async function detectOutdatedKnowledge(limit = 50) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [stale, lowConfidence, needsReview] = await Promise.all([
    db.knowledgeObject.findMany({
      where: { updatedAt: { lt: cutoff } },
      orderBy: { updatedAt: "asc" },
      take: limit,
    }),
    db.knowledgeObject.findMany({
      where: { confidence: { lt: 0.5 } },
      orderBy: { confidence: "asc" },
      take: limit,
    }),
    db.knowledgeObject.findMany({
      where: { verificationStatus: "NEEDS_REVIEW" },
      orderBy: { updatedAt: "asc" },
      take: limit,
    }),
  ]);

  // Deduplicate by id
  const seen = new Set<string>();
  const combined = [...stale, ...lowConfidence, ...needsReview].filter((k) => {
    if (seen.has(k.id)) return false;
    seen.add(k.id);
    return true;
  });

  return {
    outdated: combined,
    counts: {
      stale: stale.length,
      lowConfidence: lowConfidence.length,
      needsReview: needsReview.length,
    },
  };
}

/**
 * Get a real-time intelligence summary for a university:
 *   - twin stats (courses, scholarships, intakes)
 *   - recent knowledge changes
 *   - verification status
 *   - related content count
 */
export async function getUniversityIntelligenceSummary(universitySlug: string) {
  const [twin, university, recentKnowledge, relatedCourses] = await Promise.all([
    db.universityDigitalTwin.findUnique({ where: { universitySlug } }),
    db.universityPage.findUnique({
      where: { slug: universitySlug },
      select: {
        name: true,
        city: true,
        countrySlug: true,
        overview: true,
        lastVerifiedAt: true,
        verificationStatus: true,
        approvalStatus: true,
      },
    }),
    db.knowledgeObject.findMany({
      where: { entitySlug: universitySlug, entityType: "University" },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.coursePage.count({ where: { universitySlug } }),
  ]);

  if (!university) {
    return null;
  }

  return {
    university,
    twin: twin || {
      universitySlug,
      totalCourses: relatedCourses,
      totalScholarships: 0,
      totalIntakes: 0,
      verificationStatus: "NEEDS_REVIEW",
      recentChangeCount: 0,
      relatedContentCount: 0,
      intelligenceSummary: "Twin not yet built — call buildUniversityDigitalTwin() first.",
    },
    actualCourseCount: relatedCourses,
    recentKnowledgeChanges: recentKnowledge,
    needsTwinRebuild: !twin || twin.totalCourses !== relatedCourses,
  };
}
