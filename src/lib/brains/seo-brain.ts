/**
 * SEO Brain — computes content DNA fingerprints, finds related content,
 * tracks content dependencies, detects stale content, and runs impact analysis.
 *
 * CRITICAL: runImpactAnalysis() NEVER auto-updates — it only returns what
 * WOULD be impacted. The caller decides whether to mark stale or update.
 */

import { db } from "@/lib/db";

export interface ContentDNAFingerprint {
  country: string | null;
  destination: string | null;
  universitySlug: string | null;
  courseSlug: string | null;
  degree: string | null;
  studentIntent: string | null;
  stage: string | null;
  scholarship: string | null;
  cost: string | null;
  application: string | null;
  visa: string | null;
  career: string | null;
  contentType: string | null;
  audience: string | null;
  channel: string | null;
  fingerprint: string;
}

/**
 * Compute (or fetch cached) the content DNA fingerprint for a content asset.
 * The fingerprint is a stable hash of the non-null DNA fields.
 */
export async function computeContentDNA(contentAssetId: string): Promise<ContentDNAFingerprint | null> {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) return null;

  // Derive DNA from the asset's metadata
  const tags: string[] = safeParseArr(asset.tags);
  const targetKeywords: string[] = (asset.targetKeywords || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dna: Omit<ContentDNAFingerprint, "fingerprint"> = {
    country: findTag(tags, ["uk", "usa", "canada", "australia", "germany", "ireland"]),
    destination: null,
    universitySlug: findTag(tags, ["university"]) || null,
    courseSlug: findTag(tags, ["course"]) || null,
    degree: findTag(tags, ["bachelor", "masters", "phd", "foundation", "mba"]),
    studentIntent: asset.contentType === "GUIDE" ? "RESEARCH" : "CONVERSION",
    stage: asset.contentType === "BLOG" ? "AWARENESS" : "DECISION",
    scholarship: tags.some((t) => t.toLowerCase().includes("scholarship")) ? "YES" : null,
    cost: tags.some((t) => t.toLowerCase().includes("tuition")) ? "YES" : null,
    application: tags.some((t) => t.toLowerCase().includes("application")) ? "YES" : null,
    visa: tags.some((t) => t.toLowerCase().includes("visa")) ? "YES" : null,
    career: tags.some((t) => t.toLowerCase().includes("career")) ? "YES" : null,
    contentType: asset.contentType,
    audience: targetKeywords[0] || null,
    channel: tags.find((t) => ["blog", "facebook", "instagram", "whatsapp"].includes(t.toLowerCase())) || null,
  };

  // Compose fingerprint from non-null values
  const fingerprintParts: string[] = [];
  for (const [k, v] of Object.entries(dna)) {
    if (v) fingerprintParts.push(`${k}=${v}`);
  }
  const fingerprint = fnv1a(fingerprintParts.join("|"));

  // Upsert into ContentDNA table
  await db.contentDNA.upsert({
    where: { fingerprint },
    update: {
      contentAssetId,
      country: dna.country,
      destination: dna.destination,
      universitySlug: dna.universitySlug,
      courseSlug: dna.courseSlug,
      degree: dna.degree,
      studentIntent: dna.studentIntent,
      stage: dna.stage,
      scholarship: dna.scholarship,
      cost: dna.cost,
      application: dna.application,
      visa: dna.visa,
      career: dna.career,
      contentType: dna.contentType,
      audience: dna.audience,
      channel: dna.channel,
    },
    create: {
      contentAssetId,
      fingerprint,
      country: dna.country,
      destination: dna.destination,
      universitySlug: dna.universitySlug,
      courseSlug: dna.courseSlug,
      degree: dna.degree,
      studentIntent: dna.studentIntent,
      stage: dna.stage,
      scholarship: dna.scholarship,
      cost: dna.cost,
      application: dna.application,
      visa: dna.application,
      career: dna.career,
      contentType: dna.contentType,
      audience: dna.audience,
      channel: dna.channel,
    },
  });

  return { ...dna, fingerprint };
}

/**
 * Find content that shares DNA dimensions with the given fingerprint.
 */
export async function findRelatedContent(dna: ContentDNAFingerprint, limit = 10) {
  const where: Record<string, unknown> = {};
  if (dna.country) where.country = dna.country;
  if (dna.universitySlug) where.universitySlug = dna.universitySlug;
  if (dna.courseSlug) where.courseSlug = dna.courseSlug;
  if (dna.degree) where.degree = dna.degree;
  if (dna.contentType) where.contentType = dna.contentType;

  // If nothing to filter on, return empty
  if (Object.keys(where).length === 0) return [];

  return db.contentDNA.findMany({
    where: { ...where, fingerprint: { not: dna.fingerprint } },
    take: Math.min(limit, 50),
    orderBy: { createdAt: "desc" },
  });
}

export interface CreateDependencyParams {
  sourceType: string; // University | Course | Scholarship | ContentAsset
  sourceId: string;
  sourceField?: string;
  dependentAssetType: string; // ContentAsset | CoursePage | UniversityPage
  dependentAssetId: string;
  dependencyStrength?: string; // DIRECT | INDIRECT | DERIVED
}

export async function createContentDependency(params: CreateDependencyParams) {
  // Avoid duplicate dependencies
  const existing = await db.contentDependency.findFirst({
    where: {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceField: params.sourceField || null,
      dependentAssetType: params.dependentAssetType,
      dependentAssetId: params.dependentAssetId,
    },
  });
  if (existing) return existing;

  return db.contentDependency.create({
    data: {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceField: params.sourceField || null,
      dependentAssetType: params.dependentAssetType,
      dependentAssetId: params.dependentAssetId,
      dependencyStrength: params.dependencyStrength || "DIRECT",
      stale: false,
      lastSyncedAt: new Date(),
    },
  });
}

/**
 * Detect content that's stale because its source has changed.
 * Looks at dependencies whose lastSyncedAt is older than the source's updatedAt.
 */
export async function detectStaleContent(sourceType?: string, sourceId?: string) {
  const where: Record<string, unknown> = {};
  if (sourceType) where.sourceType = sourceType;
  if (sourceId) where.sourceId = sourceId;

  const deps = await db.contentDependency.findMany({ where });

  const stale: any[] = [];
  for (const dep of deps) {
    // Fetch source row's updatedAt (best-effort across models)
    let sourceUpdatedAt: Date | null = null;
    try {
      if (dep.sourceType === "University") {
        const r = await db.universityPage.findUnique({
          where: { slug: dep.sourceId },
          select: { updatedAt: true },
        });
        sourceUpdatedAt = r?.updatedAt || null;
      } else if (dep.sourceType === "Course") {
        const r = await db.coursePage.findUnique({
          where: { slug: dep.sourceId },
          select: { updatedAt: true },
        });
        sourceUpdatedAt = r?.updatedAt || null;
      } else if (dep.sourceType === "Scholarship") {
        const r = await db.scholarship.findUnique({
          where: { slug: dep.sourceId },
          select: { updatedAt: true },
        });
        sourceUpdatedAt = r?.updatedAt || null;
      } else if (dep.sourceType === "ContentAsset" && dep.sourceId.length === 25) {
        const r = await db.contentAsset.findUnique({
          where: { id: dep.sourceId },
          select: { updatedAt: true },
        });
        sourceUpdatedAt = r?.updatedAt || null;
      }
    } catch {
      // ignore
    }

    if (
      sourceUpdatedAt &&
      dep.lastSyncedAt &&
      sourceUpdatedAt > dep.lastSyncedAt
    ) {
      stale.push({
        dependency: dep,
        sourceUpdatedAt,
        lastSyncedAt: dep.lastSyncedAt,
        staleReason: "Source updated after last sync",
      });
    }
  }

  return {
    stale,
    checked: deps.length,
    staleCount: stale.length,
  };
}

export interface ImpactAnalysisResult {
  sourceType: string;
  sourceId: string;
  sourceField?: string;
  impacted: Array<{
    dependency: any;
    dependentAssetType: string;
    dependentAssetId: string;
    dependencyStrength: string;
  }>;
  totalImpacted: number;
  byAssetType: Record<string, number>;
  autoUpdated: false; // NEVER auto-updates
  message: string;
}

/**
 * Run an impact analysis — NEVER auto-updates. Returns what WOULD be impacted.
 */
export async function runImpactAnalysis(
  sourceType: string,
  sourceId: string,
  sourceField?: string
): Promise<ImpactAnalysisResult> {
  const where: Record<string, unknown> = { sourceType, sourceId };
  if (sourceField) where.sourceField = sourceField;

  const deps = await db.contentDependency.findMany({ where });

  const impacted = deps.map((d) => ({
    dependency: d,
    dependentAssetType: d.dependentAssetType,
    dependentAssetId: d.dependentAssetId,
    dependencyStrength: d.dependencyStrength,
  }));

  const byAssetType: Record<string, number> = {};
  for (const i of impacted) {
    byAssetType[i.dependentAssetType] = (byAssetType[i.dependentAssetType] || 0) + 1;
  }

  return {
    sourceType,
    sourceId,
    sourceField,
    impacted,
    totalImpacted: impacted.length,
    byAssetType,
    autoUpdated: false,
    message: `Impact analysis complete. ${impacted.length} dependent assets would be affected. No auto-updates performed.`,
  };
}

/**
 * Mark a dependent asset as fresh (synced).
 */
export async function markContentFresh(
  dependentAssetType: string,
  dependentAssetId: string
) {
  const result = await db.contentDependency.updateMany({
    where: { dependentAssetType, dependentAssetId },
    data: { stale: false, lastSyncedAt: new Date() },
  });
  return {
    updated: result.count,
    dependentAssetType,
    dependentAssetId,
  };
}

// ─── Helpers ───

function safeParseArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function findTag(tags: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const found = tags.find((t) => t.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
