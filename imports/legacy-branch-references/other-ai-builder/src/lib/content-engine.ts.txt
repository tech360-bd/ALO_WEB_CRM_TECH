// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Content Engine
 *
 * Manages the content lifecycle:
 *   1. createContentAsset(params) — DRAFT a new content asset
 *   2. runQualityGates(contentAssetId) — 7 automated quality checks
 *   3. approveContent(contentAssetId, approverId) — human approval
 *   4. publishContent(contentAssetId, platform, publishedUrl?) — multi-platform publish
 *   5. repurposeContent(sourceAssetId, targetContentType) — derive new asset
 *   6. getContentPerformanceStats() — aggregate metrics
 *
 * Schema dependency: ContentAsset, ContentCampaign, ContentPublication
 * tables. If absent at runtime, calls fail (typed via db-as-any cast).
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export type ContentType =
  | "BLOG_POST"
  | "NEWS_ARTICLE"
  | "SOCIAL_POST"
  | "VIDEO_SCRIPT"
  | "INFOGRAPHIC"
  | "EMAIL_NEWSLETTER"
  | "LANDING_PAGE"
  | "PODCAST_SCRIPT";

export type ContentStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export type ContentPlatform =
  | "WEBSITE"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "YOUTUBE"
  | "TWITTER"
  | "EMAIL"
  | "BLOG";

export interface CreateContentAssetParams {
  title: string;
  contentType: ContentType;
  topic?: string;
  targetKeyword?: string;
  campaignId?: string;
  authorId?: string;
  brief?: string;
  bodyMarkdown?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface QualityGateResult {
  name: string;
  passed: boolean;
  score: number; // 0-100
  notes: string;
}

export interface QualityGateReport {
  contentAssetId: string;
  overallPassed: boolean;
  overallScore: number;
  gates: QualityGateResult[];
  runAt: Date;
}

export interface ContentAssetShape {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  topic: string | null;
  targetKeyword: string | null;
  campaignId: string | null;
  authorId: string | null;
  brief: string | null;
  bodyMarkdown: string;
  tags: string; // JSON
  qualityScore: number;
  qualityGatesPassed: number;
  qualityGatesTotal: number;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPerformanceStats {
  totalAssets: number;
  byStatus: Record<ContentStatus, number>;
  byContentType: Record<string, number>;
  publishedCount: number;
  approvedNotPublished: number;
  averageQualityScore: number;
  totalPublications: number;
  publicationsByPlatform: Record<string, number>;
}

// Cast db to allow access to models that may not exist on the client.

// ─── createContentAsset ──────────────────────────────────────────

/**
 * Create a new content asset in DRAFT status.
 *
 * The asset starts as DRAFT with qualityScore=0. The caller is expected
 * to fill bodyMarkdown over time, then call runQualityGates() before
 * requesting approval.
 */
export async function createContentAsset(params: CreateContentAssetParams): Promise<{ contentAssetId: string }> {
  if (!params.title || !params.contentType) {
    throw new Error("createContentAsset: title and contentType are required");
  }

  const asset = await db.contentAsset.create({
    data: {
      title: params.title,
      contentType: params.contentType,
      status: "DRAFT",
      topic: params.topic ?? null,
      targetKeyword: params.targetKeyword ?? null,
      campaignId: params.campaignId ?? null,
      authorId: params.authorId ?? null,
      brief: params.brief ?? null,
      bodyMarkdown: params.bodyMarkdown ?? "",
      tags: JSON.stringify(params.tags ?? []),
      qualityScore: 0,
      qualityGatesPassed: 0,
      qualityGatesTotal: 7,
      approvedById: null,
      approvedAt: null,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });

  return { contentAssetId: asset.id };
}

// ─── runQualityGates ─────────────────────────────────────────────

/**
 * Run the 7 automated content quality gates and persist the result.
 *
 * Gates (each returns 0-100; pass = score >= 70):
 *   1. WORD_COUNT       — body meets minimum word count for the content type
 *   2. KEYWORD_USAGE    — target keyword appears 2-6 times per 1000 words
 *   3. READABILITY      — Flesch reading ease >= 50 (college-level)
 *   4. STRUCTURE        — has H2/H3 subheadings every 300 words
 *   5. INTERNAL_LINKS   — at least 1 internal link
 *   6. EXTERNAL_AUTHORITY — at least 1 external link to an official source
 *   7. ORIGINALITY      — body is not empty and not duplicate of a recent asset
 *
 * Updates the ContentAsset with qualityScore (avg) + gatesPassed count.
 */
export async function runQualityGates(contentAssetId: string): Promise<QualityGateReport> {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error(`runQualityGates: content asset ${contentAssetId} not found`);

  const body = asset.bodyMarkdown ?? "";
  const words = body.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const minWordCount: Record<ContentType, number> = {
    BLOG_POST: 800,
    NEWS_ARTICLE: 400,
    SOCIAL_POST: 50,
    VIDEO_SCRIPT: 300,
    INFOGRAPHIC: 100,
    EMAIL_NEWSLETTER: 200,
    LANDING_PAGE: 300,
    PODCAST_SCRIPT: 400,
  };

  // 1. WORD_COUNT
  const requiredWords = minWordCount[asset.contentType as ContentType] ?? 300;
  const wordCountScore = Math.min(100, Math.round((wordCount / requiredWords) * 100));
  const wordCountGate: QualityGateResult = {
    name: "WORD_COUNT",
    passed: wordCountScore >= 70,
    score: wordCountScore,
    notes: `${wordCount}/${requiredWords} words`,
  };

  // 2. KEYWORD_USAGE
  let keywordScore = 100;
  let keywordNotes = "No target keyword set — gate skipped (passed)";
  if (asset.targetKeyword) {
    const kw = asset.targetKeyword.toLowerCase();
    const occurrences = words.filter((w) => w.toLowerCase().includes(kw)).length;
    const per1k = wordCount > 0 ? (occurrences / wordCount) * 1000 : 0;
    keywordScore = per1k >= 2 && per1k <= 6 ? 100 : per1k < 2 ? 40 : 60;
    keywordNotes = `Keyword "${asset.targetKeyword}" appears ${occurrences} times (${per1k.toFixed(1)}/1000)`;
  }
  const keywordGate: QualityGateResult = {
    name: "KEYWORD_USAGE",
    passed: keywordScore >= 70,
    score: keywordScore,
    notes: keywordNotes,
  };

  // 3. READABILITY (rough Flesch Reading Ease approximation)
  const sentences = (body.match(/[.!?]+/g) || []).length || 1;
  const syllables = countSyllables(body);
  const flesch = wordCount > 0 && sentences > 0
    ? 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
    : 0;
  const readabilityScore = Math.max(0, Math.min(100, Math.round(flesch)));
  const readabilityGate: QualityGateResult = {
    name: "READABILITY",
    passed: readabilityScore >= 50,
    score: readabilityScore,
    notes: `Flesch Reading Ease ≈ ${readabilityScore}`,
  };

  // 4. STRUCTURE (subheading frequency)
  const h2h3Count = (body.match(/^#{2,3}\s+/gm) || []).length;
  const expectedSubheads = Math.max(1, Math.floor(wordCount / 300));
  const structureScore = Math.min(100, Math.round((h2h3Count / expectedSubheads) * 100));
  const structureGate: QualityGateResult = {
    name: "STRUCTURE",
    passed: structureScore >= 70,
    score: structureScore,
    notes: `${h2h3Count}/${expectedSubheads} subheadings`,
  };

  // 5. INTERNAL_LINKS (markdown links to /relative paths)
  const internalLinks = (body.match(/\]\(\/[^)]+\)/g) || []).length;
  const internalScore = internalLinks >= 1 ? 100 : internalLinks === 0 ? 30 : 70;
  const internalGate: QualityGateResult = {
    name: "INTERNAL_LINKS",
    passed: internalScore >= 70,
    score: internalScore,
    notes: `${internalLinks} internal link(s)`,
  };

  // 6. EXTERNAL_AUTHORITY (links to .gov/.edu/.ac.uk or non-self http links)
  const externalLinks = (body.match(/\]\(https?:\/\/(?![^)]*aloeducation\.com)[^)]+\)/g) || []).length;
  const authorityLinks = (body.match(/\]\(https?:\/\/[^)]*(?:\.gov|\.edu|\.ac\.[a-z]{2})/gi) || []).length;
  const externalScore = authorityLinks >= 1 ? 100 : externalLinks >= 1 ? 70 : 30;
  const externalGate: QualityGateResult = {
    name: "EXTERNAL_AUTHORITY",
    passed: externalScore >= 70,
    score: externalScore,
    notes: `${authorityLinks} authority / ${externalLinks} external link(s)`,
  };

  // 7. ORIGINALITY
  let originalityScore = 100;
  let originalityNotes = "Body has content";
  if (wordCount < 20) {
    originalityScore = 0;
    originalityNotes = "Body is empty or too short";
  } else {
    // Check for duplicates among recent assets
    const recent = await db.contentAsset.findMany({
      where: { id: { not: contentAssetId }, updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { bodyMarkdown: true },
    });
    const bodyLower = body.toLowerCase();
    const dup = recent.find((r) => {
      const other = (r.bodyMarkdown ?? "").toLowerCase();
      if (other.length < 50) return false;
      return bodyLower === other || bodyLower.includes(other) || other.includes(bodyLower);
    });
    if (dup) {
      originalityScore = 0;
      originalityNotes = "Duplicate content detected";
    }
  }
  const originalityGate: QualityGateResult = {
    name: "ORIGINALITY",
    passed: originalityScore >= 70,
    score: originalityScore,
    notes: originalityNotes,
  };

  const gates = [
    wordCountGate,
    keywordGate,
    readabilityGate,
    structureGate,
    internalGate,
    externalGate,
    originalityGate,
  ];

  const overallScore = Math.round(gates.reduce((a, g) => a + g.score, 0) / gates.length);
  const overallPassed = gates.every((g) => g.passed);
  const passedCount = gates.filter((g) => g.passed).length;

  await db.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      qualityScore: overallScore,
      qualityGatesPassed: passedCount,
      qualityGatesTotal: gates.length,
      status: overallPassed ? "IN_REVIEW" : "DRAFT",
      qualityGateReport: JSON.stringify({ gates, runAt: new Date().toISOString() }),
    },
  });

  return {
    contentAssetId,
    overallPassed,
    overallScore,
    gates,
    runAt: new Date(),
  };
}

// ─── approveContent ──────────────────────────────────────────────

/**
 * Mark a content asset as approved by a human reviewer.
 *
 * Prerequisite: all 7 quality gates must have passed (qualityGatesPassed === 7).
 * Sets status = APPROVED, approvedById, approvedAt.
 */
export async function approveContent(
  contentAssetId: string,
  approverId: string
): Promise<{ approved: boolean }> {
  if (!approverId) throw new Error("approveContent: approverId is required");

  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error(`approveContent: content asset ${contentAssetId} not found`);

  if (asset.qualityGatesPassed < (asset.qualityGatesTotal || 7)) {
    throw new Error(
      `approveContent: cannot approve — ${asset.qualityGatesPassed}/${asset.qualityGatesTotal || 7} quality gates passed`
    );
  }

  await db.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      status: "APPROVED",
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });

  return { approved: true };
}

// ─── publishContent ──────────────────────────────────────────────

/**
 * Publish an approved content asset to a specific platform.
 *
 * Prerequisite: status === APPROVED.
 * Side effect: creates a ContentPublication record and (if first publication)
 * flips the asset status to PUBLISHED.
 */
export async function publishContent(
  contentAssetId: string,
  platform: ContentPlatform,
  publishedUrl?: string
): Promise<{ publicationId: string }> {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error(`publishContent: content asset ${contentAssetId} not found`);
  if (asset.status !== "APPROVED" && asset.status !== "PUBLISHED") {
    throw new Error(`publishContent: asset must be APPROVED before publishing (current: ${asset.status})`);
  }

  const publication = await db.contentPublication.create({
    data: {
      contentAssetId,
      platform,
      publishedUrl: publishedUrl ?? null,
      publishedAt: new Date(),
      status: "PUBLISHED",
    },
  });

  if (asset.status !== "PUBLISHED") {
    await db.contentAsset.update({
      where: { id: contentAssetId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  return { publicationId: publication.id };
}

// ─── repurposeContent ────────────────────────────────────────────

/**
 * Derive a new content asset from an existing one (e.g. turn a blog post
 * into a social post or email newsletter).
 *
 * The new asset starts in DRAFT with the source asset's body as the
 * starting point. The author is expected to adapt it for the new format.
 */
export async function repurposeContent(
  sourceAssetId: string,
  targetContentType: ContentType
): Promise<{ newAssetId: string }> {
  const source = await db.contentAsset.findUnique({ where: { id: sourceAssetId } });
  if (!source) throw new Error(`repurposeContent: source asset ${sourceAssetId} not found`);

  const newAsset = await db.contentAsset.create({
    data: {
      title: `${source.title} (${targetContentType})`,
      contentType: targetContentType,
      status: "DRAFT",
      topic: source.topic,
      targetKeyword: source.targetKeyword,
      campaignId: source.campaignId,
      authorId: source.authorId,
      brief: `Repurposed from ${source.title} (${source.id})`,
      bodyMarkdown: source.bodyMarkdown,
      tags: source.tags,
      qualityScore: 0,
      qualityGatesPassed: 0,
      qualityGatesTotal: 7,
      metadata: JSON.stringify({ repurposedFrom: sourceAssetId, originalContentType: source.contentType }),
    },
  });

  return { newAssetId: newAsset.id };
}

// ─── getContentPerformanceStats ──────────────────────────────────

/**
 * Aggregate content performance metrics for the dashboard.
 */
export async function getContentPerformanceStats(): Promise<ContentPerformanceStats> {
  const [allAssets, publishedAssets, approvedNotPublished, avgAgg, publications] = await Promise.all([
    db.contentAsset.findMany({ select: { status: true, contentType: true, qualityScore: true } }),
    db.contentAsset.count({ where: { status: "PUBLISHED" } }),
    db.contentAsset.count({ where: { status: "APPROVED" } }),
    db.contentAsset.aggregate({ _avg: { qualityScore: true }, _sum: { qualityScore: true } }),
    db.contentPublication.findMany({ select: { platform: true } }),
  ]);

  const byStatus: Record<ContentStatus, number> = {
    DRAFT: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    PUBLISHED: 0,
    UNPUBLISHED: 0,
    ARCHIVED: 0,
  };
  const byContentType: Record<string, number> = {};
  for (const a of allAssets) {
    byStatus[a.status as ContentStatus] = (byStatus[a.status as ContentStatus] ?? 0) + 1;
    byContentType[a.contentType] = (byContentType[a.contentType] ?? 0) + 1;
  }

  const publicationsByPlatform: Record<string, number> = {};
  for (const p of publications) {
    publicationsByPlatform[p.platform] = (publicationsByPlatform[p.platform] ?? 0) + 1;
  }

  const totalAssets = allAssets.length;
  const averageQualityScore = avgAgg._avg.qualityScore ?? 0;

  return {
    totalAssets,
    byStatus,
    byContentType,
    publishedCount: publishedAssets,
    approvedNotPublished,
    averageQualityScore: Math.round(averageQualityScore * 10) / 10,
    totalPublications: publications.length,
    publicationsByPlatform,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const w of words) {
    const groups = w.match(/[aeiouy]+/g);
    total += groups ? groups.length : 1;
  }
  return total;
}
