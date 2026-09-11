/**
 * Behavior Tracking & Intent Scoring
 *
 * Tracks visitor behavior events on the public website (course finder, scholarship
 * views, applications started, consultations booked, etc.) and computes intent
 * points that feed into the lead-scoring engine.
 *
 * Storage note:
 *   The behavior data is persisted via the existing `AuditLog` table (the schema
 *   does not yet have a dedicated BehaviorEvent model). Each event is stored as:
 *     action:     "BEHAVIOR_EVENT"
 *     resource:   "Visitor"
 *     resourceId: visitorId
 *     userId:     studentId (when known)
 *     details:    JSON payload { eventType, eventData, pageUrl, referrer,
 *                                utmSource, utmMedium, utmCampaign, intentPoints,
 *                                sessionId, leadId }
 *   This keeps the public API stable so a future schema migration to a real
 *   BehaviorEvent table can swap the storage layer without touching callers.
 */

import { db } from "@/lib/db";

// ─── Intent Weights ─────────────────────────────────────────────────────────
// Tunable weights per behavior event. Higher weight = stronger purchase intent.
export const INTENT_WEIGHTS: Record<string, number> = {
  course_finder_opened: 2,
  search_started: 3,
  search_completed: 5,
  course_viewed: 8,
  university_viewed: 5,
  scholarship_viewed: 10,
  course_compared: 12,
  course_saved: 15,
  eligibility_checked: 15,
  english_requirement_checked: 10,
  fee_checked: 10,
  intake_checked: 8,
  application_started: 30,
  application_abandoned: 20,
  consultation_started: 40,
  consultation_booked: 40,
  test_started: 15,
  test_completed: 20,
  repeated_high_intent_visit: 10,
};

export function getIntentWeight(eventType: string): number {
  return INTENT_WEIGHTS[eventType] ?? 1;
}

// ─── Track Behavior Event ───────────────────────────────────────────────────
export interface TrackBehaviorEventParams {
  visitorId: string;
  eventType: string;
  studentId?: string;
  leadId?: string;
  sessionId?: string;
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  eventData?: Record<string, unknown>;
}

export interface TrackedEvent {
  id: string;
  visitorId: string;
  eventType: string;
  intentPoints: number;
  createdAt: Date;
}

export async function trackBehaviorEvent(
  params: TrackBehaviorEventParams
): Promise<TrackedEvent> {
  if (!params.visitorId || !params.eventType) {
    throw new Error("visitorId and eventType are required");
  }

  const intentPoints = getIntentWeight(params.eventType);

  const log = await db.auditLog.create({
    data: {
      action: "BEHAVIOR_EVENT",
      resource: "Visitor",
      resourceId: params.visitorId,
      userId: params.studentId || null,
      details: JSON.stringify({
        eventType: params.eventType,
        eventData: params.eventData || {},
        pageUrl: params.pageUrl || null,
        referrer: params.referrer || null,
        utmSource: params.utmSource || null,
        utmMedium: params.utmMedium || null,
        utmCampaign: params.utmCampaign || null,
        intentPoints,
        sessionId: params.sessionId || null,
        leadId: params.leadId || null,
      }),
    },
  });

  // Best-effort: also store the page view into existing `CourseView` table when applicable
  // (kept lightweight — failure here does not affect tracking)
  if (params.eventType === "course_viewed" && params.eventData?.courseSlug) {
    try {
      await db.courseView.create({
        data: {
          userId: params.studentId || null,
          role: params.studentId ? "STUDENT" : "VISITOR",
          courseSlug: String(params.eventData.courseSlug),
        },
      });
    } catch {
      /* ignore */
    }
  }

  return {
    id: log.id,
    visitorId: params.visitorId,
    eventType: params.eventType,
    intentPoints,
    createdAt: log.createdAt,
  };
}

// ─── Aggregate Visitor Intent Score ─────────────────────────────────────────
export async function getVisitorIntentScore(visitorId: string): Promise<{
  total: number;
  eventCount: number;
  byEventType: Record<string, { count: number; points: number }>;
  lastEventAt: Date | null;
}> {
  const events = await db.auditLog.findMany({
    where: {
      action: "BEHAVIOR_EVENT",
      resourceId: visitorId,
    },
    select: { details: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  let total = 0;
  let lastEventAt: Date | null = null;
  const byEventType: Record<string, { count: number; points: number }> = {};

  for (const e of events) {
    let payload: { eventType?: string; intentPoints?: number } = {};
    try {
      payload = JSON.parse(e.details || "{}");
    } catch {
      payload = {};
    }
    const eventType = payload.eventType || "unknown";
    const points = Number(payload.intentPoints || 0);
    total += points;
    if (!byEventType[eventType]) byEventType[eventType] = { count: 0, points: 0 };
    byEventType[eventType].count += 1;
    byEventType[eventType].points += points;
    if (!lastEventAt) lastEventAt = e.createdAt;
  }

  return { total, eventCount: events.length, byEventType, lastEventAt };
}

// ─── Marketing Profile (visitor → identity) ─────────────────────────────────
// Stored as an AuditLog row with action="MARKETING_PROFILE", resourceId=visitorId.
// A single upserted row per visitor carries the latest snapshot.

export interface MarketingProfile {
  visitorId: string;
  studentId?: string;
  leadId?: string;
  email?: string;
  phone?: string;
  countryInterest?: string;
  subjectInterest?: string;
  courseInterest?: string;
  universityInterest?: string;
  intentScore: number;
  engagementScore: number;
  leadScore: number;
  marketingConsent: boolean;
  consentAt?: Date;
  consentSource?: string;
  consentVersion?: string;
  consentMethod?: string;
  revokedAt?: Date;
  source?: string;
  campaign?: string;
  medium?: string;
  landingPage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MarketingProfileRow {
  visitorId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

async function fetchProfileRow(visitorId: string): Promise<MarketingProfileRow | null> {
  const row = await db.auditLog.findFirst({
    where: { action: "MARKETING_PROFILE", resourceId: visitorId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.details || "{}");
  } catch {
    payload = {};
  }
  return { visitorId, payload, createdAt: row.createdAt, updatedAt: row.createdAt };
}

export async function getMarketingProfile(visitorId: string): Promise<MarketingProfile | null> {
  const row = await fetchProfileRow(visitorId);
  if (!row) return null;

  const intent = await getVisitorIntentScore(visitorId);

  return {
    visitorId,
    studentId: (row.payload.studentId as string) || undefined,
    leadId: (row.payload.leadId as string) || undefined,
    email: (row.payload.email as string) || undefined,
    phone: (row.payload.phone as string) || undefined,
    countryInterest: (row.payload.countryInterest as string) || undefined,
    subjectInterest: (row.payload.subjectInterest as string) || undefined,
    courseInterest: (row.payload.courseInterest as string) || undefined,
    universityInterest: (row.payload.universityInterest as string) || undefined,
    intentScore: intent.total,
    engagementScore: Number(row.payload.engagementScore || 0),
    leadScore: Number(row.payload.leadScore || 0),
    marketingConsent: Boolean(row.payload.marketingConsent || false),
    consentAt: row.payload.consentAt ? new Date(row.payload.consentAt as string) : undefined,
    consentSource: (row.payload.consentSource as string) || undefined,
    consentVersion: (row.payload.consentVersion as string) || undefined,
    consentMethod: (row.payload.consentMethod as string) || undefined,
    revokedAt: row.payload.revokedAt ? new Date(row.payload.revokedAt as string) : undefined,
    source: (row.payload.source as string) || undefined,
    campaign: (row.payload.campaign as string) || undefined,
    medium: (row.payload.medium as string) || undefined,
    landingPage: (row.payload.landingPage as string) || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function upsertMarketingProfile(
  visitorId: string,
  updates: Partial<Omit<MarketingProfile, "visitorId" | "createdAt" | "updatedAt">> & {
    [key: string]: unknown;
  }
): Promise<MarketingProfile> {
  const existing = await fetchProfileRow(visitorId);
  const merged: Record<string, unknown> = {
    ...(existing?.payload || {}),
    ...updates,
    visitorId,
    updatedAt: new Date().toISOString(),
  };

  // Recompute intent + engagement snapshot
  const intent = await getVisitorIntentScore(visitorId);
  merged.intentScore = intent.total;
  merged.engagementScore = Number(merged.engagementScore || intent.eventCount);

  // Persist as a new AuditLog row (latest snapshot wins; history is preserved)
  await db.auditLog.create({
    data: {
      action: "MARKETING_PROFILE",
      resource: "Visitor",
      resourceId: visitorId,
      userId: (merged.studentId as string) || null,
      details: JSON.stringify(merged),
    },
  });

  const refreshed = await getMarketingProfile(visitorId);
  // refreshed is non-null because we just created the row
  return refreshed as MarketingProfile;
}

export async function linkVisitorToIdentity(
  visitorId: string,
  identity: { studentId?: string; leadId?: string; email?: string; phone?: string }
): Promise<MarketingProfile> {
  return upsertMarketingProfile(visitorId, identity);
}
