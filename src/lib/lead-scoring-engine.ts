/**
 * Lead Scoring Engine
 *
 * Computes a composite lead score (0-100) from three signals:
 *   - Intent (50%): aggregated behavior events via getVisitorIntentScore
 *   - Engagement (30%): breadth of interactions + profile completeness
 *   - Completeness (20%): how much contact + study-preference data is known
 *
 * Tiers:
 *   COLD   < 30
 *   WARM   30-59
 *   HOT    60-79
 *   URGENT 80+
 *
 * The score is written back to the Lead (leadScore + leadTier).
 */

import { db } from "@/lib/db";
import { getVisitorIntentScore, getMarketingProfile } from "@/lib/behavior-tracking";

export type LeadTier = "COLD" | "WARM" | "HOT" | "URGENT";

export interface LeadScoreBreakdown {
  intent: number;          // 0-100 (raw intent normalized to 100)
  engagement: number;      // 0-100
  completeness: number;    // 0-100
  composite: number;       // 0-100
  tier: LeadTier;
  reasons: string[];
}

const INTENT_CAP = 100;       // raw intent points at which we consider intent "maxed"
const INTENT_WEIGHT = 0.5;
const ENGAGEMENT_WEIGHT = 0.3;
const COMPLETENESS_WEIGHT = 0.2;

export function tierFromScore(score: number): LeadTier {
  if (score >= 80) return "URGENT";
  if (score >= 60) return "HOT";
  if (score >= 30) return "WARM";
  return "COLD";
}

/**
 * Calculate the composite lead score for a visitor or marketing profile.
 *
 * Accepts either:
 *   - { visitorId }: looks up marketing profile + behavior events
 *   - { marketingProfileId }: alias for visitorId (the marketing profile is
 *     keyed by visitorId in the AuditLog-backed store)
 */
export async function calculateLeadScore(
  target: { visitorId?: string; marketingProfileId?: string }
): Promise<LeadScoreBreakdown & { visitorId?: string }> {
  const visitorId = target.visitorId || target.marketingProfileId;
  if (!visitorId) throw new Error("visitorId or marketingProfileId is required");

  const [intentAgg, profile] = await Promise.all([
    getVisitorIntentScore(visitorId),
    getMarketingProfile(visitorId),
  ]);

  const reasons: string[] = [];

  // ─── Intent (50%) ─────────────────────────────────────────────────────
  const intentRaw = intentAgg.total;
  const intentScore = Math.min(100, Math.round((intentRaw / INTENT_CAP) * 100));
  if (intentRaw > 0) reasons.push(`${intentRaw} intent points across ${intentAgg.eventCount} events`);
  if (intentAgg.byEventType.application_started) reasons.push("Application started (high intent)");
  if (intentAgg.byEventType.consultation_booked) reasons.push("Consultation booked (high intent)");

  // ─── Engagement (30%) ────────────────────────────────────────────────
  // Engagement = breadth of distinct event types + recency boost
  const distinctTypes = Object.keys(intentAgg.byEventType).length;
  const breadthScore = Math.min(60, distinctTypes * 10); // 6+ types = full 60
  let recencyScore = 0;
  if (intentAgg.lastEventAt) {
    const hoursSince = (Date.now() - intentAgg.lastEventAt.getTime()) / 36e5;
    if (hoursSince <= 24) recencyScore = 40;
    else if (hoursSince <= 72) recencyScore = 25;
    else if (hoursSince <= 168) recencyScore = 10;
  }
  const engagementScore = Math.min(100, breadthScore + recencyScore);
  if (distinctTypes > 0) reasons.push(`${distinctTypes} distinct event types`);
  if (recencyScore >= 25) reasons.push("Recent activity (within 72h)");

  // ─── Completeness (20%) ──────────────────────────────────────────────
  let completeness = 0;
  if (profile) {
    if (profile.email) completeness += 20;
    if (profile.phone) completeness += 20;
    if (profile.countryInterest) completeness += 15;
    if (profile.subjectInterest) completeness += 15;
    if (profile.courseInterest) completeness += 10;
    if (profile.universityInterest) completeness += 10;
    if (profile.studentId || profile.leadId) completeness += 10;
  }
  const completenessScore = Math.min(100, completeness);
  if (completenessScore >= 60) reasons.push("Strong profile completeness");
  else if (completenessScore >= 30) reasons.push("Partial profile completeness");

  // ─── Composite ───────────────────────────────────────────────────────
  const composite = Math.round(
    intentScore * INTENT_WEIGHT +
    engagementScore * ENGAGEMENT_WEIGHT +
    completenessScore * COMPLETENESS_WEIGHT
  );
  const tier = tierFromScore(composite);

  return {
    intent: intentScore,
    engagement: engagementScore,
    completeness: completenessScore,
    composite,
    tier,
    reasons,
    visitorId,
  };
}

/**
 * Update a Lead's leadScore + leadTier fields using the marketing profile
 * linked to the lead's visitorId (stored in AuditLog).
 *
 * If no visitor mapping exists, falls back to Lead-field-based scoring from
 * the existing scoreLead() implementation in crm-automation.ts.
 */
export async function updateLeadScore(leadId: string): Promise<LeadScoreBreakdown | null> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return null;

  // Try to resolve the visitorId from audit log MARKETING_PROFILE rows
  // where payload.leadId === leadId
  const profileRows = await db.auditLog.findMany({
    where: {
      action: "MARKETING_PROFILE",
      resource: "Visitor",
    },
    select: { resourceId: true, details: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  let visitorId: string | null = null;
  for (const row of profileRows) {
    try {
      const payload = JSON.parse(row.details || "{}");
      if (payload.leadId === leadId) {
        visitorId = row.resourceId;
        break;
      }
    } catch {
      continue;
    }
  }

  let breakdown: LeadScoreBreakdown;

  if (visitorId) {
    const result = await calculateLeadScore({ visitorId });
    breakdown = {
      intent: result.intent,
      engagement: result.engagement,
      completeness: result.completeness,
      composite: result.composite,
      tier: result.tier,
      reasons: result.reasons,
    };
  } else {
    // Fallback: derive a coarse score from Lead field completeness
    let s = 0;
    if (lead.preferredCountry) s += 15;
    if (lead.preferredCourse) s += 15;
    if (lead.preferredLevel) s += 10;
    if (lead.email && lead.phone) s += 25;
    else if (lead.phone) s += 15;
    if (lead.preferredIntake) s += 10;
    if (lead.budget) s += 10;
    if (lead.englishTest) s += 10;
    if (lead.currentQualification) s += 5;
    s = Math.min(100, s);

    breakdown = {
      intent: 0,
      engagement: 0,
      completeness: s,
      composite: s,
      tier: tierFromScore(s),
      reasons: ["No visitor behavior linked — fallback to Lead-field completeness score"],
    };
  }

  // Write back to Lead
  await db.lead.update({
    where: { id: leadId },
    data: {
      leadScore: breakdown.composite,
      leadTier: breakdown.tier,
    },
  });

  // Persist a score snapshot in audit log for auditability
  await db.auditLog.create({
    data: {
      action: "LEAD_SCORE_UPDATED",
      resource: "Lead",
      resourceId: leadId,
      details: JSON.stringify(breakdown),
    },
  }).catch(() => {});

  return breakdown;
}
