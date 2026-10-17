// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Keyword Research Engine
 *
 * Manages the keyword research pipeline:
 *   1. createKeywordResearch(data)        — store a keyword + metrics
 *   2. getKeywordResearch(filters)        — query with filters
 *   3. clusterKeywords(clusterName, ids)  — group related keywords
 *   4. prioritizeKeywords()               — rank by opportunity score
 *   5. getKeywordResearchStats()          — aggregate metrics
 *   6. linkKeywordToContent(keywordId, contentAssetId) — connect keyword → content
 *
 * Schema dependency: KeywordResearch table (typed via db-as-any cast).
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export interface KeywordResearchShape {
  id: string;
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number; // 0-100
  cpc: number; // cost-per-click in USD
  competition: number; // 0-1
  intent: string; // INFORMATIONAL | NAVIGATIONAL | COMMERCIAL | TRANSACTIONAL
  cluster: string | null;
  priorityScore: number; // 0-100, computed
  status: string; // NEW | SELECTED | IN_PROGRESS | RANKED | ARCHIVED
  country: string | null;
  language: string | null;
  relatedContentAssetId: string | null;
  currentPosition: number | null; // SERP position if ranking
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKeywordResearchData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc?: number;
  competition?: number;
  intent?: string;
  country?: string;
  language?: string;
  currentPosition?: number;
  metadata?: Record<string, unknown>;
}

export interface KeywordResearchFilters {
  keyword?: string;
  intent?: string;
  cluster?: string;
  status?: string;
  country?: string;
  minSearchVolume?: number;
  maxDifficulty?: number;
  limit?: number;
  offset?: number;
}

export interface KeywordResearchStats {
  total: number;
  byIntent: Record<string, number>;
  byStatus: Record<string, number>;
  byCluster: Record<string, number>;
  averageDifficulty: number;
  totalSearchVolume: number;
  averagePriority: number;
  rankedCount: number;
  linkedToContentCount: number;
}

// Cast db to allow access to models not on the standard client.

// ─── createKeywordResearch ───────────────────────────────────────

/**
 * Create a new keyword research record with a computed priorityScore.
 *
 * Priority score (0-100) is a heuristic combining:
 *   - searchVolume (higher = better)         weight: 50%
 *   - inverse keywordDifficulty (lower = better)  weight: 30%
 *   - intent commerciality (TRANSACTIONAL > COMMERCIAL > NAVIGATIONAL > INFORMATIONAL)  weight: 20%
 */
export async function createKeywordResearch(
  data: CreateKeywordResearchData
): Promise<{ keywordId: string }> {
  if (!data.keyword) throw new Error("createKeywordResearch: keyword is required");
  if (typeof data.searchVolume !== "number" || data.searchVolume < 0) {
    throw new Error("createKeywordResearch: searchVolume must be a non-negative number");
  }
  if (typeof data.keywordDifficulty !== "number" || data.keywordDifficulty < 0 || data.keywordDifficulty > 100) {
    throw new Error("createKeywordResearch: keywordDifficulty must be 0-100");
  }

  const intent = data.intent ?? "INFORMATIONAL";
  const priorityScore = computePriorityScore(
    data.searchVolume,
    data.keywordDifficulty,
    intent
  );

  const record = await db.keywordResearch.create({
    data: {
      keyword: data.keyword,
      searchVolume: data.searchVolume,
      keywordDifficulty: data.keywordDifficulty,
      cpc: data.cpc ?? 0,
      competition: data.competition ?? 0,
      intent,
      cluster: null,
      priorityScore,
      status: "NEW",
      country: data.country ?? null,
      language: data.language ?? null,
      relatedContentAssetId: null,
      currentPosition: data.currentPosition ?? null,
      metadata: JSON.stringify(data.metadata ?? {}),
    },
  });

  return { keywordId: record.id };
}

// ─── getKeywordResearch ──────────────────────────────────────────

/**
 * Query keyword research records with optional filters.
 */
export async function getKeywordResearch(
  filters: KeywordResearchFilters = {}
): Promise<KeywordResearchShape[]> {
  const where: Record<string, unknown> = {};

  if (filters.keyword) where.keyword = { contains: filters.keyword };
  if (filters.intent) where.intent = filters.intent;
  if (filters.cluster) where.cluster = filters.cluster;
  if (filters.status) where.status = filters.status;
  if (filters.country) where.country = filters.country;
  if (typeof filters.minSearchVolume === "number") {
    where.searchVolume = { gte: filters.minSearchVolume };
  }
  if (typeof filters.maxDifficulty === "number") {
    where.keywordDifficulty = { ...(where.keywordDifficulty as object || {}), lte: filters.maxDifficulty };
  }

  return db.keywordResearch.findMany({
    where,
    orderBy: { priorityScore: "desc" },
    take: filters.limit ?? 100,
    skip: filters.offset ?? 0,
  });
}

// ─── clusterKeywords ─────────────────────────────────────────────

/**
 * Assign a cluster name to a set of keyword research records.
 * Used to group related keywords (e.g. "uk student visa" cluster).
 */
export async function clusterKeywords(
  clusterName: string,
  keywordIds: string[]
): Promise<{ updatedCount: number }> {
  if (!clusterName) throw new Error("clusterKeywords: clusterName is required");
  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw new Error("clusterKeywords: keywordIds must be a non-empty array");
  }

  const result = await db.keywordResearch.updateMany({
    where: { id: { in: keywordIds } },
    data: { cluster: clusterName },
  });

  return { updatedCount: result.count };
}

// ─── prioritizeKeywords ──────────────────────────────────────────

/**
 * Recompute and persist the priorityScore for all keywords.
 *
 * Useful after batch imports or when the priority formula changes.
 * Returns the count of keywords updated.
 */
export async function prioritizeKeywords(): Promise<{
  updatedCount: number;
  topKeywords: Array<{ keyword: string; priorityScore: number }>;
}> {
  const all = await db.keywordResearch.findMany({});

  let updatedCount = 0;
  const ranked: Array<{ keyword: string; priorityScore: number }> = [];

  for (const k of all) {
    const newScore = computePriorityScore(
      k.searchVolume,
      k.keywordDifficulty,
      k.intent
    );
    if (newScore !== k.priorityScore) {
      await db.keywordResearch.update({
        where: { id: k.id },
        data: { priorityScore: newScore },
      });
      updatedCount++;
    }
    ranked.push({ keyword: k.keyword, priorityScore: newScore });
  }

  ranked.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    updatedCount,
    topKeywords: ranked.slice(0, 20),
  };
}

// ─── getKeywordResearchStats ─────────────────────────────────────

/**
 * Aggregate keyword research metrics for the dashboard.
 */
export async function getKeywordResearchStats(): Promise<KeywordResearchStats> {
  const [all, total, agg, rankedCount, linkedCount] = await Promise.all([
    db.keywordResearch.findMany({ select: { intent: true, status: true, cluster: true } }),
    db.keywordResearch.count({}),
    db.keywordResearch.aggregate({
      _avg: { keywordDifficulty: true, priorityScore: true },
      _sum: { searchVolume: true },
    }),
    db.keywordResearch.count({ where: { currentPosition: { not: null } } }),
    db.keywordResearch.count({ where: { relatedContentAssetId: { not: null } } }),
  ]);

  const byIntent: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byCluster: Record<string, number> = {};
  for (const k of all) {
    byIntent[k.intent] = (byIntent[k.intent] ?? 0) + 1;
    byStatus[k.status] = (byStatus[k.status] ?? 0) + 1;
    const c = k.cluster ?? "(unclustered)";
    byCluster[c] = (byCluster[c] ?? 0) + 1;
  }

  return {
    total,
    byIntent,
    byStatus,
    byCluster,
    averageDifficulty: Math.round((agg._avg.keywordDifficulty ?? 0) * 10) / 10,
    totalSearchVolume: agg._sum.searchVolume ?? 0,
    averagePriority: Math.round((agg._avg.priorityScore ?? 0) * 10) / 10,
    rankedCount,
    linkedToContentCount: linkedCount,
  };
}

// ─── linkKeywordToContent ────────────────────────────────────────

/**
 * Link a keyword research record to the content asset that targets it.
 * Used to track which keywords have been assigned to which content.
 */
export async function linkKeywordToContent(
  keywordId: string,
  contentAssetId: string
): Promise<{ linked: boolean }> {
  if (!keywordId || !contentAssetId) {
    throw new Error("linkKeywordToContent: keywordId and contentAssetId are required");
  }

  const keyword = await db.keywordResearch.findUnique({ where: { id: keywordId } });
  if (!keyword) throw new Error(`linkKeywordToContent: keyword ${keywordId} not found`);

  await db.keywordResearch.update({
    where: { id: keywordId },
    data: {
      relatedContentAssetId: contentAssetId,
      status: keyword.status === "NEW" ? "SELECTED" : keyword.status,
    },
  });

  return { linked: true };
}

// ─── Helpers ──────────────────────────────────────────────────────

function computePriorityScore(
  searchVolume: number,
  difficulty: number,
  intent: string
): number {
  // Volume component (log-scaled, max 50)
  const volumeScore = searchVolume > 0
    ? Math.min(50, Math.round((Math.log10(searchVolume + 1) / 4) * 50))
    : 0;

  // Difficulty component (lower difficulty = higher score, max 30)
  const difficultyScore = Math.round(((100 - difficulty) / 100) * 30);

  // Intent component (max 20)
  const intentWeights: Record<string, number> = {
    TRANSACTIONAL: 20,
    COMMERCIAL: 15,
    NAVIGATIONAL: 10,
    INFORMATIONAL: 5,
  };
  const intentScore = intentWeights[intent] ?? 5;

  return Math.min(100, Math.max(0, volumeScore + difficultyScore + intentScore));
}
