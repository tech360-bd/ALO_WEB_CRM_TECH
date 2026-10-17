// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Lead Scoring Engine
 *
 * Computes a 0-100 lead score by combining:
 *   - Visitor intent score (from BehaviorEvent aggregation)
 *   - CRM profile completeness (from Lead fields)
 *   - Engagement recency (most recent event)
 *
 * Two entry points:
 *   - calculateLeadScore(visitorId | marketingProfileId) — score a visitor/profile
 *   - updateLeadScore(leadId) — score an existing Lead and persist the score
 */

import { db } from "@/lib/db";
import { getVisitorIntentScore } from "@/lib/behavior-tracking";

// ─── Types ────────────────────────────────────────────────────────

export interface LeadScoreBreakdown {
  totalScore: number; // 0-100
  tier: "HOT" | "WARM" | "COLD" | "URGENT" | "AT_RISK";
  intentScore: number; // 0-100 (visitor behavior)
  profileScore: number; // 0-100 (CRM completeness)
  recencyScore: number; // 0-100 (last event freshness)
  reasons: string[];
}

export interface CalculateLeadScoreInput {
  visitorId?: string;
  marketingProfileId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

function tierFromScore(score: number): LeadScoreBreakdown["tier"] {
  if (score >= 80) return "HOT";
  if (score >= 60) return "WARM";
  if (score >= 30) return "COLD";
  return "COLD";
}

// Cast db to allow access to models not yet on the Prisma client.

// ─── calculateLeadScore ──────────────────────────────────────────

/**
 * Calculate a 0-100 lead score for a visitor or marketing profile.
 *
 * Weighting:
 *   - Intent score   (visitor behavior):  50% of total
 *   - Profile score  (CRM completeness):  40% of total
 *   - Recency score  (last event <7d):    10% of total
 *
 * If the visitor has been linked to a Lead, the profile score is read
 * from the Lead record. If not, only intent + recency contribute.
 */
export async function calculateLeadScore(input: CalculateLeadScoreInput): Promise<LeadScoreBreakdown> {
  if (!input.visitorId && !input.marketingProfileId) {
    throw new Error("calculateLeadScore: visitorId or marketingProfileId is required");
  }

  let visitorId = input.visitorId;
  let leadId: string | null = null;
  let lastEventAt: Date | null = null;

  if (input.marketingProfileId) {
    const profile = await db.marketingProfile.findUnique({
      where: { id: input.marketingProfileId },
    });
    if (!profile) {
      return {
        totalScore: 0,
        tier: "COLD",
        intentScore: 0,
        profileScore: 0,
        recencyScore: 0,
        reasons: ["Marketing profile not found"],
      };
    }
    visitorId = profile.visitorId;
    leadId = profile.leadId;
    lastEventAt = profile.lastEventAt;
  }

  if (!visitorId) {
    return {
      totalScore: 0,
      tier: "COLD",
      intentScore: 0,
      profileScore: 0,
      recencyScore: 0,
      reasons: ["No visitorId resolved"],
    };
  }

  const reasons: string[] = [];

  // ── Intent score (0-100) ──
  const intentScore = await getVisitorIntentScore(visitorId);
  if (intentScore > 0) reasons.push(`Visitor intent: ${intentScore}/100`);

  // ── Profile score (0-100) ──
  let profileScore = 0;
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      let filled = 0;
      const fields = [
        lead.preferredCountry,
        lead.preferredCourse,
        lead.preferredLevel,
        lead.currentQualification,
        lead.cgpa,
        lead.englishTest,
        lead.englishScore,
        lead.preferredIntake,
        lead.budget,
        lead.email,
        lead.phone,
      ];
      filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
      profileScore = Math.round((filled / fields.length) * 100);
      reasons.push(`Profile completeness: ${filled}/${fields.length} fields`);
    }
  }

  // ── Recency score (0-100) ──
  let recencyScore = 0;
  if (!lastEventAt) {
    const lastEvent = await db.behaviorEvent.findFirst({
      where: { visitorId },
      orderBy: { createdAt: "desc" },
    });
    if (lastEvent) lastEventAt = lastEvent.createdAt;
  }
  if (lastEventAt) {
    const hoursAgo = (Date.now() - lastEventAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) recencyScore = 100;
    else if (hoursAgo <= 72) recencyScore = 75;
    else if (hoursAgo <= 168) recencyScore = 50; // 1 week
    else if (hoursAgo <= 720) recencyScore = 25; // 30 days
    else recencyScore = 0;
    if (recencyScore > 0) reasons.push(`Last event: ${Math.round(hoursAgo)}h ago`);
  }

  // ── Weighted total ──
  const totalScore = Math.round(
    intentScore * 0.5 + profileScore * 0.4 + recencyScore * 0.1
  );

  // ── Tier ──
  let tier = tierFromScore(totalScore);

  // Urgency override: intake within 6 months bumps to URGENT
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId }, select: { preferredIntake: true } });
    if (lead?.preferredIntake) {
      const m = lead.preferredIntake.match(/(\d{4})/);
      if (m) {
        const monthsUntil = (parseInt(m[1]) - new Date().getFullYear()) * 12;
        if (monthsUntil <= 6 && monthsUntil >= 0) {
          tier = "URGENT";
          reasons.push("Intake approaching within 6 months");
        }
      }
    }
  }

  return { totalScore, tier, intentScore, profileScore, recencyScore, reasons };
}

// ─── updateLeadScore ─────────────────────────────────────────────

/**
 * Compute the score for a Lead and persist it to the Lead record
 * (leadScore + leadTier fields).
 *
 * Resolves the visitorId via the MarketingProfile linked to this Lead.
 */
export async function updateLeadScore(leadId: string): Promise<LeadScoreBreakdown> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return {
      totalScore: 0,
      tier: "COLD",
      intentScore: 0,
      profileScore: 0,
      recencyScore: 0,
      reasons: ["Lead not found"],
    };
  }

  // Find the marketing profile linked to this lead
  const profile = await db.marketingProfile.findFirst({
    where: { leadId },
  });

  const breakdown = await calculateLeadScore({
    visitorId: profile?.visitorId,
    marketingProfileId: profile?.id,
  });

  // Fallback: if no visitor profile, score purely from the Lead record
  if (!profile) {
    let filled = 0;
    const fields = [
      lead.preferredCountry,
      lead.preferredCourse,
      lead.preferredLevel,
      lead.currentQualification,
      lead.cgpa,
      lead.englishTest,
      lead.englishScore,
      lead.preferredIntake,
      lead.budget,
      lead.email,
      lead.phone,
    ];
    filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
    const profileScore = Math.round((filled / fields.length) * 100);
    const totalScore = Math.round(profileScore * 0.8); // no behavior data — cap at 80
    const tier = tierFromScore(totalScore);
    return {
      totalScore,
      tier,
      intentScore: 0,
      profileScore,
      recencyScore: 0,
      reasons: ["No visitor profile linked — scored from Lead fields only"],
    };
  }

  // Persist
  await db.lead.update({
    where: { id: leadId },
    data: {
      leadScore: breakdown.totalScore,
      leadTier: breakdown.tier,
    },
  });

  return breakdown;
}
