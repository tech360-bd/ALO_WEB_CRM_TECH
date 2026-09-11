// ============================================================
// CONTENT ENGINE
// Manages content assets through DRAFT → IN_REVIEW → APPROVED → PUBLISHED lifecycle.
// Enforces 7 quality gates before approval. Tracks content performance metrics.
// ============================================================

import { db } from "@/lib/db";

// ─── Helpers ───

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || `asset-${Date.now()}`;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await db.contentAsset.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
    if (counter > 999) return `${baseSlug}-${Date.now()}`; // safety net
  }
}

// ─── Create Content Asset ───

export interface CreateContentAssetParams {
  title: string;
  contentType: string; // BLOG_POST | LANDING_PAGE | EMAIL_TEMPLATE | SOCIAL_POST | ...
  body?: string;
  excerpt?: string | null;
  topic?: string | null;
  source?: string | null;
  sourceQuery?: string | null;
  authorAgentId?: string | null;
  tags?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  targetKeywords?: string | null;
  canonicalUrl?: string | null;
}

export async function createContentAsset(params: CreateContentAssetParams) {
  if (!params.title || !params.contentType) {
    throw new Error("title and contentType are required");
  }

  const slug = await ensureUniqueSlug(slugify(params.title));

  const asset = await db.contentAsset.create({
    data: {
      title: params.title,
      slug,
      contentType: params.contentType,
      body: params.body ?? "",
      excerpt: params.excerpt ?? null,
      topic: params.topic ?? null,
      source: params.source ?? null,
      sourceQuery: params.sourceQuery ?? null,
      authorAgentId: params.authorAgentId ?? null,
      tags: params.tags ? JSON.stringify(params.tags) : "[]",
      metaTitle: params.metaTitle ?? null,
      metaDescription: params.metaDescription ?? null,
      targetKeywords: params.targetKeywords ?? null,
      canonicalUrl: params.canonicalUrl ?? null,
      status: "DRAFT",
      qualityScore: 0,
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "ContentAsset",
      resourceId: asset.id,
      details: JSON.stringify({ title: params.title, contentType: params.contentType }),
    },
  });

  return asset;
}

// ─── Quality Gates ───

export interface QualityGateResult {
  factChecked: boolean;
  sourceChecked: boolean;
  brandChecked: boolean;
  seoChecked: boolean;
  duplicateChecked: boolean;
  legalChecked: boolean;
  privacyChecked: boolean;
  qualityScore: number;
  passed: boolean;
  failedGates: string[];
}

/**
 * Runs all 7 quality gates against a content asset.
 * Each gate is a heuristic/rule-based check (no AI fabrication).
 * Computes a 0-100 quality score.
 */
export async function runQualityGates(contentAssetId: string): Promise<QualityGateResult> {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error("ContentAsset not found");

  const body = asset.body || "";
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  // 1. Fact-checked: requires source citation OR explicit factChecked flag
  const factChecked =
    !!asset.source ||
    /\b(source|according to|based on|report|study)\b/i.test(body) ||
    /\bhttps?:\/\//i.test(body);

  // 2. Source-checked: source URL or evidence citation present
  const sourceChecked = !!asset.source || /https?:\/\//i.test(body);

  // 3. Brand-checked: brand keywords present (ALO Education)
  const brandChecked = /ALO\s+Education|aloeducation/i.test(body) || wordCount < 50;

  // 4. SEO-checked: metaTitle + metaDescription + targetKeywords present
  const seoChecked =
    !!asset.metaTitle &&
    !!asset.metaDescription &&
    !!asset.targetKeywords &&
    asset.metaTitle.length <= 60 &&
    asset.metaDescription.length <= 160;

  // 5. Duplicate-checked: no other asset with same slug/title
  const duplicate = await db.contentAsset.findFirst({
    where: {
      id: { not: contentAssetId },
      OR: [{ title: asset.title }, { slug: asset.slug }],
    },
    select: { id: true },
  });
  const duplicateChecked = !duplicate;

  // 6. Legal-checked: no prohibited claims (guaranteed visa, 100% scholarship)
  const legalChecked = !/guaranteed\s+visa|100%\s+scholarship|guaranteed\s+admission/i.test(body);

  // 7. Privacy-checked: no PII patterns (emails, phone numbers in body)
  const privacyChecked =
    !/\b[\w.-]+@[\w.-]+\.\w{2,}\b/.test(body) && !/\b\d{10,13}\b/.test(body);

  const passedGates = [
    factChecked,
    sourceChecked,
    brandChecked,
    seoChecked,
    duplicateChecked,
    legalChecked,
    privacyChecked,
  ];
  const passedCount = passedGates.filter(Boolean).length;
  const qualityScore = Math.round((passedCount / 7) * 100);

  const failedGates: string[] = [];
  if (!factChecked) failedGates.push("factChecked");
  if (!sourceChecked) failedGates.push("sourceChecked");
  if (!brandChecked) failedGates.push("brandChecked");
  if (!seoChecked) failedGates.push("seoChecked");
  if (!duplicateChecked) failedGates.push("duplicateChecked");
  if (!legalChecked) failedGates.push("legalChecked");
  if (!privacyChecked) failedGates.push("privacyChecked");

  const passed = failedGates.length === 0;

  const updated = await db.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      factChecked,
      sourceChecked,
      brandChecked,
      seoChecked,
      duplicateChecked,
      legalChecked,
      privacyChecked,
      qualityScore,
      status: asset.status === "DRAFT" ? "IN_REVIEW" : asset.status,
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "ContentAsset",
      resourceId: contentAssetId,
      details: JSON.stringify({ qualityScore, passed, failedGates }),
    },
  });

  return {
    factChecked,
    sourceChecked,
    brandChecked,
    seoChecked,
    duplicateChecked,
    legalChecked,
    privacyChecked,
    qualityScore,
    passed,
    failedGates,
    ...({ updated } as any),
  } as QualityGateResult & { updated: typeof updated };
}

// ─── Approve ───

export async function approveContent(contentAssetId: string, approverId: string) {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error("ContentAsset not found");

  // Re-run gates to ensure current state passes
  const gates = await runQualityGates(contentAssetId);
  if (!gates.passed) {
    return {
      approved: false,
      asset,
      gates,
      message: `Approval refused — ${gates.failedGates.length} gate(s) failed: ${gates.failedGates.join(", ")}`,
    };
  }

  const updated = await db.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      status: "APPROVED",
      humanApproverId: approverId,
    },
  });

  await db.auditLog.create({
    data: {
      userId: approverId,
      action: "AI_ACTION",
      resource: "ContentAsset",
      resourceId: contentAssetId,
      details: JSON.stringify({ action: "APPROVED", qualityScore: gates.qualityScore }),
    },
  });

  return { approved: true, asset: updated, gates, message: "Content approved." };
}

// ─── Publish ───

export async function publishContent(
  contentAssetId: string,
  platform: string,
  publishedUrl?: string | null
) {
  const asset = await db.contentAsset.findUnique({ where: { id: contentAssetId } });
  if (!asset) throw new Error("ContentAsset not found");

  if (asset.status !== "APPROVED") {
    return {
      published: false,
      message: `Cannot publish — asset is in ${asset.status} status, must be APPROVED first.`,
    };
  }

  const publication = await db.contentPublication.create({
    data: {
      contentAssetId,
      platform,
      publishedUrl: publishedUrl ?? null,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const updatedAsset = await db.contentAsset.update({
    where: { id: contentAssetId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedUrl: publishedUrl ?? asset.publishedUrl ?? null,
    },
  });

  await db.auditLog.create({
    data: {
      action: "PUBLIC_PUBLISH",
      resource: "ContentAsset",
      resourceId: contentAssetId,
      details: JSON.stringify({ platform, publishedUrl: publishedUrl || null }),
    },
  });

  return { published: true, publication, asset: updatedAsset };
}

// ─── Repurpose ───

export async function repurposeContent(
  sourceAssetId: string,
  targetContentType: string
) {
  const source = await db.contentAsset.findUnique({ where: { id: sourceAssetId } });
  if (!source) throw new Error("Source ContentAsset not found");

  const newTitle = `${source.title} (${targetContentType})`;
  const slug = await ensureUniqueSlug(slugify(newTitle));

  const repurposed = await db.contentAsset.create({
    data: {
      title: newTitle,
      slug,
      contentType: targetContentType,
      body: source.body,
      excerpt: source.excerpt,
      topic: source.topic,
      source: source.source,
      sourceQuery: source.sourceQuery,
      authorAgentId: source.authorAgentId,
      tags: source.tags,
      metaTitle: source.metaTitle,
      metaDescription: source.metaDescription,
      targetKeywords: source.targetKeywords,
      status: "DRAFT",
      qualityScore: 0,
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "ContentAsset",
      resourceId: repurposed.id,
      details: JSON.stringify({
        action: "REPURPOSED",
        sourceAssetId,
        targetContentType,
      }),
    },
  });

  return repurposed;
}

// ─── Performance Stats ───

export async function getContentPerformanceStats() {
  const [totalAssets, byStatus, byContentType, topPerformers, totals] = await Promise.all([
    db.contentAsset.count(),
    db.contentAsset.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.contentAsset.groupBy({
      by: ["contentType"],
      _count: { _all: true },
    }),
    db.contentAsset.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        contentType: true,
        impressions: true,
        views: true,
        leads: true,
        applications: true,
        enrollments: true,
      },
    }),
    db.contentAsset.aggregate({
      _sum: {
        impressions: true,
        views: true,
        leads: true,
        applications: true,
        enrollments: true,
      },
    }),
  ]);

  return {
    totalAssets,
    byStatus,
    byContentType,
    topPerformers,
    totals: totals._sum,
  };
}
