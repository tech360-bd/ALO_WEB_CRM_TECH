/**
 * Behavior Tracking Engine
 *
 * Tracks visitor behavior events and computes intent scores.
 * Used by the Organic Growth Engine to qualify anonymous visitors.
 */

import { db } from "@/lib/db";

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

export interface TrackBehaviorEventParams {
  visitorId: string;
  eventType: string;
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackBehaviorEvent(params: TrackBehaviorEventParams): Promise<{ eventId: string; newIntentScore: number }> {
  const weight = INTENT_WEIGHTS[params.eventType] ?? 0;

  const event = await db.behaviorEvent.create({
    data: {
      visitorId: params.visitorId,
      eventType: params.eventType,
      intentPoints: weight,
      pageUrl: params.pageUrl ?? null,
      referrer: params.referrer ?? null,
      utmSource: params.utmSource ?? null,
      utmMedium: params.utmMedium ?? null,
      utmCampaign: params.utmCampaign ?? null,
      sessionId: params.sessionId ?? null,
      eventData: JSON.stringify(params.metadata ?? {}),
    },
  });

  let profile;
  const existing = await db.marketingProfile.findFirst({ where: { visitorId: params.visitorId } });
  if (existing) {
    profile = await db.marketingProfile.update({
      where: { id: existing.id },
      data: {
        intentScore: { increment: weight },
        lastActivity: new Date(),
        source: params.utmSource ?? undefined,
        medium: params.utmMedium ?? undefined,
        campaign: params.utmCampaign ?? undefined,
      },
    });
  } else {
    profile = await db.marketingProfile.create({
      data: {
        visitorId: params.visitorId,
        intentScore: weight,
        source: params.utmSource ?? null,
        medium: params.utmMedium ?? null,
        campaign: params.utmCampaign ?? null,
      },
    });
  }

  return { eventId: event.id, newIntentScore: profile.intentScore ?? 0 };
}

export async function getVisitorIntentScore(visitorId: string): Promise<number> {
  const result = await db.behaviorEvent.aggregate({
    where: { visitorId },
    _sum: { intentPoints: true },
  });
  return result._sum?.intentPoints ?? 0;
}

export async function getMarketingProfile(visitorId: string) {
  return await db.marketingProfile.findFirst({ where: { visitorId } });
}

export async function upsertMarketingProfile(visitorId: string, updates: Record<string, unknown>) {
  const existing = await db.marketingProfile.findFirst({ where: { visitorId } });
  if (existing) {
    return await db.marketingProfile.update({ where: { id: existing.id }, data: updates });
  }
  return await db.marketingProfile.create({ data: { visitorId, ...updates } });
}

export async function linkVisitorToIdentity(visitorId: string, params: { studentId?: string; leadId?: string; email?: string; phone?: string }) {
  const existing = await db.marketingProfile.findFirst({ where: { visitorId } });
  if (existing) {
    return await db.marketingProfile.update({
      where: { id: existing.id },
      data: {
        studentId: params.studentId ?? undefined,
        leadId: params.leadId ?? undefined,
        email: params.email ?? undefined,
        phone: params.phone ?? undefined,
      },
    });
  }
  return await db.marketingProfile.create({
    data: {
      visitorId,
      studentId: params.studentId ?? null,
      leadId: params.leadId ?? null,
      email: params.email ?? null,
      phone: params.phone ?? null,
    },
  });
}
