import { db } from '@/lib/db';
import {
  PARTNER_PACKAGES,
  ALO_HARD_VIDEO_CEILING_SECONDS,
  resolveEffectiveLimits,
  checkVideoDuration,
  checkMarketingQuota,
  quotaMessage,
  hasActiveAloApplication,
  canUseStudentBenefit as canUseStudentBenefitPolicy,
  canUseVoucher as canUseVoucherPolicy,
  canViewEmployeePrivateProfile as canViewEmployeePrivateProfilePolicy,
  canViewB2BDetails as canViewB2BDetailsPolicy,
  type BenefitType,
} from '@/lib/partner/entitlement-policy';

const STARTER = PARTNER_PACKAGES.starter;

// 1. Check feature access for user or role
export async function canAccessFeature(userId: string, featureKey: string, userRoles: string[] = []): Promise<boolean> {
  // ALO Super Admin & Chairman always have full master access
  if (
    userRoles.includes('super_admin') ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('chairman') ||
    userRoles.includes('CHAIRMAN')
  ) {
    return true;
  }

  const user = await db.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (user && (user.role === 'super_admin' || user.role === 'SUPER_ADMIN')) {
    return true;
  }

  // Check custom feature access rule
  const rule = await db.featureAccessRule.findFirst({
    where: {
      OR: [
        { ownerId: userId, featureKey, isEnabled: true },
        ...userRoles.map(r => ({ ownerId: r, featureKey, isEnabled: true })),
      ],
    },
  });

  return !!rule;
}

/**
 * Canonical quota feature keys.
 *
 * Call sites historically used several spellings for the same quota
 * (`marketing_images`, `monthly_images`, `MARKETING_IMAGE_GENERATION`, ...).
 * `getQuota` only recognised some of them and silently returned 0 for the
 * rest, so `/api/partner/marketing/generate` — which passes
 * `marketing_images` / `marketing_videos` — told every partner
 * "Monthly quota finished (0/0)" even on a brand new month with a valid
 * 15-image allowance. Partner image and video generation was therefore
 * completely unusable. Normalising the key here fixes all call sites at once
 * without having to change each of them.
 */
export const QUOTA_IMAGE = 'monthly_images';
export const QUOTA_VIDEO = 'monthly_videos';
export const QUOTA_SEATS = 'user_seats';
export const QUOTA_VIDEO_DURATION = 'video_duration_limit_seconds';

const QUOTA_KEY_ALIASES: Record<string, string> = {
  monthly_images: QUOTA_IMAGE,
  marketing_images: QUOTA_IMAGE,
  marketing_image: QUOTA_IMAGE,
  images: QUOTA_IMAGE,
  image: QUOTA_IMAGE,
  marketing_image_generation: QUOTA_IMAGE,

  monthly_videos: QUOTA_VIDEO,
  marketing_videos: QUOTA_VIDEO,
  marketing_video: QUOTA_VIDEO,
  videos: QUOTA_VIDEO,
  video: QUOTA_VIDEO,
  marketing_video_generation: QUOTA_VIDEO,

  user_seats: QUOTA_SEATS,
  partner_max_users: QUOTA_SEATS,
  seats: QUOTA_SEATS,
  max_users: QUOTA_SEATS,

  video_duration_limit_seconds: QUOTA_VIDEO_DURATION,
  video_duration: QUOTA_VIDEO_DURATION,
};

/** Map any accepted spelling of a quota key to its canonical form. */
export function normalizeQuotaKey(featureKey: string): string {
  return QUOTA_KEY_ALIASES[String(featureKey || '').toLowerCase()] || featureKey;
}

/** Human-readable label used in quota-exceeded messages. */
function quotaLabel(canonicalKey: string): string {
  if (canonicalKey === QUOTA_IMAGE) return 'image';
  if (canonicalKey === QUOTA_VIDEO) return 'video';
  if (canonicalKey === QUOTA_SEATS) return 'user seat';
  return canonicalKey;
}

// Starter package defaults. The numbers now live in the pure entitlement policy so
// quotas can be decided (and tested) without a database; these names are kept as
// re-exports because ten routes import them.
export const STARTER_IMAGE_LIMIT = STARTER.monthlyImageLimit;
export const STARTER_VIDEO_LIMIT = STARTER.monthlyVideoLimit;
export const STARTER_SEAT_LIMIT = STARTER.defaultUserLimit; // 1 Partner Super Admin + 2 Employees
export const STARTER_VIDEO_DURATION_SECONDS = STARTER.videoDurationLimitSeconds;

// 2. Get approved quota limit for partner/feature
export async function getQuota(ownerType: string, ownerId: string, rawFeatureKey: string): Promise<number> {
  const featureKey = normalizeQuotaKey(rawFeatureKey);
  if (featureKey === 'monthly_images' || featureKey === 'MARKETING_IMAGE_GENERATION') {
    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: ownerId } }).catch(() => null);
    return quota?.monthlyImageLimit || STARTER_IMAGE_LIMIT;
  }
  if (featureKey === 'monthly_videos' || featureKey === 'MARKETING_VIDEO_GENERATION') {
    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: ownerId } }).catch(() => null);
    return quota?.monthlyVideoLimit || STARTER_VIDEO_LIMIT;
  }
  if (featureKey === 'user_seats' || featureKey === 'partner_max_users') {
    const assignment = await db.partnerPackageAssignment.findFirst({
      where: { partnerId: ownerId, status: 'active' },
    }).catch(() => null);

    if (assignment) {
      // An ALO-approved extra-seat grant overrides the package default.
      if (assignment.seatOverride && assignment.seatOverride > 0) return assignment.seatOverride;
      const pkg = await db.partnerPackage.findUnique({ where: { id: assignment.packageId } }).catch(() => null);
      if (pkg?.maxUsers) return pkg.maxUsers;
    }
    return STARTER_SEAT_LIMIT; // Starter package = 3 (1 Partner Super Admin + 2 Employees)
  }
  if (featureKey === 'video_duration_limit_seconds') {
    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: ownerId } }).catch(() => null);
    return quota?.videoDurationLimitSeconds || STARTER_VIDEO_DURATION_SECONDS;
  }
  return 0;
}

// 3. Atomically check quota before performing action
export async function checkQuotaBeforeAction(
  ownerType: string,
  ownerId: string,
  rawFeatureKey: string
): Promise<{ allowed: boolean; remaining: number; currentUsage: number; limit: number; used: number; message: string }> {
  const featureKey = normalizeQuotaKey(rawFeatureKey);
  const limit = await getQuota(ownerType, ownerId, featureKey);
  const currentMonth = currentPeriod();

  const usage = await db.partnerMarketingUsage.findFirst({
    where: { partnerId: ownerId, monthYear: currentMonth },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  const used = featureKey === QUOTA_IMAGE
    ? (usage?.imagesUsed || 0)
    : (usage?.videosUsed || 0);

  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    currentUsage: used,
    used,
    limit,
    message: allowed
      ? 'Quota available'
      : quotaExceededMessage(featureKey, used, limit),
  };
}

/** Current quota period in `YYYY-MM` form. */
export function currentPeriod(date: Date = new Date()): string {
  return date.toISOString().substring(0, 7);
}

/** The exact message shown to a partner when a monthly quota is exhausted. */
export function quotaExceededMessage(canonicalKey: string, used: number, limit: number): string {
  return `Your monthly ${quotaLabel(canonicalKey)} quota is finished (${used}/${limit}). Request extra quota from ALO Education.`;
}

/**
 * Atomically reserve one unit of a monthly quota.
 *
 * `checkQuotaBeforeAction` followed by `recordUsage` is a check-then-act
 * sequence: two concurrent generate requests both read `used = 14` against a
 * limit of 15, both pass the check, and both then increment — taking the
 * partner to 16 and bypassing the quota. This performs the test and the
 * increment in a single conditional UPDATE inside a transaction, so exactly
 * one of two racing callers can win.
 *
 * Returns `allowed: false` (and consumes nothing) when the quota is exhausted.
 */
export async function reserveQuota(
  ownerType: string,
  ownerId: string,
  rawFeatureKey: string,
): Promise<{ allowed: boolean; remaining: number; used: number; limit: number; message: string }> {
  const featureKey = normalizeQuotaKey(rawFeatureKey);
  const limit = await getQuota(ownerType, ownerId, featureKey);
  const period = currentPeriod();
  const isImage = featureKey === QUOTA_IMAGE;
  const column = isImage ? 'imagesUsed' : 'videosUsed';

  if (limit <= 0) {
    return { allowed: false, remaining: 0, used: 0, limit, message: quotaExceededMessage(featureKey, 0, limit) };
  }

  try {
    return await db.$transaction(async (tx: any) => {
      // Ensure the period row exists before the conditional update.
      await tx.partnerMarketingUsage.upsert({
        where: { partnerId_monthYear: { partnerId: ownerId, monthYear: period } },
        update: {},
        create: { partnerId: ownerId, monthYear: period, imagesUsed: 0, videosUsed: 0 },
      });

      // Conditional increment: the `lt: limit` predicate is evaluated by the
      // database as part of the UPDATE, so a losing racer matches 0 rows.
      const result = await tx.partnerMarketingUsage.updateMany({
        where: { partnerId: ownerId, monthYear: period, [column]: { lt: limit } },
        data: { [column]: { increment: 1 } },
      });

      const row = await tx.partnerMarketingUsage.findUnique({
        where: { partnerId_monthYear: { partnerId: ownerId, monthYear: period } },
      });
      const used = (isImage ? row?.imagesUsed : row?.videosUsed) ?? limit;

      if (result.count === 0) {
        return {
          allowed: false,
          remaining: 0,
          used,
          limit,
          message: quotaExceededMessage(featureKey, used, limit),
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - used),
        used,
        limit,
        message: 'Quota reserved.',
      };
    });
  } catch {
    // Fail closed: never allow an action when the quota ledger is unavailable.
    return { allowed: false, remaining: 0, used: 0, limit, message: 'Quota service unavailable. Please try again.' };
  }
}

/**
 * Release a previously reserved quota unit when the action it was reserved for
 * ultimately failed, so a partner is not charged for work never delivered.
 */
export async function releaseQuota(
  ownerType: string,
  ownerId: string,
  rawFeatureKey: string,
): Promise<void> {
  const featureKey = normalizeQuotaKey(rawFeatureKey);
  const period = currentPeriod();
  const column = featureKey === QUOTA_IMAGE ? 'imagesUsed' : 'videosUsed';
  await db.partnerMarketingUsage.updateMany({
    where: { partnerId: ownerId, monthYear: period, [column]: { gt: 0 } },
    data: { [column]: { decrement: 1 } },
  }).catch(() => null);
}

// 4. Record usage atomically (prevents race on simultaneous generates)
export async function recordUsage(ownerType: string, ownerId: string, rawFeatureKey: string): Promise<void> {
  const featureKey = normalizeQuotaKey(rawFeatureKey);
  const currentMonth = currentPeriod();
  const isImage = featureKey === QUOTA_IMAGE;
  const isVideo = featureKey === QUOTA_VIDEO;

  // Upsert ensures single row per partner+month (unique should be on [partnerId,monthYear]); then atomic increment
  const usage = await db.partnerMarketingUsage.upsert({
    where: { partnerId_monthYear: { partnerId: ownerId, monthYear: currentMonth } } as any,
    update: {
      imagesUsed: isImage ? { increment: 1 } : undefined,
      videosUsed: isVideo ? { increment: 1 } : undefined,
    } as any,
    create: {
      partnerId: ownerId,
      monthYear: currentMonth,
      imagesUsed: isImage ? 1 : 0,
      videosUsed: isVideo ? 1 : 0,
    },
  }).catch(async () => {
    // Fallback if @@unique([partnerId,monthYear]) not yet migrated — use findFirst+update transaction
    return await db.$transaction(async (tx: any) => {
      let u = await tx.partnerMarketingUsage.findFirst({ where: { partnerId: ownerId, monthYear: currentMonth }, orderBy: { createdAt: 'desc' } });
      if (!u) u = await tx.partnerMarketingUsage.create({ data: { partnerId: ownerId, monthYear: currentMonth, imagesUsed: 0, videosUsed: 0 } });
      return await tx.partnerMarketingUsage.update({ where: { id: u.id }, data: { imagesUsed: isImage ? u.imagesUsed + 1 : u.imagesUsed, videosUsed: isVideo ? u.videosUsed + 1 : u.videosUsed } });
    });
  });

  await db.crmAuditLog.create({
    data: {
      actorUserId: ownerId,
      actorRole: 'partner',
      action: 'QUOTA_USAGE_RECORDED',
      targetCollection: 'PartnerMarketingUsage',
      targetId: usage.id,
      afterData: JSON.stringify({ featureKey, period: currentMonth }),
    },
  }).catch(() => null);
}

// 5. Check if viewer can access employee private profile
export async function canViewEmployeePrivateProfile(
  viewerId: string,
  viewerRoles: string[],
  targetEmployeeId: string
): Promise<boolean> {
  if (viewerId === targetEmployeeId) return true;

  const isSuperAdmin = viewerRoles.includes('super_admin') || viewerRoles.includes('SUPER_ADMIN') || viewerRoles.includes('chairman') || viewerRoles.includes('CHAIRMAN');
  const isHrManager = viewerRoles.includes('hr_manager') || viewerRoles.includes('HR_MANAGER');

  if (isSuperAdmin || isHrManager) {
    await db.crmAuditLog.create({
      data: {
        actorUserId: viewerId,
        actorRole: viewerRoles.join(','),
        action: 'EMPLOYEE_PRIVATE_PROFILE_VIEWED',
        targetCollection: 'EmployeeProfile',
        targetId: targetEmployeeId,
      },
    }).catch(() => null);
    return true;
  }

  return false;
}

// 6. Check if viewer can access employee salary data
export async function canViewEmployeeSalary(
  viewerId: string,
  viewerRoles: string[],
  targetEmployeeId: string
): Promise<boolean> {
  if (viewerId === targetEmployeeId) return true;

  const isSuperAdmin = viewerRoles.includes('super_admin') || viewerRoles.includes('SUPER_ADMIN') || viewerRoles.includes('chairman') || viewerRoles.includes('CHAIRMAN');
  const isHrManager = viewerRoles.includes('hr_manager') || viewerRoles.includes('HR_MANAGER');

  if (isSuperAdmin || isHrManager) {
    await db.crmAuditLog.create({
      data: {
        actorUserId: viewerId,
        actorRole: viewerRoles.join(','),
        action: 'EMPLOYEE_SALARY_VIEWED',
        targetCollection: 'EmployeeSalary',
        targetId: targetEmployeeId,
      },
    }).catch(() => null);
    return true;
  }

  return false;
}

// 7. Check if viewer can download employee private document
export async function canViewEmployeeDocument(
  viewerId: string,
  viewerRoles: string[],
  targetEmployeeId: string,
  documentId: string
): Promise<boolean> {
  if (viewerId === targetEmployeeId) return true;

  const isSuperAdmin = viewerRoles.includes('super_admin') || viewerRoles.includes('SUPER_ADMIN') || viewerRoles.includes('hr_manager') || viewerRoles.includes('HR_MANAGER');
  if (isSuperAdmin) {
    await db.crmAuditLog.create({
      data: {
        actorUserId: viewerId,
        actorRole: viewerRoles.join(','),
        action: 'EMPLOYEE_DOCUMENT_DOWNLOADED',
        targetCollection: 'EmployeeDocument',
        targetId: documentId,
      },
    }).catch(() => null);
    return true;
  }

  return false;
}

// 8. Check if user can view confidential B2B details
export async function canViewB2BDetails(
  userId: string,
  userRoles: string[],
  applicationId: string
): Promise<boolean> {
  const isAuthorized =
    userRoles.includes('super_admin') ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('application_manager') ||
    userRoles.includes('application_team');

  if (isAuthorized) {
    await db.crmAuditLog.create({
      data: {
        actorUserId: userId,
        actorRole: userRoles.join(','),
        action: 'B2B_DETAIL_VIEWED',
        targetCollection: 'Application',
        targetId: applicationId,
      },
    }).catch(() => null);
    return true;
  }

  return false;
}

// 9. Check if student can use benefit (requires active ALO application)
export async function canUseStudentBenefit(
  studentId: string,
  benefitType: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Benefit requires an active, non-cancelled ALO application
  const app = await db.application.findFirst({
    where: {
      studentId,
      stage: { notIn: ['cancelled', 'withdrawn', 'rejected', 'closed'] },
    },
  }).catch(() => null);

  if (!app) {
    return {
      allowed: false,
      reason: 'This benefit is available after an eligible ALO application becomes active.',
    };
  }

  return { allowed: true };
}

// 10. Atomically validate and use student mock test voucher
export async function canUseVoucher(
  studentId: string,
  voucherCode: string
): Promise<{ allowed: boolean; voucher?: any; reason?: string }> {
  const voucher = await db.studentMockTestVoucher.findUnique({
    where: { voucherCode },
  }).catch(() => null);

  if (!voucher) {
    return { allowed: false, reason: 'Invalid voucher code.' };
  }

  if (voucher.studentId !== studentId) {
    return { allowed: false, reason: 'Voucher belongs to another student. Cross-student use blocked.' };
  }

  if (voucher.status !== 'available' && voucher.status !== 'AVAILABLE') {
    return { allowed: false, reason: `Voucher is ${voucher.status}. Only available vouchers can be used.` };
  }

  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    await db.studentMockTestVoucher.update({
      where: { id: voucher.id },
      data: { status: 'expired' },
    });
    return { allowed: false, reason: 'Voucher has expired.' };
  }

  if (voucher.usedCount >= voucher.usageLimit) {
    return { allowed: false, reason: 'Voucher usage limit reached.' };
  }

  return { allowed: true, voucher };
}

// 11. Check if user can manage users within a partner tenant
export async function canManagePartnerUser(
  userId: string,
  partnerId: string,
  userRoles: string[] = []
): Promise<boolean> {
  const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('SUPER_ADMIN');
  if (isSuperAdmin) return true;

  const isPartnerAdmin = userRoles.includes('partner_super_admin') || userRoles.includes('PARTNER_SUPER_ADMIN') || userRoles.includes('partner_admin');
  return isPartnerAdmin;
}

// 12. Enforce strict server-side tenant isolation
export async function canAccessPartnerResource(
  userPartnerId: string | null | undefined,
  targetPartnerId: string,
  userRoles: string[] = []
): Promise<boolean> {
  const isSuperAdmin = userRoles.includes('super_admin') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('chairman') || userRoles.includes('CHAIRMAN');
  if (isSuperAdmin) return true;

  if (!userPartnerId || userPartnerId !== targetPartnerId) {
    return false;
  }

  return true;
}

// ============================================================================
// FEATURE ACCESS ENGINE — object-level helpers mandated by the spec:
//   canAccessApplication(user_id, application_id)
//   canAccessDocument(user_id, document_id)
//   canSendCommunication(user_id, channel, target_id)
// Decision logic is pure in @/lib/access-control/object-scope; these wrappers
// only fetch the record facts. Every sensitive controller MUST use these
// checks — decisions never trust client-provided role/scope/ownership.
// ============================================================================

import {
  evaluateObjectScope,
  channelFeatureKey,
  isCommunicationChannel,
} from "@/lib/access-control/object-scope";

/** Resolve the counselor assignment behind an application id. */
async function applicationAssignee(applicationId: string): Promise<string> {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: { studentId: true },
  }).catch(() => null);
  if (!app?.studentId) return "";
  const student = await db.student.findUnique({
    where: { id: app.studentId },
    select: { counselorId: true },
  }).catch(() => null);
  return student?.counselorId || "";
}

// — canAccessApplication(user_id, application_id) —
export async function canAccessApplication(
  userId: string,
  applicationId: string,
  userRoles: string[] = []
): Promise<{ allowed: boolean; reason: string }> {
  if (!applicationId) return { allowed: false, reason: "applicationId required" };
  const assignee = await applicationAssignee(applicationId);
  const rule = await db.featureAccessRule.findFirst({
    where: { ownerId: userId, featureKey: { in: ["applications", "application", "application.view"] }, isEnabled: true },
  }).catch(() => null);
  const decision = evaluateObjectScope({
    roles: userRoles,
    isAssigned: !!assignee && assignee === userId,
    hasExplicitRule: !!rule,
  });
  await db.crmAuditLog.create({
    data: {
      actorUserId: userId,
      actorRole: userRoles.join(","),
      action: decision.allowed ? "APPLICATION_ACCESS_GRANTED" : "APPLICATION_ACCESS_DENIED",
      targetCollection: "Application",
      targetId: applicationId,
    },
  }).catch(() => null);
  return decision;
}

// — canAccessDocument(user_id, document_id) —
export async function canAccessDocument(
  userId: string,
  documentId: string,
  userRoles: string[] = []
): Promise<{ allowed: boolean; reason: string }> {
  if (!documentId) return { allowed: false, reason: "documentId required" };

  // Application documents scope through their application/counselor assignment.
  const appDoc = await db.applicationDocument.findUnique({
    where: { id: documentId },
    select: { applicationId: true },
  }).catch(() => null);
  if (appDoc) {
    const assignee = await applicationAssignee(appDoc.applicationId);
    const rule = await db.featureAccessRule.findFirst({
      where: { ownerId: userId, featureKey: { in: ["documents", "document", "document.manage"] }, isEnabled: true },
    }).catch(() => null);
    return evaluateObjectScope({
      roles: userRoles,
      isAssigned: !!assignee && assignee === userId,
      hasExplicitRule: !!rule,
    });
  }

  // Employee documents scope to the employee themself (OWN) or explicit HR rule.
  const empDoc = await db.employeeDocument.findUnique({
    where: { id: documentId },
    select: { employeeId: true },
  }).catch(() => null);
  if (empDoc) {
    const hrRule = await db.featureAccessRule.findFirst({
      where: { ownerId: userId, featureKey: { in: ["hr.documents", "employee_documents", "employees"] }, isEnabled: true },
    }).catch(() => null);
    return evaluateObjectScope({
      roles: userRoles,
      isOwner: empDoc.employeeId === userId,
      hasExplicitRule: !!hrRule,
    });
  }

  return { allowed: false, reason: "Document not found" };
}

// — canSendCommunication(user_id, channel, target_id) —
export async function canSendCommunication(
  userId: string,
  channel: string,
  targetId: string,
  userRoles: string[] = []
): Promise<{ allowed: boolean; reason: string }> {
  if (!isCommunicationChannel(channel)) {
    return { allowed: false, reason: `Unsupported channel '${channel}'` };
  }
  const featureAllowed = await canAccessFeature(userId, channelFeatureKey(channel), userRoles);
  if (featureAllowed) return { allowed: true, reason: "Channel feature rule enabled" };

  // Thread-assignment scope: the counselor the conversation is assigned to.
  const thread = await db.communicationThread.findFirst({
    where: { id: targetId },
    select: { assignedToId: true },
  }).catch(() => null);
  if (thread) {
    return evaluateObjectScope({ roles: userRoles, isAssigned: thread.assignedToId === userId });
  }

  // Student scope: the student's assigned counselor.
  const student = await db.student.findUnique({
    where: { id: targetId },
    select: { counselorId: true },
  }).catch(() => null);
  if (student) {
    return evaluateObjectScope({ roles: userRoles, isAssigned: student.counselorId === userId });
  }

  return evaluateObjectScope({ roles: userRoles });
}
