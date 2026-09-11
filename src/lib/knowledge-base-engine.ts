/**
 * Knowledge Base Engine — manages verified, source-cited KB articles.
 *
 * Pipeline:
 *  1. ingestArticle(params) — write a draft article with source URL + verification metadata.
 *  2. verifyArticle(articleId, verifierId) — flip verificationStatus from NEEDS_REVIEW → VERIFIED.
 *  3. scheduleNextVerification() — compute nextVerificationAt from lastVerifiedAt + intervalDays.
 *  4. getOutdatedArticles() — list articles whose nextVerificationAt has passed.
 *
 * All stats are REAL — computed from KnowledgeBaseArticle rows in DB.
 */

import { db } from "@/lib/db";

export interface IngestArticleParams {
  title: string;
  slug?: string;
  country?: string;
  course?: string;
  universitySlug?: string;
  topic: string;
  year?: number;
  content: string;
  summary?: string;
  tags?: string[];
  sourceUrl?: string;
  sourceTitle?: string;
  officialUrl?: string;
  aiGenerated?: boolean;
  aiAgentId?: string;
  status?: string; // DRAFT | PENDING_REVIEW | PUBLISHED
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function hashContent(content: string): string {
  // FNV-1a 32-bit hash (deterministic, no crypto deps)
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export async function ingestArticle(params: IngestArticleParams) {
  let slug = params.slug || slugify(params.title);
  // Ensure slug uniqueness
  const exists = await db.knowledgeBaseArticle.findUnique({ where: { slug } });
  if (exists) {
    slug = `${slug}-${Date.now().toString().slice(-6)}`;
  }

  const contentHash = hashContent(params.content);
  const verificationStatus = params.sourceUrl ? "NEEDS_REVIEW" : "UNVERIFIED";
  const status = params.status || "DRAFT";

  return db.knowledgeBaseArticle.create({
    data: {
      title: params.title,
      slug,
      country: params.country || null,
      course: params.course || null,
      universitySlug: params.universitySlug || null,
      topic: params.topic,
      year: params.year || null,
      content: params.content,
      summary: params.summary || null,
      tags: JSON.stringify(params.tags || []),
      sourceUrl: params.sourceUrl || null,
      sourceTitle: params.sourceTitle || null,
      officialUrl: params.officialUrl || null,
      verificationStatus,
      confidence: params.sourceUrl ? 0.6 : 0.3,
      contentHash,
      status,
      aiGenerated: params.aiGenerated || false,
      aiAgentId: params.aiAgentId || null,
      humanReviewed: false,
    },
  });
}

export async function verifyArticle(articleId: string, verifierId: string) {
  const now = new Date();
  const nextVerificationAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  return db.knowledgeBaseArticle.update({
    where: { id: articleId },
    data: {
      verificationStatus: "VERIFIED",
      lastVerifiedAt: now,
      nextVerificationAt,
      confidence: 0.95,
      humanReviewed: true,
      approvedBy: verifierId,
      publishedAt: now,
      status: "PUBLISHED",
    },
  });
}

export async function rejectArticle(articleId: string, verifierId: string, reason?: string) {
  return db.knowledgeBaseArticle.update({
    where: { id: articleId },
    data: {
      verificationStatus: "REJECTED",
      approvedBy: verifierId,
      status: "REJECTED",
      summary: reason ? `[REJECTED: ${reason}]` : null,
    },
  });
}

export async function getOutdatedArticles(limit = 50) {
  const now = new Date();
  return db.knowledgeBaseArticle.findMany({
    where: {
      OR: [
        { nextVerificationAt: { lte: now } },
        {
          AND: [
            { nextVerificationAt: null },
            { lastVerifiedAt: { lte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
          ],
        },
      ],
      status: "PUBLISHED",
    },
    orderBy: { lastVerifiedAt: "asc" },
    take: limit,
  });
}

export async function searchArticles(params: {
  q?: string;
  country?: string;
  topic?: string;
  universitySlug?: string;
  status?: string;
  verificationStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { content: { contains: params.q } },
      { summary: { contains: params.q } },
    ];
  }
  if (params.country) where.country = params.country;
  if (params.topic) where.topic = params.topic;
  if (params.universitySlug) where.universitySlug = params.universitySlug;
  if (params.status) where.status = params.status;
  if (params.verificationStatus) where.verificationStatus = params.verificationStatus;

  const limit = Math.min(params.limit || 20, 100);
  const offset = params.offset || 0;

  const [items, total] = await Promise.all([
    db.knowledgeBaseArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.knowledgeBaseArticle.count({ where }),
  ]);

  return { items, total };
}

export async function getKbStats() {
  const total = await db.knowledgeBaseArticle.count();
  const byStatus = await db.knowledgeBaseArticle.groupBy({ by: ["status"], _count: true });
  const byVerification = await db.knowledgeBaseArticle.groupBy({
    by: ["verificationStatus"],
    _count: true,
  });
  const byTopic = await db.knowledgeBaseArticle.groupBy({
    by: ["topic"],
    _count: true,
    orderBy: { _count: { topic: "desc" } },
    take: 15,
  });
  const aiGenerated = await db.knowledgeBaseArticle.count({ where: { aiGenerated: true } });
  const humanReviewed = await db.knowledgeBaseArticle.count({ where: { humanReviewed: true } });

  const now = new Date();
  const outdated = await db.knowledgeBaseArticle.count({
    where: {
      OR: [
        { nextVerificationAt: { lte: now } },
        {
          AND: [
            { nextVerificationAt: null },
            { lastVerifiedAt: { lte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
          ],
        },
      ],
      status: "PUBLISHED",
    },
  });

  return {
    total,
    byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count.status })),
    byVerificationStatus: byVerification.map((v: any) => ({
      verificationStatus: v.verificationStatus,
      count: v._count.verificationStatus,
    })),
    byTopic: byTopic.map((t: any) => ({ topic: t.topic, count: t._count.topic })),
    aiGenerated,
    humanReviewed,
    outdated,
  };
}
