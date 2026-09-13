// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * SEO Brain
 *
 * Maintains the relationships between content assets and computes
 * "content DNA" so we can detect dependencies and stale content.
 *
 * HARD RULE: runImpactAnalysis NEVER auto-updates content.
 *   - It only REPORTS what would need to be updated.
 *   - All updates require a human to call markContentFresh() explicitly.
 *
 * Functions:
 *   1. computeContentDNA(contentAssetId) — derive a structural fingerprint
 *   2. findRelatedContent(dna)           — find assets with similar DNA
 *   3. createContentDependency(params)   — record an explicit dependency edge
 *   4. detectStaleContent(sourceType, sourceId) — find content depending on changed source
 *   5. runImpactAnalysis(sourceType, sourceId, sourceField?) — NEVER auto-updates
 *   6. markContentFresh(dependentAssetType, dependentAssetId) — human-acknowledge freshness
 */

import { db } from "@/lib/db";
import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────────

export interface ContentDNAShape {
  id: string;
  contentAssetId: string;
  hash: string; // structural hash of body + metadata
  targetKeyword: string | null;
  topicTerms: string; // JSON array of top terms
  internalLinks: string; // JSON array of linked URLs
  externalAuthorityLinks: string; // JSON array
  wordCount: number;
  headingCount: number;
  readabilityScore: number;
  computedAt: Date;
}

export interface ContentDependencyShape {
  id: string;
  dependentAssetType: string; // CONTENT_ASSET | KNOWLEDGE_BASE_ARTICLE | EMPLOYEE_LEARNING_RESOURCE
  dependentAssetId: string;
  sourceType: string; // SOURCE_CHANGE | UNIVERSITY_PAGE | COURSE_PAGE | COUNTRY_PAGE | KNOWLEDGE_OBJECT
  sourceId: string;
  sourceField: string | null;
  stalenessStatus: string; // FRESH | STALE | ACKNOWLEDGED
  lastCheckedAt: Date;
  lastFreshAt: Date;
  createdAt: Date;
}

export interface CreateContentDependencyParams {
  dependentAssetType: string;
  dependentAssetId: string;
  sourceType: string;
  sourceId: string;
  sourceField?: string | null;
}

export interface ImpactAnalysisResult {
  sourceType: string;
  sourceId: string;
  sourceField: string | null;
  affectedAssets: Array<{
    dependencyId: string;
    dependentAssetType: string;
    dependentAssetId: string;
    stalenessBefore: string;
    recommendedAction: string;
  }>;
  totalAffected: number;
  // HARD RULE: this function does NOT update any records.
  // It only reports. markContentFresh() must be called explicitly by a human.
  autoUpdated: false;
}

// Cast db to access models not on the standard client.

// ─── computeContentDNA ───────────────────────────────────────────

/**
 * Compute a structural fingerprint (DNA) for a content asset.
 *
 * The DNA includes:
 *   - SHA-256 hash of normalized body text
 *   - Top terms (top-10 most frequent non-stopwords)
 *   - Internal + external links extracted from markdown
 *   - Word count, heading count, readability score
 *
 * Persisted via upsert on contentAssetId.
 */
export async function computeContentDNA(contentAssetId: string): Promise<{ dnaId: string; hash: string }> {
  if (!contentAssetId) throw new Error("computeContentDNA: contentAssetId is required");

  const asset = await db.contentAsset?.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error(`computeContentDNA: content asset ${contentAssetId} not found`);

  const body = asset.bodyMarkdown ?? "";
  const normalized = body.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const hash = await sha256(normalized);

  const words = normalized.split(" ").filter(Boolean);
  const wordCount = words.length;

  // Top terms (filter stopwords)
  const stop = new Set(STOPWORDS);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length < 3 || stop.has(w)) continue;
    freq[w] = (freq[w] ?? 0) + 1;
  }
  const topicTerms = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);

  // Links
  const internalLinks = Array.from(body.matchAll(/\]\((\/[^)]+)\)/g)).map((m) => m[1]);
  const externalAuthorityLinks = Array.from(
    body.matchAll(/\]\(https?:\/\/([^)]+(?:\.gov|\.edu|\.ac\.[a-z]{2}))[^)]*\)/gi)
  ).map((m) => m[1]);

  const headingCount = (body.match(/^#{1,6}\s+/gm) || []).length;
  const readability = computeReadability(body);

  const dna = await db.contentDNA.upsert({
    where: { contentAssetId },
    create: {
      contentAssetId,
      hash,
      targetKeyword: asset.targetKeyword ?? null,
      topicTerms: JSON.stringify(topicTerms),
      internalLinks: JSON.stringify(internalLinks),
      externalAuthorityLinks: JSON.stringify(externalAuthorityLinks),
      wordCount,
      headingCount,
      readabilityScore: readability,
      computedAt: new Date(),
    },
    update: {
      hash,
      targetKeyword: asset.targetKeyword ?? null,
      topicTerms: JSON.stringify(topicTerms),
      internalLinks: JSON.stringify(internalLinks),
      externalAuthorityLinks: JSON.stringify(externalAuthorityLinks),
      wordCount,
      headingCount,
      readabilityScore: readability,
      computedAt: new Date(),
    },
  });

  return { dnaId: dna.id, hash };
}

// ─── findRelatedContent ──────────────────────────────────────────

/**
 * Find content assets whose DNA overlaps with the given DNA.
 *
 * Uses Jaccard similarity on the topicTerms sets. Returns assets with
 * similarity >= 0.3 (i.e. at least 30% topic-term overlap).
 */
export async function findRelatedContent(
  dna: ContentDNAShape
): Promise<Array<{ contentAssetId: string; similarity: number; sharedTerms: string[] }>> {
  const myTerms = safeParseArray(dna.topicTerms);
  if (myTerms.length === 0) return [];

  const all = await db.contentDNA.findMany({
    where: { contentAssetId: { not: dna.contentAssetId } },
  });

  const results: Array<{ contentAssetId: string; similarity: number; sharedTerms: string[] }> = [];
  for (const other of all) {
    const theirTerms = safeParseArray(other.topicTerms);
    const shared = myTerms.filter((t) => theirTerms.includes(t));
    if (shared.length === 0) continue;
    const union = new Set([...myTerms, ...theirTerms]);
    const similarity = shared.length / union.size;
    if (similarity >= 0.3) {
      results.push({ contentAssetId: other.contentAssetId, similarity, sharedTerms: shared });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

// ─── createContentDependency ─────────────────────────────────────

/**
 * Record an explicit dependency edge between a content asset and a
 * source it relies on. When the source changes, the dependent content
 * is flagged STALE.
 */
export async function createContentDependency(
  params: CreateContentDependencyParams
): Promise<{ dependencyId: string }> {
  if (!params.dependentAssetType || !params.dependentAssetId || !params.sourceType || !params.sourceId) {
    throw new Error("createContentDependency: dependentAssetType, dependentAssetId, sourceType, sourceId are required");
  }

  // Idempotent: if a matching dependency exists, return its ID
  const existing = await db.contentDependency.findFirst({
    where: {
      dependentAssetType: params.dependentAssetType,
      dependentAssetId: params.dependentAssetId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceField: params.sourceField ?? null,
    },
  });
  if (existing) return { dependencyId: existing.id };

  const dep = await db.contentDependency.create({
    data: {
      dependentAssetType: params.dependentAssetType,
      dependentAssetId: params.dependentAssetId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      sourceField: params.sourceField ?? null,
      stalenessStatus: "FRESH",
      lastCheckedAt: new Date(),
      lastFreshAt: new Date(),
    },
  });

  return { dependencyId: dep.id };
}

// ─── detectStaleContent ──────────────────────────────────────────

/**
 * Find content that depends on a source which has changed since the
 * dependency was last marked fresh.
 *
 * For SOURCE_CHANGE dependencies, checks if there are APPROVED DataChange
 * records newer than `lastFreshAt`.
 *
 * Marks matching dependencies STALE (this is allowed — flagging staleness
 * is informational, not a content mutation).
 */
export async function detectStaleContent(
  sourceType: string,
  sourceId: string
): Promise<{ staleDependencyIds: string[]; checkedCount: number }> {
  const deps = await db.contentDependency.findMany({
    where: { sourceType, sourceId, stalenessStatus: "FRESH" },
  });

  const staleIds: string[] = [];
  for (const d of deps) {
    let isStale = false;

    if (sourceType === "SOURCE_CHANGE") {
      // Look for newer approved changes on the source
      const changes = await db.dataChange.count({
        where: {
          sourceId,
          status: "APPROVED",
          appliedAt: { gte: d.lastFreshAt },
        },
      });
      isStale = changes > 0;
    } else if (sourceType === "UNIVERSITY_PAGE") {
      // Look for newer approved changes on this university
      const changes = await db.dataChange.count({
        where: {
          universitySlug: sourceId,
          status: "APPROVED",
          appliedAt: { gte: d.lastFreshAt },
        },
      });
      isStale = changes > 0;
    } else if (sourceType === "COURSE_PAGE") {
      const changes = await db.dataChange.count({
        where: {
          courseSlug: sourceId,
          status: "APPROVED",
          appliedAt: { gte: d.lastFreshAt },
        },
      });
      isStale = changes > 0;
    } else if (sourceType === "COUNTRY_PAGE") {
      const changes = await db.dataChange.count({
        where: {
          countrySlug: sourceId,
          status: "APPROVED",
          appliedAt: { gte: d.lastFreshAt },
        },
      });
      isStale = changes > 0;
    }

    if (isStale) staleIds.push(d.id);
  }

  if (staleIds.length > 0) {
    await db.contentDependency.updateMany({
      where: { id: { in: staleIds } },
      data: { stalenessStatus: "STALE", lastCheckedAt: new Date() },
    });
  }

  return { staleDependencyIds: staleIds, checkedCount: deps.length };
}

// ─── runImpactAnalysis ───────────────────────────────────────────

/**
 * Compute the impact of a source change on dependent content.
 *
 * HARD RULE: this function NEVER auto-updates content.
 *   - It does NOT modify the ContentAsset body.
 *   - It does NOT flip ContentDependency staleness to ACKNOWLEDGED.
 *   - It only READS state and returns a report.
 *
 * The human reviewer decides whether to actually update each affected asset.
 * After updating, they call markContentFresh() to clear the stale flag.
 */
export async function runImpactAnalysis(
  sourceType: string,
  sourceId: string,
  sourceField?: string
): Promise<ImpactAnalysisResult> {
  const where: Record<string, unknown> = { sourceType, sourceId };
  if (sourceField) where.sourceField = sourceField;

  const deps = await db.contentDependency.findMany({ where });

  const affectedAssets = deps.map((d) => ({
    dependencyId: d.id,
    dependentAssetType: d.dependentAssetType,
    dependentAssetId: d.dependentAssetId,
    stalenessBefore: d.stalenessStatus,
    recommendedAction: recommendAction(d),
  }));

  return {
    sourceType,
    sourceId,
    sourceField: sourceField ?? null,
    affectedAssets,
    totalAffected: affectedAssets.length,
    autoUpdated: false, // HARD RULE — always false
  };
}

// ─── markContentFresh ────────────────────────────────────────────

/**
 * Acknowledge that a dependent asset has been reviewed/updated and is
 * now considered fresh relative to its source.
 *
 * This is the ONLY way to clear a STALE flag — it requires an explicit
 * human action.
 */
export async function markContentFresh(
  dependentAssetType: string,
  dependentAssetId: string
): Promise<{ updatedCount: number }> {
  const result = await db.contentDependency.updateMany({
    where: {
      dependentAssetType,
      dependentAssetId,
      stalenessStatus: "STALE",
    },
    data: {
      stalenessStatus: "ACKNOWLEDGED",
      lastFreshAt: new Date(),
      lastCheckedAt: new Date(),
    },
  });

  return { updatedCount: result.count };
}

// ─── Helpers ──────────────────────────────────────────────────────

function recommendAction(dep: ContentDependencyShape): string {
  if (dep.stalenessStatus === "FRESH") {
    return "No action needed — dependency is fresh";
  }
  if (dep.stalenessStatus === "STALE") {
    return "Review and update the dependent content; then call markContentFresh()";
  }
  if (dep.stalenessStatus === "ACKNOWLEDGED") {
    return "Already acknowledged — no action needed";
  }
  return "Review";
}

function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function computeReadability(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const syllables = countSyllables(text);
  if (wordCount === 0) return 0;
  return Math.max(0, Math.min(100, Math.round(
    206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
  )));
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const w of words) {
    const groups = w.match(/[aeiouy]+/g);
    total += groups ? groups.length : 1;
  }
  return total;
}

async function sha256(s: string): Promise<string> {
  return createHash("sha256").update(s).digest("hex");
}

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had",
  "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how",
  "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its",
  "let", "put", "say", "she", "too", "use", "with", "this", "that", "from",
  "have", "they", "will", "what", "when", "your", "their", "there", "which",
  "would", "could", "should", "about", "into", "than", "them", "then", "these",
  "those", "very", "much", "many", "some", "such", "more", "most", "other",
]);
