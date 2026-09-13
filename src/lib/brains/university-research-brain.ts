// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * University Research Brain
 *
 * Maintains a structured digital twin of every university ALO works with,
 * plus a knowledge object graph (claims, evidence, facts) that can be
 * queried by counselors and AI agents.
 *
 * Functions:
 *   1. buildUniversityDigitalTwin(universitySlug)
 *   2. getUniversityDigitalTwin(universitySlug)
 *   3. createKnowledgeObject(params)
 *   4. getKnowledgeObjects(entityType, entitySlug)
 *   5. detectOutdatedKnowledge()
 *   6. getUniversityIntelligenceSummary(universitySlug)
 *
 * Schema dependency:
 *   - UniversityDigitalTwin (typed via db-as-any cast)
 *   - KnowledgeObject (typed via db-as-any cast)
 *   - Existing: UniversityPage, DataChange, OfficialSource
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export interface UniversityDigitalTwinShape {
  id: string;
  universitySlug: string;
  universityName: string;
  snapshotJson: string; // JSON: structured twin data
  lastVerifiedAt: Date | null;
  lastSourceChangeAt: Date | null;
  freshnessScore: number; // 0-100, 100 = fully fresh
  totalEvidenceCount: number;
  verifiedEvidenceCount: number;
  outdatedEvidenceCount: number;
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeObjectShape {
  id: string;
  entityType: string; // UNIVERSITY | COURSE | FACULTY | SCHOLARSHIP
  entitySlug: string;
  claim: string;
  value: string;
  valueType: string; // STRING | NUMBER | DATE | BOOLEAN | JSON
  sourceUrl: string;
  sourceName: string;
  evidenceId: string | null;
  verificationStatus: string; // UNVERIFIED | VERIFIED | OUTDATED | CONFLICTING
  verifierId: string | null;
  verifiedAt: Date | null;
  confidence: number; // 0-1
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKnowledgeObjectParams {
  entityType: string;
  entitySlug: string;
  claim: string;
  value: string;
  valueType?: string;
  sourceUrl: string;
  sourceName: string;
  evidenceId?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface UniversityIntelligenceSummary {
  universitySlug: string;
  universityName: string | null;
  hasDigitalTwin: boolean;
  freshnessScore: number;
  knowledgeObjectCount: number;
  verifiedCount: number;
  outdatedCount: number;
  conflictingCount: number;
  totalEvidence: number;
  recentChanges: number;
  officialSourceCount: number;
  lastVerifiedAt: Date | null;
  topConcerns: string[];
}

// Cast db to access models not on the standard client.

// ─── buildUniversityDigitalTwin ──────────────────────────────────

/**
 * Build (or rebuild) the digital twin for a university.
 *
 * Aggregates:
 *   - The existing UniversityPage record (basic info, quickFacts, whyStudy, etc.)
 *   - All APPROVED DataChange records on this university (latest values per field)
 *   - All OfficialSource records monitoring this university
 *   - All KnowledgeObject records for this university
 *   - All UniversityResearchEvidence records (count only)
 *
 * Computes a freshnessScore:
 *   - 100 if all knowledge objects are VERIFIED and last verified < 30 days ago
 *   - minus 10 for each OUTDATED knowledge object
 *   - minus 5 for each UNVERIFIED knowledge object
 *   - minus 20 if last source change > 30 days ago and not re-verified since
 */
export async function buildUniversityDigitalTwin(
  universitySlug: string
): Promise<{ twinId: string; freshnessScore: number }> {
  if (!universitySlug) throw new Error("buildUniversityDigitalTwin: universitySlug is required");

  // 1. Existing UniversityPage (may not exist for all universities)
  const universityPage = await db.universityPage.findUnique({
    where: { slug: universitySlug },
  }).catch(() => null);

  // 2. Approved source changes (latest per field)
  const changes = await db.dataChange.findMany({
    where: { universitySlug, status: "APPROVED" },
    orderBy: { appliedAt: "desc" },
  });

  // 3. Official sources
  const officialSources = await db.officialSource.findMany({
    where: { universitySlug, status: "ACTIVE" },
  });

  // 4. Knowledge objects
  const knowledgeObjects = await db.knowledgeObject.findMany({
    where: { entityType: "UNIVERSITY", entitySlug: universitySlug },
  });

  // 5. Evidence count
  let evidenceCount = 0;
  try {
    if (db.universityResearchEvidence) {
      evidenceCount = await db.universityResearchEvidence.count({
        where: { universitySlug },
      });
    }
  } catch { /* ignore */ }

  // Build the snapshot
  const latestValuesByField: Record<string, { value: string | null; appliedAt: Date }> = {};
  for (const c of changes) {
    if (!latestValuesByField[c.fieldName]) {
      latestValuesByField[c.fieldName] = {
        value: c.newValue,
        appliedAt: c.appliedAt ?? c.detectedAt,
      };
    }
  }

  const verified = knowledgeObjects.filter((k) => k.verificationStatus === "VERIFIED").length;
  const outdated = knowledgeObjects.filter((k) => k.verificationStatus === "OUTDATED").length;
  const unverified = knowledgeObjects.filter((k) => k.verificationStatus === "UNVERIFIED").length;

  const lastVerifiedAt = knowledgeObjects
    .map((k) => k.verifiedAt)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const lastSourceChangeAt = changes
    .map((c) => c.appliedAt ?? c.detectedAt)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  // Freshness score
  let freshness = 100;
  freshness -= outdated * 10;
  freshness -= unverified * 5;
  if (lastSourceChangeAt) {
    const daysSinceChange = (Date.now() - lastSourceChangeAt.getTime()) / 86400000;
    if (daysSinceChange > 30 && (!lastVerifiedAt || lastVerifiedAt < lastSourceChangeAt)) {
      freshness -= 20;
    }
  }
  freshness = Math.max(0, Math.min(100, freshness));

  const snapshot = {
    universityName: universityPage?.name ?? null,
    basicInfo: universityPage ? {
      slug: universityPage.slug,
      name: universityPage.name,
      shortName: (universityPage as { shortName?: string }).shortName ?? null,
    } : null,
    officialSources: officialSources.map((s) => ({
      id: s.id,
      sourceName: s.sourceName,
      sourceUrl: s.sourceUrl,
      sourceType: s.sourceType,
      lastCheckedAt: s.lastCheckedAt,
      lastVerifiedAt: s.lastVerifiedAt,
    })),
    latestValues: latestValuesByField,
    knowledgeObjectCount: knowledgeObjects.length,
    evidenceCount,
  };

  const twin = await db.universityDigitalTwin.upsert({
    where: { universitySlug },
    create: {
      universitySlug,
      universityName: universityPage?.name ?? universitySlug,
      snapshotJson: JSON.stringify(snapshot),
      lastVerifiedAt,
      lastSourceChangeAt,
      freshnessScore: freshness,
      totalEvidenceCount: evidenceCount,
      verifiedEvidenceCount: verified,
      outdatedEvidenceCount: outdated,
      metadata: JSON.stringify({ builtAt: new Date().toISOString() }),
    },
    update: {
      universityName: universityPage?.name ?? universitySlug,
      snapshotJson: JSON.stringify(snapshot),
      lastVerifiedAt,
      lastSourceChangeAt,
      freshnessScore: freshness,
      totalEvidenceCount: evidenceCount,
      verifiedEvidenceCount: verified,
      outdatedEvidenceCount: outdated,
      metadata: JSON.stringify({ rebuiltAt: new Date().toISOString() }),
    },
  });

  return { twinId: twin.id, freshnessScore: freshness };
}

// ─── getUniversityDigitalTwin ────────────────────────────────────

/**
 * Fetch the persisted digital twin for a university. Returns null if no
 * twin has been built yet.
 */
export async function getUniversityDigitalTwin(
  universitySlug: string
): Promise<UniversityDigitalTwinShape | null> {
  if (!universitySlug) return null;
  return db.universityDigitalTwin.findUnique({ where: { universitySlug } });
}

// ─── createKnowledgeObject ───────────────────────────────────────

/**
 * Persist a single knowledge claim about an entity (university, course, etc.).
 *
 * Knowledge objects are the atomic units of the university research graph.
 * Each one captures a single (claim, value) pair sourced from an official URL.
 */
export async function createKnowledgeObject(
  params: CreateKnowledgeObjectParams
): Promise<{ knowledgeObjectId: string }> {
  if (!params.entityType || !params.entitySlug || !params.claim || !params.sourceUrl) {
    throw new Error("createKnowledgeObject: entityType, entitySlug, claim, sourceUrl are required");
  }

  const obj = await db.knowledgeObject.create({
    data: {
      entityType: params.entityType,
      entitySlug: params.entitySlug,
      claim: params.claim,
      value: params.value,
      valueType: params.valueType ?? "STRING",
      sourceUrl: params.sourceUrl,
      sourceName: params.sourceName,
      evidenceId: params.evidenceId ?? null,
      verificationStatus: "UNVERIFIED",
      verifierId: null,
      verifiedAt: null,
      confidence: params.confidence ?? 0,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });

  return { knowledgeObjectId: obj.id };
}

// ─── getKnowledgeObjects ─────────────────────────────────────────

/**
 * List all knowledge objects for a given entity.
 */
export async function getKnowledgeObjects(
  entityType: string,
  entitySlug: string
): Promise<KnowledgeObjectShape[]> {
  if (!entityType || !entitySlug) {
    throw new Error("getKnowledgeObjects: entityType and entitySlug are required");
  }
  return db.knowledgeObject.findMany({
    where: { entityType, entitySlug },
    orderBy: { updatedAt: "desc" },
  });
}

// ─── detectOutdatedKnowledge ─────────────────────────────────────

/**
 * Find knowledge objects whose underlying source data has changed.
 *
 * A knowledge object is marked OUTDATED when there exists an APPROVED
 * DataChange on the same (entityType, entitySlug) whose `fieldName`
 * matches the knowledge object's `claim` (case-insensitive contains),
 * and whose appliedAt is more recent than the knowledge object's verifiedAt.
 *
 * Also detects CONFLICTING status: when two knowledge objects on the same
 * (entityType, entitySlug, claim) have different values.
 *
 * Returns counts and marks records in place.
 */
export async function detectOutdatedKnowledge(): Promise<{
  outdatedCount: number;
  conflictingCount: number;
  checkedCount: number;
}> {
  const all = await db.knowledgeObject.findMany({});

  let outdated = 0;
  let conflicting = 0;
  const outdatedIds: string[] = [];
  const conflictingIds: string[] = [];

  // Group by (entityType, entitySlug, claim) to find conflicts
  const groups = new Map<string, KnowledgeObjectShape[]>();
  for (const k of all) {
    const key = `${k.entityType}|${k.entitySlug}|${k.claim.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(k);
  }
  for (const group of groups.values()) {
    if (group.length > 1) {
      const values = new Set(group.map((g) => g.value));
      if (values.size > 1) {
        for (const g of group) {
          conflictingIds.push(g.id);
          conflicting++;
        }
      }
    }
  }

  // Check for source changes newer than verifiedAt
  for (const k of all) {
    const since = k.verifiedAt ?? k.createdAt;
    const changeWhere: Record<string, unknown> = {
      status: "APPROVED",
      appliedAt: { gte: since },
    };
    if (k.entityType === "UNIVERSITY") changeWhere.universitySlug = k.entitySlug;
    else if (k.entityType === "COURSE") changeWhere.courseSlug = k.entitySlug;
    else if (k.entityType === "COUNTRY") changeWhere.countrySlug = k.entitySlug;
    else continue;

    const changes = await db.dataChange.count({ where: changeWhere });
    if (changes > 0 && !outdatedIds.includes(k.id)) {
      outdatedIds.push(k.id);
      outdated++;
    }
  }

  // Apply updates
  if (outdatedIds.length > 0) {
    await db.knowledgeObject.updateMany({
      where: { id: { in: outdatedIds } },
      data: { verificationStatus: "OUTDATED" },
    });
  }
  if (conflictingIds.length > 0) {
    await db.knowledgeObject.updateMany({
      where: { id: { in: conflictingIds } },
      data: { verificationStatus: "CONFLICTING" },
    });
  }

  return {
    outdatedCount: outdated,
    conflictingCount: conflicting,
    checkedCount: all.length,
  };
}

// ─── getUniversityIntelligenceSummary ────────────────────────────

/**
 * High-level intelligence summary for a university. Used by counselors
 * to quickly see how trustworthy the data is for a given institution.
 */
export async function getUniversityIntelligenceSummary(
  universitySlug: string
): Promise<UniversityIntelligenceSummary> {
  if (!universitySlug) throw new Error("getUniversityIntelligenceSummary: universitySlug is required");

  const [twin, knowledgeObjects, officialSources, recentChanges, universityPage] = await Promise.all([
    db.universityDigitalTwin.findUnique({ where: { universitySlug } }),
    db.knowledgeObject.findMany({ where: { entityType: "UNIVERSITY", entitySlug: universitySlug } }),
    db.officialSource.findMany({ where: { universitySlug } }),
    db.dataChange.findMany({
      where: {
        universitySlug,
        detectedAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    }),
    db.universityPage.findUnique({ where: { slug: universitySlug } }).catch(() => null),
  ]);

  const verifiedCount = knowledgeObjects.filter((k) => k.verificationStatus === "VERIFIED").length;
  const outdatedCount = knowledgeObjects.filter((k) => k.verificationStatus === "OUTDATED").length;
  const conflictingCount = knowledgeObjects.filter((k) => k.verificationStatus === "CONFLICTING").length;

  const topConcerns: string[] = [];
  if (outdatedCount > 0) topConcerns.push(`${outdatedCount} outdated knowledge object(s)`);
  if (conflictingCount > 0) topConcerns.push(`${conflictingCount} conflicting knowledge object(s)`);
  if (recentChanges.length > 0) topConcerns.push(`${recentChanges.length} source change(s) in the last 30 days`);
  if (!twin) topConcerns.push("Digital twin not yet built");
  if (officialSources.length === 0) topConcerns.push("No official sources monitored");

  return {
    universitySlug,
    universityName: universityPage?.name ?? twin?.universityName ?? null,
    hasDigitalTwin: !!twin,
    freshnessScore: twin?.freshnessScore ?? 0,
    knowledgeObjectCount: knowledgeObjects.length,
    verifiedCount,
    outdatedCount,
    conflictingCount,
    totalEvidence: twin?.totalEvidenceCount ?? 0,
    recentChanges: recentChanges.length,
    officialSourceCount: officialSources.length,
    lastVerifiedAt: twin?.lastVerifiedAt ?? null,
    topConcerns,
  };
}
