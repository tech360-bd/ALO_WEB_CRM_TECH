/**
 * Marketing Brain — personalized recommendations, attribution tracking,
 * and content performance reports.
 *
 * NOTE: This project has no MarketingProfile model. marketingProfileId is treated
 * as a Lead ID. marketingConsent is determined from the Lead's LeadOutreach row
 * (consentStatus). If OPTED_OUT → recommendations return [].
 *
 * All stats REAL from DB.
 */

import { db } from "@/lib/db";

export interface PersonalizedRecommendation {
  type: string; // COURSE | UNIVERSITY | SCHOLARSHIP | CONTENT | CTA
  title: string;
  reason: string;
  priority: number;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get personalized recommendations for a marketing profile (Lead ID).
 * Returns [] if marketingConsent=false (LeadOutreach.consentStatus === "OPTED_OUT").
 */
export async function getPersonalizedRecommendations(
  marketingProfileId: string
): Promise<PersonalizedRecommendation[]> {
  const lead = await db.lead.findUnique({
    where: { id: marketingProfileId },
    include: { leadOutreach: true },
  });

  if (!lead) return [];

  // Determine consent — if any outreach is OPTED_OUT, return []
  const optedOut = lead.leadOutreach.some((o) => o.consentStatus === "OPTED_OUT" || o.status === "OPTED_OUT");
  if (optedOut) return [];

  const recs: PersonalizedRecommendation[] = [];

  // 1. If preferredCountry, recommend top universities there
  if (lead.preferredCountry) {
    const countrySlug = lead.preferredCountry.toLowerCase();
    const universities = await db.universityPage.findMany({
      where: { countrySlug },
      take: 3,
      orderBy: { updatedAt: "desc" },
      select: { name: true, slug: true, city: true, countrySlug: true },
    });
    for (const u of universities) {
      recs.push({
        type: "UNIVERSITY",
        title: u.name,
        reason: `Matches lead's preferred destination: ${lead.preferredCountry}`,
        priority: 80,
        link: `/universities/${u.slug}`,
        metadata: { city: u.city, countrySlug: u.countrySlug },
      });
    }
  }

  // 2. If preferredCourse, recommend matching CoursePages
  if (lead.preferredCourse) {
    const courses = await db.coursePage.findMany({
      where: { name: { contains: lead.preferredCourse } },
      take: 3,
      select: { name: true, slug: true, level: true, tuition: true, universitySlug: true },
    });
    for (const c of courses) {
      recs.push({
        type: "COURSE",
        title: c.name,
        reason: `Matches lead's preferred course: ${lead.preferredCourse}`,
        priority: 85,
        link: `/courses/${c.slug}`,
        metadata: { level: c.level, tuition: c.tuition, universitySlug: c.universitySlug },
      });
    }
  }

  // 3. If preferredLevel, recommend matching scholarships
  if (lead.preferredLevel) {
    const scholarships = await db.scholarship.findMany({
      where: { studyLevel: { contains: lead.preferredLevel } },
      take: 3,
      select: { name: true, slug: true, amount: true, currency: true, deadline: true },
    });
    for (const s of scholarships) {
      recs.push({
        type: "SCHOLARSHIP",
        title: s.name,
        reason: `Matches lead's preferred level: ${lead.preferredLevel}`,
        priority: 70,
        link: `/scholarships/${s.slug}`,
        metadata: { amount: s.amount, currency: s.currency, deadline: s.deadline },
      });
    }
  }

  // 4. Content recommendations (top viewed ContentAssets)
  const topContent = await db.contentAsset.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { views: "desc" },
    take: 3,
    select: { title: true, slug: true, excerpt: true, contentType: true },
  });
  for (const c of topContent) {
    recs.push({
      type: "CONTENT",
      title: c.title,
      reason: "Trending content based on overall engagement",
      priority: 50,
      link: `/blog/${c.slug}`,
      metadata: { contentType: c.contentType, excerpt: c.excerpt },
    });
  }

  // Sort by priority
  recs.sort((a, b) => b.priority - a.priority);
  return recs;
}

export interface TrackAttributionParams {
  leadId?: string;
  studentId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  source?: string;
  channel?: string;
  touchpointType: string; // FIRST_TOUCH | LEAD_CREATE | APPLICATION | ENROLLMENT
  contentAssetId?: string;
  conversionValue?: number;
}

/**
 * Track a marketing attribution touchpoint.
 * Stores it as a FormSubmission (since no Attribution model exists) — using source + utm fields.
 */
export async function trackAttribution(params: TrackAttributionParams) {
  const sub = await db.formSubmission.create({
    data: {
      submissionCode: `ALO-ATTR-${Date.now().toString().slice(-6)}`,
      source: params.source || params.utmSource || "ATTRIBUTION",
      channel: params.channel || params.utmMedium || "MARKETING",
      utmSource: params.utmSource || null,
      utmMedium: params.utmMedium || null,
      utmCampaign: params.utmCampaign || null,
      rawPayload: JSON.stringify({
        touchpointType: params.touchpointType,
        leadId: params.leadId,
        studentId: params.studentId,
        contentAssetId: params.contentAssetId,
        conversionValue: params.conversionValue,
        trackedAt: new Date().toISOString(),
      }),
      normalizedData: JSON.stringify({
        touchpointType: params.touchpointType,
        conversionValue: params.conversionValue || 0,
      }),
      crmId: params.leadId || params.studentId || null,
      crmType: params.leadId ? "LEAD" : params.studentId ? "STUDENT" : "ATTRIBUTION",
      processingStatus: "PROCESSED",
    },
  });

  // Also emit an event for the event bus
  try {
    const { emitEvent } = await import("@/lib/event-bus");
    await emitEvent({
      eventType: `ATTRIBUTION_${params.touchpointType}`,
      aggregateType: params.leadId ? "Lead" : "Student",
      aggregateId: params.leadId || params.studentId,
      leadId: params.leadId,
      studentId: params.studentId,
      actorType: "SYSTEM",
      payload: {
        utmSource: params.utmSource,
        utmMedium: params.utmMedium,
        utmCampaign: params.utmCampaign,
        contentAssetId: params.contentAssetId,
        conversionValue: params.conversionValue,
      },
    });
  } catch {
    // best-effort
  }

  return sub;
}

/**
 * Compute REAL attribution stats — group leads by utmSource / source.
 */
export async function getAttributionStats() {
  const totalLeads = await db.lead.count();

  const byUtmSource = await db.lead.groupBy({
    by: ["utmSource"],
    _count: true,
    orderBy: { _count: { utmSource: "desc" } },
    take: 10,
  });

  const byUtmMedium = await db.lead.groupBy({
    by: ["utmMedium"],
    _count: true,
    orderBy: { _count: { utmMedium: "desc" } },
    take: 10,
  });

  const byUtmCampaign = await db.lead.groupBy({
    by: ["utmCampaign"],
    _count: true,
    orderBy: { _count: { utmCampaign: "desc" } },
    take: 10,
  });

  const bySource = await db.lead.groupBy({
    by: ["source"],
    _count: true,
    orderBy: { _count: { source: "desc" } },
    take: 10,
  });

  // Conversion: leads with status CONVERTED
  const converted = await db.lead.count({ where: { status: "CONVERTED" } });

  // Conversion rate by source
  const sourceConversion: Array<{ source: string; total: number; converted: number; rate: number }> = [];
  for (const s of bySource) {
    const sourceName = s.source || "UNKNOWN";
    const convertedCount = await db.lead.count({
      where: { source: s.source, status: "CONVERTED" },
    });
    sourceConversion.push({
      source: sourceName,
      total: s._count,
      converted: convertedCount,
      rate: s._count > 0 ? Math.round((convertedCount / s._count) * 100) : 0,
    });
  }

  return {
    totalLeads,
    converted,
    conversionRate: totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0,
    byUtmSource: byUtmSource.map((u: any) => ({
      utmSource: u.utmSource || "DIRECT",
      count: u._count,
    })),
    byUtmMedium: byUtmMedium.map((u: any) => ({
      utmMedium: u.utmMedium || "UNKNOWN",
      count: u._count,
    })),
    byUtmCampaign: byUtmCampaign.map((u: any) => ({
      utmCampaign: u.utmCampaign || "NONE",
      count: u._count,
    })),
    bySource: bySource.map((s: any) => ({
      source: s.source || "UNKNOWN",
      count: s._count,
    })),
    sourceConversion,
  };
}

/**
 * Get content performance report — REAL aggregation of ContentAsset metrics.
 */
export async function getContentPerformanceReport() {
  const total = await db.contentAsset.count();
  const published = await db.contentAsset.count({ where: { status: "PUBLISHED" } });

  const totals = await db.contentAsset.aggregate({
    _sum: {
      impressions: true,
      views: true,
      engagement: true,
      clicks: true,
      leads: true,
      applications: true,
      enrollments: true,
    },
  });

  const byStatus = await db.contentAsset.groupBy({
    by: ["status"],
    _count: true,
  });

  const byContentType = await db.contentAsset.groupBy({
    by: ["contentType"],
    _count: true,
    orderBy: { _count: { contentType: "desc" } },
  });

  // Top performing content (by views)
  const topByViews = await db.contentAsset.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { views: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      leads: true,
      enrollments: true,
      contentType: true,
    },
  });

  // Top by leads
  const topByLeads = await db.contentAsset.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { leads: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      leads: true,
      enrollments: true,
      contentType: true,
    },
  });

  return {
    total,
    published,
    aggregates: {
      impressions: totals._sum.impressions || 0,
      views: totals._sum.views || 0,
      engagement: totals._sum.engagement || 0,
      clicks: totals._sum.clicks || 0,
      leads: totals._sum.leads || 0,
      applications: totals._sum.applications || 0,
      enrollments: totals._sum.enrollments || 0,
    },
    conversionRates: {
      viewToLead: (totals._sum.views || 0) > 0
        ? Math.round(((totals._sum.leads || 0) / (totals._sum.views || 0)) * 10000) / 100
        : 0,
      leadToEnrollment: (totals._sum.leads || 0) > 0
        ? Math.round(((totals._sum.enrollments || 0) / (totals._sum.leads || 0)) * 10000) / 100
        : 0,
      clickToLead: (totals._sum.clicks || 0) > 0
        ? Math.round(((totals._sum.leads || 0) / (totals._sum.clicks || 0)) * 10000) / 100
        : 0,
    },
    byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count.status })),
    byContentType: byContentType.map((c: any) => ({
      contentType: c.contentType,
      count: c._count.contentType,
    })),
    topByViews,
    topByLeads,
  };
}
