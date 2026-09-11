/**
 * Marketing Consent Service
 *
 * Manages consent lifecycle (grant / revoke / status check) and frequency caps
 * for outbound marketing touches (EMAIL, SMS, WHATSAPP, MESSENGER).
 *
 * Storage note:
 *   The schema does not yet have dedicated MarketingConsentLog / FrequencyCap
 *   models. We persist consent transitions and outbound touches as AuditLog
 *   rows keyed by visitorId (or email) with action prefixes:
 *     - MARKETING_CONSENT_GRANT
 *     - MARKETING_CONSENT_REVOKE
 *     - MARKETING_TOUCH
 *   The latest MARKETING_CONSENT_GRANT/REVOKE row reflects the current state.
 *
 * Frequency caps:
 *   - 1 message per day per channel per visitor
 *   - 3 messages per week per channel per visitor
 *   - 1 message per day per campaign per visitor
 */

import { db } from "@/lib/db";
import { CONSENT_VERSION } from "@/lib/student/canonical-student";
import { getMarketingProfile, upsertMarketingProfile } from "@/lib/behavior-tracking";

export interface ConsentParams {
  visitorId?: string;
  email?: string;
  studentId?: string;
  leadId?: string;
  consentSource: string;   // FORM_FOOTER, REGISTRATION, MODAL, CHECKOUT, etc.
  consentMethod: string;   // CHECKBOX, SIGNATURE, VERBAL, etc.
  consentVersion?: string; // defaults to current CONSENT_VERSION
  ip?: string;
  campaign?: string;
  medium?: string;
}

export interface ConsentResult {
  granted: boolean;
  visitorId?: string;
  email?: string;
  consentAt: Date;
  consentVersion: string;
}

function visitorKey(visitorId?: string, email?: string): string | null {
  if (visitorId) return visitorId;
  if (email) return `email:${email.toLowerCase()}`;
  return null;
}

export async function grantConsent(params: ConsentParams): Promise<ConsentResult> {
  const key = visitorKey(params.visitorId, params.email);
  if (!key) {
    throw new Error("Either visitorId or email is required");
  }

  const consentAt = new Date();
  const version = params.consentVersion || CONSENT_VERSION;

  // Persist the grant event
  await db.auditLog.create({
    data: {
      action: "MARKETING_CONSENT_GRANT",
      resource: "Visitor",
      resourceId: key,
      userId: params.studentId || null,
      ipAddress: params.ip || null,
      details: JSON.stringify({
        visitorId: params.visitorId,
        email: params.email?.toLowerCase(),
        studentId: params.studentId,
        leadId: params.leadId,
        consentSource: params.consentSource,
        consentMethod: params.consentMethod,
        consentVersion: version,
        campaign: params.campaign,
        medium: params.medium,
        consentAt: consentAt.toISOString(),
      }),
    },
  });

  // Mirror consent fields onto the marketing profile (if one exists)
  if (params.visitorId) {
    try {
      await upsertMarketingProfile(params.visitorId, {
        email: params.email?.toLowerCase(),
        studentId: params.studentId,
        leadId: params.leadId,
        marketingConsent: true,
        consentAt,
        consentSource: params.consentSource,
        consentMethod: params.consentMethod,
        consentVersion: version,
        revokedAt: undefined,
        campaign: params.campaign,
        medium: params.medium,
      });
    } catch {
      // profile may not exist yet — non-fatal
    }
  }

  return {
    granted: true,
    visitorId: params.visitorId,
    email: params.email?.toLowerCase(),
    consentAt,
    consentVersion: version,
  };
}

export interface RevokeConsentResult {
  revoked: boolean;
  visitorId?: string;
  email?: string;
  revokedAt: Date;
}

export async function revokeConsent(
  target: { visitorId?: string; email?: string }
): Promise<RevokeConsentResult> {
  const key = visitorKey(target.visitorId, target.email);
  if (!key) throw new Error("Either visitorId or email is required");

  const revokedAt = new Date();

  await db.auditLog.create({
    data: {
      action: "MARKETING_CONSENT_REVOKE",
      resource: "Visitor",
      resourceId: key,
      details: JSON.stringify({
        visitorId: target.visitorId,
        email: target.email?.toLowerCase(),
        revokedAt: revokedAt.toISOString(),
      }),
    },
  });

  // Update marketing profile to reflect revocation
  if (target.visitorId) {
    try {
      await upsertMarketingProfile(target.visitorId, {
        marketingConsent: false,
        revokedAt,
      });
    } catch {
      /* non-fatal */
    }
  }

  return {
    revoked: true,
    visitorId: target.visitorId,
    email: target.email?.toLowerCase(),
    revokedAt,
  };
}

export interface HasConsentResult {
  hasConsent: boolean;
  consentAt?: Date;
  consentVersion?: string;
  consentSource?: string;
  revokedAt?: Date;
}

export async function hasConsent(
  target: { visitorId?: string; email?: string }
): Promise<HasConsentResult> {
  const key = visitorKey(target.visitorId, target.email);
  if (!key) return { hasConsent: false };

  // Find the latest consent transition (grant OR revoke)
  const latest = await db.auditLog.findFirst({
    where: {
      resourceId: key,
      action: { in: ["MARKETING_CONSENT_GRANT", "MARKETING_CONSENT_REVOKE"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return { hasConsent: false };

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(latest.details || "{}");
  } catch {
    payload = {};
  }

  if (latest.action === "MARKETING_CONSENT_REVOKE") {
    return {
      hasConsent: false,
      revokedAt: latest.createdAt,
    };
  }

  return {
    hasConsent: true,
    consentAt: payload.consentAt ? new Date(payload.consentAt as string) : latest.createdAt,
    consentVersion: (payload.consentVersion as string) || undefined,
    consentSource: (payload.consentSource as string) || undefined,
  };
}

// ─── Frequency Caps ─────────────────────────────────────────────────────────
//
//   - 1 message / day / channel / visitor
//   - 3 messages / week / channel / visitor
//   - 1 message / day / campaign / visitor

export interface FrequencyCapParams {
  channel: string;        // EMAIL, SMS, WHATSAPP, MESSENGER
  campaignId?: string;
}

export interface FrequencyCapResult {
  allowed: boolean;
  reasons: string[];
  dayChannelCount: number;
  weekChannelCount: number;
  dayCampaignCount: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  // ISO week — Monday as start
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun ... 6=Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

export async function checkFrequencyCap(
  visitorId: string,
  params: FrequencyCapParams
): Promise<FrequencyCapResult> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  // All marketing touches for this visitor
  const touches = await db.auditLog.findMany({
    where: {
      action: "MARKETING_TOUCH",
      resourceId: visitorId,
      createdAt: { gte: weekStart },
    },
    select: { details: true, createdAt: true },
  });

  let dayChannelCount = 0;
  let weekChannelCount = 0;
  let dayCampaignCount = 0;

  for (const t of touches) {
    let payload: { channel?: string; campaignId?: string } = {};
    try {
      payload = JSON.parse(t.details || "{}");
    } catch {
      payload = {};
    }
    if (payload.channel !== params.channel) continue;

    // Week/channel counter
    weekChannelCount += 1;

    // Day/channel counter
    if (t.createdAt >= dayStart) {
      dayChannelCount += 1;
      if (params.campaignId && payload.campaignId === params.campaignId) {
        dayCampaignCount += 1;
      }
    }
  }

  const reasons: string[] = [];
  if (dayChannelCount >= 1) {
    reasons.push(`Daily cap (1/day/channel) reached for channel=${params.channel}`);
  }
  if (weekChannelCount >= 3) {
    reasons.push(`Weekly cap (3/week/channel) reached for channel=${params.channel}`);
  }
  if (params.campaignId && dayCampaignCount >= 1) {
    reasons.push(`Daily cap (1/day/campaign) reached for campaign=${params.campaignId}`);
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    dayChannelCount,
    weekChannelCount,
    dayCampaignCount,
  };
}

/**
 * Record an outbound marketing touch (so the next frequency check is accurate).
 * Called by the messaging layer AFTER a message is dispatched.
 */
export async function recordMarketingTouch(params: {
  visitorId: string;
  channel: string;
  campaignId?: string;
  messageRef?: string;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      action: "MARKETING_TOUCH",
      resource: "Visitor",
      resourceId: params.visitorId,
      details: JSON.stringify({
        channel: params.channel,
        campaignId: params.campaignId || null,
        messageRef: params.messageRef || null,
        sentAt: new Date().toISOString(),
      }),
    },
  });
}
