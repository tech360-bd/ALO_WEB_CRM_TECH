/**
 * Referral Engine
 *
 * Student-to-prospect referral system:
 *   - generateReferralCode(): unique AEFR-XXXXXX code
 *   - createReferral(referrerStudentId, { campaign, source }): creates a PENDING referral row
 *   - trackReferralUsage(referralCode, { referredName, referredPhone, referredEmail }):
 *       validates the code, links it to a newly created Lead (source=PARTNER_REFERRAL),
 *       and advances the referral status to QUALIFIED.
 *   - getReferralStats(studentId): aggregate metrics for the referrer dashboard
 *
 * Reward policy: rewards are optional and only ever marked ELIGIBLE when the
 * referred prospect becomes ENROLLED — never on signup alone.
 */

import { db } from "@/lib/db";

const REFERRAL_CODE_PREFIX = "AEFR-";
const REFERRAL_CODE_LENGTH = 6;

/**
 * Generate a unique AEFR-XXXXXX code (6-char alphanumeric, excludes ambiguous
 * chars like 0/O and 1/I). Retries on P2002 collision up to 5 times.
 */
export async function generateReferralCode(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, 1, I
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let code = REFERRAL_CODE_PREFIX;
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    // Check uniqueness
    const exists = await db.referral.findUnique({
      where: { referralCode: code },
      select: { referralCode: true },
    });
    if (!exists) return code;
  }

  // Fallback: time-based suffix (still unique with extremely high probability)
  return `${REFERRAL_CODE_PREFIX}${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export interface CreateReferralParams {
  campaign?: string;
  source?: string;   // WHATSAPP, MESSENGER, LINK, DIRECT
  rewardOffered?: string;
}

export interface ReferralResult {
  id: string;
  referralCode: string;
  referrerStudentId: string;
  status: string;
  campaign?: string;
  source?: string;
  rewardOffered?: string;
  rewardStatus?: string;
  createdAt: Date;
}

export async function createReferral(
  referrerStudentId: string,
  params: CreateReferralParams = {}
): Promise<ReferralResult> {
  if (!referrerStudentId) throw new Error("referrerStudentId is required");

  // Validate student exists
  const student = await db.student.findUnique({ where: { id: referrerStudentId } });
  if (!student) throw new Error("Referrer student not found");

  const code = await generateReferralCode();

  const created = await db.referral.create({
    data: {
      referralCode: code,
      referrerStudentId,
      campaign: params.campaign || null,
      source: params.source || "DIRECT",
      rewardOffered: params.rewardOffered || null,
      rewardStatus: params.rewardOffered ? "PENDING" : null,
      status: "PENDING",
    },
  });

  // Audit trail
  await db.auditLog.create({
    data: {
      action: "REFERRAL_CREATED",
      resource: "Referral",
      resourceId: created.id,
      details: JSON.stringify({
        referralCode: code,
        referrerStudentId,
        campaign: params.campaign || null,
        source: params.source || "DIRECT",
      }),
    },
  }).catch(() => {});

  // Notify the referrer student
  await db.studentNotification.create({
    data: {
      studentId: referrerStudentId,
      type: "REFERRAL",
      title: "Your referral link is ready",
      message: `Share code ${code} with friends interested in studying abroad.`,
      priority: "NORMAL",
      actionUrl: "/student/referrals",
      relatedId: created.id,
    },
  }).catch(() => {});

  return {
    id: created.id,
    referralCode: created.referralCode,
    referrerStudentId: created.referrerStudentId,
    status: created.status,
    campaign: created.campaign || undefined,
    source: created.source || undefined,
    rewardOffered: created.rewardOffered || undefined,
    rewardStatus: created.rewardStatus || undefined,
    createdAt: created.createdAt,
  };
}

export interface TrackReferralUsageParams {
  referredName?: string;
  referredPhone?: string;
  referredEmail?: string;
  referrerRewardNote?: string;
}

export interface TrackReferralUsageResult {
  success: boolean;
  referralId?: string;
  referralCode: string;
  leadId?: string;          // Lead.id (db id)
  leadCode?: string;        // Lead.leadId (ALO-L-XXXXX)
  referrerStudentId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Track usage of a referral code by a prospect.
 *
 * Behavior:
 *   - Validates the referral code exists and is in PENDING status.
 *   - Creates a Lead with source="PARTNER_REFERRAL" capturing the prospect's
 *     contact info.
 *   - Links the Lead back to the Referral row (referredLeadId) and advances
 *     the referral status to "QUALIFIED".
 *   - Returns leadId + referralId for downstream workflows.
 */
export async function trackReferralUsage(
  referralCode: string,
  params: TrackReferralUsageParams = {}
): Promise<TrackReferralUsageResult> {
  if (!referralCode) {
    return { success: false, referralCode, error: "referralCode is required", errorCode: "INVALID_CODE" };
  }

  const referral = await db.referral.findUnique({
    where: { referralCode },
  });
  if (!referral) {
    return { success: false, referralCode, error: "Referral code not found", errorCode: "NOT_FOUND" };
  }
  if (referral.status !== "PENDING") {
    return {
      success: false,
      referralCode,
      referralId: referral.id,
      error: `Referral already used (status=${referral.status})`,
      errorCode: "ALREADY_USED",
    };
  }

  // Basic prospect validation — need at least one identifier
  if (!params.referredName && !params.referredPhone && !params.referredEmail) {
    return {
      success: false,
      referralCode,
      error: "At least one of referredName, referredPhone, or referredEmail is required",
      errorCode: "MISSING_PROSPECT_INFO",
    };
  }

  // Generate lead code (ALO-L-XXXXX)
  const leadCode = `ALO-L-${Date.now().toString().slice(-6)}`;
  const fullName = params.referredName || params.referredPhone || params.referredEmail || "Referred Prospect";
  const phone = params.referredPhone || "UNKNOWN";

  try {
    // Create Lead + update Referral in a transaction
    const result = await db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          leadId: leadCode,
          fullName,
          email: params.referredEmail?.toLowerCase() || null,
          phone,
          source: "PARTNER_REFERRAL",
          sourceDetail: `Referral code ${referralCode}`,
          status: "NEW",
          priority: "NORMAL",
        },
      });

      const updated = await tx.referral.update({
        where: { id: referral.id },
        data: {
          referredLeadId: lead.id,
          referredName: params.referredName || null,
          referredPhone: params.referredPhone || null,
          referredEmail: params.referredEmail?.toLowerCase() || null,
          status: "QUALIFIED",
          qualifiedAt: new Date(),
        },
      });

      // Timeline event on the lead
      await tx.timelineEvent.create({
        data: {
          studentId: "",
          leadId: lead.id,
          stage: "lead",
          type: "NOTE",
          title: "Referral source",
          description: `This prospect was referred via code ${referralCode}.`,
          meta: JSON.stringify({ referralId: referral.id, referrerStudentId: referral.referrerStudentId }),
        },
      }).catch(() => {});

      return { lead, updated };
    });

    // Audit trail
    await db.auditLog.create({
      data: {
        action: "REFERRAL_USED",
        resource: "Referral",
        resourceId: referral.id,
        details: JSON.stringify({
          referralCode,
          leadId: result.lead.id,
          leadCode: result.lead.leadId,
          referrerStudentId: referral.referrerStudentId,
        }),
      },
    }).catch(() => {});

    // Notify the referrer
    await db.studentNotification.create({
      data: {
        studentId: referral.referrerStudentId,
        type: "REFERRAL",
        title: "Your referral signed up!",
        message: `${fullName} used your referral code. We'll be in touch with them soon.`,
        priority: "NORMAL",
        actionUrl: "/student/referrals",
        relatedId: referral.id,
      },
    }).catch(() => {});

    return {
      success: true,
      referralId: referral.id,
      referralCode,
      leadId: result.lead.id,
      leadCode: result.lead.leadId,
      referrerStudentId: referral.referrerStudentId,
    };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return {
      success: false,
      referralCode,
      referralId: referral.id,
      error: e?.message || "Failed to track referral",
      errorCode: "INTERNAL_ERROR",
    };
  }
}

export interface ReferralStats {
  total: number;
  pending: number;
  qualified: number;
  consultationDone: number;
  applicationSubmitted: number;
  enrolled: number;
  rewarded: number;
  conversionRate: number; // enrolled / total
  bySource: Record<string, number>;
}

export async function getReferralStats(studentId: string): Promise<ReferralStats> {
  if (!studentId) throw new Error("studentId is required");

  const referrals = await db.referral.findMany({
    where: { referrerStudentId: studentId },
    select: { status: true, source: true },
  });

  const stats: ReferralStats = {
    total: referrals.length,
    pending: 0,
    qualified: 0,
    consultationDone: 0,
    applicationSubmitted: 0,
    enrolled: 0,
    rewarded: 0,
    conversionRate: 0,
    bySource: {},
  };

  for (const r of referrals) {
    switch (r.status) {
      case "PENDING": stats.pending += 1; break;
      case "QUALIFIED": stats.qualified += 1; break;
      case "CONSULTATION_DONE": stats.consultationDone += 1; break;
      case "APPLICATION_SUBMITTED": stats.applicationSubmitted += 1; break;
      case "ENROLLED": stats.enrolled += 1; break;
      case "REWARDED": stats.rewarded += 1; break;
    }
    const src = r.source || "DIRECT";
    stats.bySource[src] = (stats.bySource[src] || 0) + 1;
  }

  stats.conversionRate = stats.total > 0
    ? Math.round((stats.enrolled / stats.total) * 100)
    : 0;

  return stats;
}
