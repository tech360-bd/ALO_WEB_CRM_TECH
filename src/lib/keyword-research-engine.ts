/**
 * Keyword Research Engine — stores and clusters SEO keyword intelligence.
 *
 * Capabilities:
 *  - recordKeyword(params): upsert a keyword with volume/difficulty/cpc data
 *  - clusterKeywords(keywordIds, clusterName): group related keywords
 *  - prioritizeKeyword(keywordId, priority): set HIGH/MEDIUM/LOW priority
 *  - getStats(): aggregate real metrics from KeywordResearch table
 */

import { db } from "@/lib/db";

export interface RecordKeywordParams {
  keyword: string;
  country?: string;
  course?: string;
  universitySlug?: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  competition?: string; // LOW, MEDIUM, HIGH, UNKNOWN
  intent?: string; // INFORMATIONAL, NAVIGATIONAL, TRANSACTIONAL, COMMERCIAL
  relatedKeywords?: string[];
  serpFeatures?: string[];
  status?: string;
  priority?: string;
  contentAssetId?: string;
}

export async function recordKeyword(params: RecordKeywordParams) {
  // Find by unique combination of keyword + country + course (or just keyword if no scoping)
  const existing = await db.keywordResearch.findFirst({
    where: {
      keyword: params.keyword,
      country: params.country || null,
      course: params.course || null,
    },
  });

  const data = {
    keyword: params.keyword,
    country: params.country || null,
    course: params.course || null,
    universitySlug: params.universitySlug || null,
    searchVolume: params.searchVolume || 0,
    difficulty: params.difficulty || 0,
    cpc: params.cpc || 0,
    competition: params.competition || "UNKNOWN",
    intent: params.intent || "INFORMATIONAL",
    relatedKeywords: JSON.stringify(params.relatedKeywords || []),
    serpFeatures: JSON.stringify(params.serpFeatures || []),
    status: params.status || existing?.status || "NEW",
    priority: params.priority || existing?.priority || "MEDIUM",
    contentAssetId: params.contentAssetId || existing?.contentAssetId || null,
  };

  if (existing) {
    return db.keywordResearch.update({ where: { id: existing.id }, data });
  }
  return db.keywordResearch.create({ data });
}

export async function clusterKeywords(keywordIds: string[], clusterName: string) {
  const clusterId = `cluster-${Date.now().toString().slice(-6)}`;
  const result = await db.keywordResearch.updateMany({
    where: { id: { in: keywordIds } },
    data: { clusterId, clusterName },
  });
  return { clusterId, clusterName, updated: result.count };
}

export async function prioritizeKeyword(keywordId: string, priority: string) {
  return db.keywordResearch.update({
    where: { id: keywordId },
    data: { priority, status: "PRIORITIZED" },
  });
}

export async function searchKeywords(params: {
  q?: string;
  country?: string;
  intent?: string;
  status?: string;
  priority?: string;
  clusterId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.q) where.keyword = { contains: params.q };
  if (params.country) where.country = params.country;
  if (params.intent) where.intent = params.intent;
  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.clusterId) where.clusterId = params.clusterId;

  const limit = Math.min(params.limit || 50, 200);
  const offset = params.offset || 0;

  const [items, total] = await Promise.all([
    db.keywordResearch.findMany({
      where,
      orderBy: { searchVolume: "desc" },
      take: limit,
      skip: offset,
    }),
    db.keywordResearch.count({ where }),
  ]);

  return { items, total };
}

export async function getKeywordStats() {
  const total = await db.keywordResearch.count();
  const byIntent = await db.keywordResearch.groupBy({ by: ["intent"], _count: true });
  const byPriority = await db.keywordResearch.groupBy({ by: ["priority"], _count: true });
  const byStatus = await db.keywordResearch.groupBy({ by: ["status"], _count: true });
  const byCountry = await db.keywordResearch.groupBy({
    by: ["country"],
    _count: true,
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });

  const totalVolume = await db.keywordResearch.aggregate({ _sum: { searchVolume: true } });
  const avgDifficulty = await db.keywordResearch.aggregate({ _avg: { difficulty: true } });
  const clustered = await db.keywordResearch.count({
    where: { clusterId: { not: null } },
  });

  return {
    total,
    clustered,
    totalSearchVolume: totalVolume._sum.searchVolume || 0,
    averageDifficulty: Math.round((avgDifficulty._avg.difficulty || 0) * 100) / 100,
    byIntent: byIntent.map((i: any) => ({ intent: i.intent, count: i._count.intent })),
    byPriority: byPriority.map((p: any) => ({ priority: p.priority, count: p._count.priority })),
    byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count.status })),
    byCountry: byCountry.map((c: any) => ({
      country: c.country || "GLOBAL",
      count: c._count.country,
    })),
  };
}
