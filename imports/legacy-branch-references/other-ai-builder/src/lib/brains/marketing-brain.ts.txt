// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Marketing Brain
 *
 * Personalization + attribution engine.
 *
 * Rules:
 *   - getPersonalizedRecommendations returns [] if the visitor has NOT
 *     granted marketing consent. NEVER bypass this consent gate.
 *   - trackAttribution records how a lead/customer was acquired (first-touch,
 *     last-touch, multi-touch) so we can credit marketing channels correctly.
 *
 * Functions:
 *   1. getPersonalizedRecommendations(marketingProfileId) — gated by consent
 *   2. trackAttribution(params)
 *   3. getAttributionStats()
 *   4. getContentPerformanceReport()
 */

import { db } from "@/lib/db";
import { hasConsent } from "@/lib/marketing-consent";

// ─── Types ────────────────────────────────────────────────────────

export interface PersonalizedRecommendation {
  type: "CONTENT" | "COURSE" | "UNIVERSITY" | "SCHOLARSHIP" | "EVENT" | "ARTICLE";
  title: string;
  url: string;
  reason: string;
  score: number; // 0-100, higher = more relevant
}

export interface TrackAttributionParams {
  visitorId?: string;
  leadId?: string;
  studentId?: string;
  channel: string; // ORGANIC_SEARCH, DIRECT, REFERRAL, SOCIAL, EMAIL, PAID, PARTNER
  campaign?: string;
  source?: string;
  medium?: string;
  touchType: "FIRST_TOUCH" | "LAST_TOUCH" | "ASSIST";
  metadata?: Record<string, unknown>;
}

export interface AttributionRecord {
  id: string;
  visitorId: string | null;
  leadId: string | null;
  studentId: string | null;
  channel: string;
  campaign: string | null;
  source: string | null;
  medium: string | null;
  touchType: string;
  touchedAt: Date;
  metadata: string;
  createdAt: Date;
}

export interface AttributionStats {
  totalTouches: number;
  byChannel: Record<string, number>;
  byTouchType: Record<string, number>;
  firstTouchChannel: Record<string, number>; // channel distribution of FIRST_TOUCH
  lastTouchChannel: Record<string, number>;
  uniqueVisitors: number;
  uniqueLeads: number;
  uniqueStudents: number;
}

export interface ContentPerformanceReport {
  totalContentAssets: number;
  publishedCount: number;
  totalViews: number;
  totalLeadsAttributed: number;
  topPerformingContent: Array<{
    contentAssetId: string;
    title: string;
    views: number;
    leadsAttributed: number;
  }>;
  byPlatform: Record<string, { publications: number; views: number }>;
}

// Cast db to allow access to models not on the standard client.

// ─── getPersonalizedRecommendations ──────────────────────────────

/**
 * Generate personalized content/course recommendations for a visitor.
 *
 * HARD RULE: returns [] if the visitor has NOT granted marketing consent.
 * This is enforced via the marketing-consent module. No bypass is allowed.
 *
 * If consent is granted, recommendations are computed from:
 *   - The visitor's behavior events (which pages/courses they viewed)
 *   - Their marketing profile's intent score
 *   - Their linked student/lead record (if any)
 */
export async function getPersonalizedRecommendations(
  marketingProfileId: string
): Promise<PersonalizedRecommendation[]> {
  if (!marketingProfileId) return [];

  const profile = await db.marketingProfile?.findUnique({ where: { id: marketingProfileId } });
  if (!profile) return [];

  // ─── CONSENT GATE ───
  const consentGranted = await hasConsent(
    { visitorId: profile.visitorId, email: profile.email ?? undefined },
    "EMAIL" // any marketing channel
  ).catch(() => false);

  if (!consentGranted) {
    // HARD RULE: return empty array if no consent
    return [];
  }

  // ─── Build recommendations ───
  const recommendations: PersonalizedRecommendation[] = [];

  // 1. From behavior events — recommend related courses/universities
  try {
    const events = await db.behaviorEvent?.findMany({
      where: { visitorId: profile.visitorId },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    if (events) {
      const courseViews = events.filter((e) => e.eventType === "COURSE_VIEW");
      const uniViews = events.filter((e) => e.eventType === "UNIVERSITY_VIEW");

      for (const v of courseViews.slice(0, 3)) {
        const url = v.pageUrl ?? "/courses";
        recommendations.push({
          type: "COURSE",
          title: "Continue exploring this course",
          url,
          reason: "You recently viewed this course",
          score: 80,
        });
      }
      for (const v of uniViews.slice(0, 2)) {
        const url = v.pageUrl ?? "/universities";
        recommendations.push({
          type: "UNIVERSITY",
          title: "Learn more about this university",
          url,
          reason: "You recently viewed this university",
          score: 75,
        });
      }
    }
  } catch { /* behavior events not available */ }

  // 2. From linked lead — recommend based on preferred country/course
  if (profile.leadId) {
    const lead = await db.lead.findUnique({ where: { id: profile.leadId } });
    if (lead) {
      if (lead.preferredCountry) {
        recommendations.push({
          type: "CONTENT",
          title: `Guide to studying in ${lead.preferredCountry}`,
          url: `/countries/${lead.preferredCountry.toLowerCase()}`,
          reason: "Matches your preferred destination",
          score: 85,
        });
      }
      if (lead.preferredCourse) {
        recommendations.push({
          type: "COURSE",
          title: `Top ${lead.preferredCourse} programs`,
          url: `/courses?area=${encodeURIComponent(lead.preferredCourse)}`,
          reason: "Matches your preferred course",
          score: 80,
        });
      }
    }
  }

  // 3. General high-intent recommendation
  if (profile.intentScore >= 50) {
    recommendations.push({
      type: "ARTICLE",
      title: "Book a free counseling session",
      url: "/contact",
      reason: "You're actively researching — talk to a counselor",
      score: 90,
    });
  }

  // Sort by score and return top 5
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ─── trackAttribution ────────────────────────────────────────────

/**
 * Record an attribution touchpoint.
 *
 * The caller is responsible for deciding whether this is FIRST_TOUCH,
 * LAST_TOUCH, or ASSIST. Typically:
 *   - FIRST_TOUCH: the first time a visitor/lead is seen
 *   - LAST_TOUCH: the most recent touch before conversion
 *   - ASSIST: any touchpoint in between
 */
export async function trackAttribution(params: TrackAttributionParams): Promise<{ attributionId: string }> {
  if (!params.visitorId && !params.leadId && !params.studentId) {
    throw new Error("trackAttribution: at least one of visitorId, leadId, studentId is required");
  }
  if (!params.channel) {
    throw new Error("trackAttribution: channel is required");
  }
  if (!["FIRST_TOUCH", "LAST_TOUCH", "ASSIST"].includes(params.touchType)) {
    throw new Error(`trackAttribution: invalid touchType ${params.touchType}`);
  }

  const record = await db.attribution.create({
    data: {
      visitorId: params.visitorId ?? null,
      leadId: params.leadId ?? null,
      studentId: params.studentId ?? null,
      channel: params.channel,
      campaign: params.campaign ?? null,
      source: params.source ?? null,
      medium: params.medium ?? null,
      touchType: params.touchType,
      touchedAt: new Date(),
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });

  return { attributionId: record.id };
}

// ─── getAttributionStats ─────────────────────────────────────────

/**
 * Aggregate attribution metrics for the dashboard.
 */
export async function getAttributionStats(): Promise<AttributionStats> {
  const all = await db.attribution.findMany({
    select: { channel: true, touchType: true, visitorId: true, leadId: true, studentId: true },
  });

  const byChannel: Record<string, number> = {};
  const byTouchType: Record<string, number> = {};
  const firstTouchChannel: Record<string, number> = {};
  const lastTouchChannel: Record<string, number> = {};

  const visitorSet = new Set<string>();
  const leadSet = new Set<string>();
  const studentSet = new Set<string>();

  for (const a of all) {
    byChannel[a.channel] = (byChannel[a.channel] ?? 0) + 1;
    byTouchType[a.touchType] = (byTouchType[a.touchType] ?? 0) + 1;
    if (a.touchType === "FIRST_TOUCH") firstTouchChannel[a.channel] = (firstTouchChannel[a.channel] ?? 0) + 1;
    if (a.touchType === "LAST_TOUCH") lastTouchChannel[a.channel] = (lastTouchChannel[a.channel] ?? 0) + 1;
    if (a.visitorId) visitorSet.add(a.visitorId);
    if (a.leadId) leadSet.add(a.leadId);
    if (a.studentId) studentSet.add(a.studentId);
  }

  return {
    totalTouches: all.length,
    byChannel,
    byTouchType,
    firstTouchChannel,
    lastTouchChannel,
    uniqueVisitors: visitorSet.size,
    uniqueLeads: leadSet.size,
    uniqueStudents: studentSet.size,
  };
}

// ─── getContentPerformanceReport ─────────────────────────────────

/**
 * Aggregate content performance metrics: views, leads attributed,
 * top performing assets, and breakdown by publication platform.
 */
export async function getContentPerformanceReport(): Promise<ContentPerformanceReport> {
  const [assets, publications, attributionTouches] = await Promise.all([
    db.contentAsset?.findMany({ where: {}, select: { id: true, title: true, status: true, viewsCount: true } }) ?? [],
    db.contentPublication?.findMany({ where: {}, select: { platform: true, contentAssetId: true, publishedUrl: true } }) ?? [],
    db.attribution.findMany({ where: {}, select: { leadId: true, metadata: true } }),
  ]);

  const totalViews = assets.reduce((sum, a) => sum + (a.viewsCount ?? 0), 0);

  // Map content asset → attributed leads (via attribution.metadata.contentAssetId)
  const leadsByAsset = new Map<string, number>();
  for (const t of attributionTouches) {
    try {
      const meta = JSON.parse(t.metadata ?? "{}");
      if (meta.contentAssetId) {
        leadsByAsset.set(meta.contentAssetId, (leadsByAsset.get(meta.contentAssetId) ?? 0) + 1);
      }
    } catch { /* ignore */ }
  }

  const topPerformingContent = assets
    .map((a) => ({
      contentAssetId: a.id,
      title: a.title,
      views: a.viewsCount ?? 0,
      leadsAttributed: leadsByAsset.get(a.id) ?? 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const byPlatform: Record<string, { publications: number; views: number }> = {};
  for (const p of publications) {
    const key = p.platform;
    if (!byPlatform[key]) byPlatform[key] = { publications: 0, views: 0 };
    byPlatform[key].publications++;
    // We don't have per-publication view counts; estimate via parent asset views
    const parent = assets.find((a) => a.id === p.contentAssetId);
    if (parent) byPlatform[key].views += parent.viewsCount ?? 0;
  }

  return {
    totalContentAssets: assets.length,
    publishedCount: assets.filter((a) => a.status === "PUBLISHED").length,
    totalViews,
    totalLeadsAttributed: Array.from(leadsByAsset.values()).reduce((a, b) => a + b, 0),
    topPerformingContent,
    byPlatform,
  };
}
