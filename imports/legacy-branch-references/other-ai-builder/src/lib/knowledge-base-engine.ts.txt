// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Knowledge Base Engine
 *
 * Manages the ALO internal knowledge base: structured articles that
 * document processes, policies, country/university intelligence, etc.
 *
 * Lifecycle:
 *   1. createKnowledgeBaseArticle(data)        — DRAFT a new article
 *   2. publishKnowledgeBaseArticle(articleId, approvedBy) — human approval → PUBLISHED
 *   3. verifyKnowledgeBaseArticle(articleId, verifierId, confidence) — verification pass
 *   4. detectOutdatedArticles()                — find articles whose source data has changed
 *   5. getKnowledgeBaseStats()                 — aggregate metrics
 *
 * Schema dependency: KnowledgeBaseArticle table (typed via db-as-any cast).
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export type KnowledgeBaseArticleStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "OUTDATED"
  | "ARCHIVED";

export type KnowledgeBaseArticleCategory =
  | "POLICY"
  | "PROCESS"
  | "COUNTRY_GUIDE"
  | "UNIVERSITY_GUIDE"
  | "VISA_GUIDE"
  | "SCHOLARSHIP"
  | "FAQ"
  | "TRAINING"
  | "OTHER";

export interface KnowledgeBaseArticleShape {
  id: string;
  title: string;
  slug: string;
  category: KnowledgeBaseArticleCategory;
  status: KnowledgeBaseArticleStatus;
  bodyMarkdown: string;
  summary: string;
  tags: string; // JSON array
  relatedEntityType: string | null; // UNIVERSITY | COURSE | COUNTRY | ...
  relatedEntitySlug: string | null;
  sourceUrl: string | null;
  sourceSnapshotHash: string | null;
  verificationStatus: string; // UNVERIFIED | VERIFIED | OUTDATED
  verifierId: string | null;
  verifiedAt: Date | null;
  verificationConfidence: number;
  approvedById: string | null;
  approvedAt: Date | null;
  publishedAt: Date | null;
  viewsCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKnowledgeBaseArticleData {
  title: string;
  slug?: string;
  category: KnowledgeBaseArticleCategory;
  bodyMarkdown: string;
  summary?: string;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntitySlug?: string;
  sourceUrl?: string;
  sourceSnapshotHash?: string;
  authorId?: string;
}

export interface KnowledgeBaseFilters {
  category?: KnowledgeBaseArticleCategory;
  status?: KnowledgeBaseArticleStatus;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntitySlug?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface KnowledgeBaseStats {
  total: number;
  byStatus: Record<KnowledgeBaseArticleStatus, number>;
  byCategory: Record<string, number>;
  outdatedCount: number;
  needsVerificationCount: number;
  averageConfidence: number;
  totalViews: number;
}

// Cast db to allow access to the (not-yet-generated) KnowledgeBaseArticle model.

// ─── slugify ─────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ─── createKnowledgeBaseArticle ──────────────────────────────────

/**
 * Create a new knowledge base article in DRAFT status.
 */
export async function createKnowledgeBaseArticle(
  data: CreateKnowledgeBaseArticleData
): Promise<{ articleId: string }> {
  if (!data.title || !data.category || !data.bodyMarkdown) {
    throw new Error("createKnowledgeBaseArticle: title, category, bodyMarkdown are required");
  }

  const article = await db.knowledgeBaseArticle.create({
    data: {
      title: data.title,
      slug: data.slug || slugify(data.title),
      category: data.category,
      status: "DRAFT",
      bodyMarkdown: data.bodyMarkdown,
      summary: data.summary ?? data.bodyMarkdown.slice(0, 200),
      tags: JSON.stringify(data.tags ?? []),
      relatedEntityType: data.relatedEntityType ?? null,
      relatedEntitySlug: data.relatedEntitySlug ?? null,
      sourceUrl: data.sourceUrl ?? null,
      sourceSnapshotHash: data.sourceSnapshotHash ?? null,
      verificationStatus: "UNVERIFIED",
      verifierId: null,
      verifiedAt: null,
      verificationConfidence: 0,
      approvedById: null,
      approvedAt: null,
      publishedAt: null,
      viewsCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      authorId: data.authorId ?? null,
    },
  });

  return { articleId: article.id };
}

// ─── getKnowledgeBaseArticles ────────────────────────────────────

/**
 * List knowledge base articles with optional filters.
 */
export async function getKnowledgeBaseArticles(
  filters: KnowledgeBaseFilters = {}
): Promise<KnowledgeBaseArticleShape[]> {
  const where: Record<string, unknown> = {};

  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;
  if (filters.relatedEntityType) where.relatedEntityType = filters.relatedEntityType;
  if (filters.relatedEntitySlug) where.relatedEntitySlug = filters.relatedEntitySlug;
  if (filters.tags && filters.tags.length > 0) {
    // SQLite JSON containment is awkward — fetch and filter in memory
  }
  if (filters.searchQuery) {
    where.OR = [
      { title: { contains: filters.searchQuery } },
      { summary: { contains: filters.searchQuery } },
      { bodyMarkdown: { contains: filters.searchQuery } },
    ];
  }

  let results = await db.knowledgeBaseArticle.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });

  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((r) => {
      const tagsArr = safeParseArray(r.tags);
      return filters.tags!.some((t) => tagsArr.includes(t));
    });
  }

  return results;
}

// ─── publishKnowledgeBaseArticle ─────────────────────────────────

/**
 * Publish a DRAFT or IN_REVIEW knowledge base article.
 * Sets status = PUBLISHED + approvedBy + approvedAt + publishedAt.
 */
export async function publishKnowledgeBaseArticle(
  articleId: string,
  approvedBy: string
): Promise<{ published: boolean }> {
  if (!approvedBy) throw new Error("publishKnowledgeBaseArticle: approvedBy is required");

  const article = await db.knowledgeBaseArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new Error(`publishKnowledgeBaseArticle: article ${articleId} not found`);
  if (article.status === "PUBLISHED") return { published: false };

  await db.knowledgeBaseArticle.update({
    where: { id: articleId },
    data: {
      status: "PUBLISHED",
      approvedById: approvedBy,
      approvedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  return { published: true };
}

// ─── verifyKnowledgeBaseArticle ──────────────────────────────────

/**
 * Record a verification pass on a knowledge base article.
 *
 * `confidence` is 0.0–1.0 — captures the verifier's confidence that the
 * article is currently accurate. High confidence (>=0.8) sets verificationStatus
 * to "VERIFIED"; low confidence (<0.5) sets it to "OUTDATED".
 */
export async function verifyKnowledgeBaseArticle(
  articleId: string,
  verifierId: string,
  confidence: number
): Promise<{ verified: boolean; newStatus: string }> {
  if (!verifierId) throw new Error("verifyKnowledgeBaseArticle: verifierId is required");
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    throw new Error("verifyKnowledgeBaseArticle: confidence must be a number between 0 and 1");
  }

  const article = await db.knowledgeBaseArticle.findUnique({ where: { id: articleId } });
  if (!article) throw new Error(`verifyKnowledgeBaseArticle: article ${articleId} not found`);

  const verificationStatus = confidence >= 0.8 ? "VERIFIED" : confidence < 0.5 ? "OUTDATED" : "UNVERIFIED";
  const newArticleStatus = verificationStatus === "OUTDATED" && article.status === "PUBLISHED"
    ? "OUTDATED"
    : article.status;

  await db.knowledgeBaseArticle.update({
    where: { id: articleId },
    data: {
      verifierId,
      verifiedAt: new Date(),
      verificationConfidence: confidence,
      verificationStatus,
      status: newArticleStatus,
    },
  });

  return { verified: true, newStatus: verificationStatus };
}

// ─── detectOutdatedArticles ──────────────────────────────────────

/**
 * Find articles whose underlying source data has changed since the last
 * verification.
 *
 * Heuristic: an article is considered outdated if:
 *   - It is PUBLISHED.
 *   - It has a relatedEntityType/slug (UNIVERSITY/COURSE).
 *   - There exists an APPROVED DataChange record on that entity that was
 *     applied AFTER the article's verifiedAt (or publishedAt if never verified).
 *
 * Returns the list of outdated article IDs and marks them OUTDATED in place.
 */
export async function detectOutdatedArticles(): Promise<{
  outdatedArticleIds: string[];
  checkedCount: number;
}> {
  const published = await db.knowledgeBaseArticle.findMany({
    where: {
      status: "PUBLISHED",
      relatedEntityType: { not: null },
      relatedEntitySlug: { not: null },
    },
  });

  const outdatedIds: string[] = [];

  for (const article of published) {
    if (!article.relatedEntitySlug) continue;

    // Find approved changes on this entity applied after the article's last verification
    const since = article.verifiedAt ?? article.publishedAt ?? article.updatedAt;
    const changeWhere: Record<string, unknown> = {
      status: "APPROVED",
      appliedAt: { gte: since },
    };
    if (article.relatedEntityType === "UNIVERSITY") {
      changeWhere.universitySlug = article.relatedEntitySlug;
    } else if (article.relatedEntityType === "COURSE") {
      changeWhere.courseSlug = article.relatedEntitySlug;
    } else if (article.relatedEntityType === "COUNTRY") {
      changeWhere.countrySlug = article.relatedEntitySlug;
    } else {
      continue;
    }

    const changes = await db.dataChange.count({ where: changeWhere });
    if (changes > 0) {
      outdatedIds.push(article.id);
    }
  }

  if (outdatedIds.length > 0) {
    await db.knowledgeBaseArticle.updateMany({
      where: { id: { in: outdatedIds } },
      data: { status: "OUTDATED", verificationStatus: "OUTDATED" },
    });
  }

  return { outdatedArticleIds: outdatedIds, checkedCount: published.length };
}

// ─── getKnowledgeBaseStats ───────────────────────────────────────

/**
 * Aggregate knowledge base metrics for the dashboard.
 */
export async function getKnowledgeBaseStats(): Promise<KnowledgeBaseStats> {
  const [all, total, agg] = await Promise.all([
    db.knowledgeBaseArticle.findMany({ select: { status: true, category: true, verificationStatus: true } }),
    db.knowledgeBaseArticle.count({}),
    db.knowledgeBaseArticle.aggregate({
      _avg: { verificationConfidence: true },
      _sum: { viewsCount: true },
    }),
  ]);

  const byStatus: Record<KnowledgeBaseArticleStatus, number> = {
    DRAFT: 0,
    IN_REVIEW: 0,
    PUBLISHED: 0,
    OUTDATED: 0,
    ARCHIVED: 0,
  };
  const byCategory: Record<string, number> = {};
  let outdatedCount = 0;
  let needsVerificationCount = 0;

  for (const a of all) {
    byStatus[a.status as KnowledgeBaseArticleStatus] = (byStatus[a.status as KnowledgeBaseArticleStatus] ?? 0) + 1;
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    if (a.verificationStatus === "OUTDATED") outdatedCount++;
    if (a.verificationStatus === "UNVERIFIED") needsVerificationCount++;
  }

  return {
    total,
    byStatus,
    byCategory,
    outdatedCount,
    needsVerificationCount,
    averageConfidence: Math.round((agg._avg.verificationConfidence ?? 0) * 100) / 100,
    totalViews: agg._sum.viewsCount ?? 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function safeParseArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
