/**
 * WhatsApp sender registry configuration.
 *
 * Number values are deployment/operator configuration, not proof of ownership
 * or Meta connectivity. Every configured row starts disconnected and outbound
 * sending still requires a recent successful provider verification.
 */

import { db } from '@/lib/db';
import crypto from 'crypto';
import {
  COO_NUMBER,
  EMPLOYEE_POOL,
  MAIN_NUMBER,
  OFFICIAL_NUMBERS,
  normalizeBdPhone,
  toBdDisplayPhone,
} from './whatsapp-number-pool-plan';

// Re-exported so every existing import path keeps working unchanged. The pure
// implementation lives in `whatsapp-number-pool-plan.ts` (no Prisma dependency).
export {
  COO_NUMBER,
  EMPLOYEE_POOL,
  MAIN_NUMBER,
  OFFICIAL_NUMBERS,
  getPool,
  getWhatsAppNumberConfigStatus,
  normalizeBdPhone,
  planPoolSeed,
  reconcilePool,
  toBdDisplayPhone,
  type PoolReconciliation,
  type PoolReconciliationEntry,
  type PoolSeedPlan,
  type PoolSeedPlanEntry,
} from './whatsapp-number-pool-plan';

/** Add only operator-configured numbers; never invent a number or mark it connected. */
export async function seedOfficialNumberPool() {
  const configured = OFFICIAL_NUMBERS;
  if (configured.length === 0) {
    return { seeded: false, created: 0, count: await db.whatsAppOfficialNumber.count() };
  }

  const toCreate = configured.map((phone, idx) => {
    const normalized = normalizeBdPhone(phone);
    const isMain = phone === MAIN_NUMBER;
    const isCoo = phone === COO_NUMBER && !isMain;
    const employeeIndex = EMPLOYEE_POOL.indexOf(phone);
    const ownerType = isMain ? 'ALO_MAIN' : isCoo ? 'COO' : 'EMPLOYEE';

    return {
      phoneNumber: phone,
      normalizedPhone: normalized,
      displayName: isMain
        ? 'Configured ALO main sender'
        : isCoo
          ? 'Configured urgent-support sender'
          : `Configured employee sender ${employeeIndex >= 0 ? employeeIndex + 1 : idx + 1}`,
      ownerType,
      purpose: isMain
        ? 'Configured main sender; provider ownership must be verified before use'
        : isCoo
          ? 'Configured urgent-support sender; provider ownership must be verified before use'
          : 'Configured employee sender; provider ownership must be verified before use',
      isDefaultSender: isMain,
      isComplaintSender: isMain,
      isFollowUpSender: isMain,
      isSupport247: isCoo,
      connectionStatus: 'disconnected',
      activeStatus: 'active',
    };
  });

  const inserted = await db.whatsAppOfficialNumber.createMany({ data: toCreate, skipDuplicates: true });
  const count = await db.whatsAppOfficialNumber.count();
  return { seeded: inserted.count > 0, created: inserted.count, count };
}

export interface RoutingContext {
  studentId?: string;
  leadId?: string;
  counselorId?: string;
  branch?: string;
  department?: string;
  isComplaint?: boolean;
  isFollowUp?: boolean;
  isUrgent?: boolean;
  isPartner?: boolean;
  partnerId?: string;
  campaignId?: string;
  applicationId?: string;
  financeIssue?: boolean;
  visaIssue?: boolean;
  explicitNumber?: string;
}

export async function determineSenderNumber(ctx: RoutingContext): Promise<{ number: string; reason: string; fallback: boolean }> {
  // A routing choice is a preview/configuration decision only. The send service
  // separately checks DB ownership, active status and recent Meta verification.
  if (ctx.explicitNumber) {
    const explicit = toBdDisplayPhone(ctx.explicitNumber);
    if (explicit && OFFICIAL_NUMBERS.includes(explicit)) {
      return { number: explicit, reason: 'explicit_assignment', fallback: false };
    }
    return { number: '', reason: 'explicit_assignment_not_configured', fallback: true };
  }

  if (ctx.isUrgent && COO_NUMBER) {
    return { number: COO_NUMBER, reason: 'urgent_support', fallback: false };
  }
  if (ctx.isComplaint && MAIN_NUMBER) {
    return { number: MAIN_NUMBER, reason: 'complaint', fallback: false };
  }
  if (ctx.isFollowUp && MAIN_NUMBER) {
    return { number: MAIN_NUMBER, reason: 'follow_up', fallback: false };
  }

  if (ctx.counselorId) {
    try {
      const empProfile = await db.employeeCommunicationProfile.findUnique({
        where: { employeeId: ctx.counselorId },
      });
      const profilePhone = empProfile?.officialPhone ? toBdDisplayPhone(empProfile.officialPhone) : '';
      if (profilePhone && OFFICIAL_NUMBERS.includes(profilePhone)) {
        return { number: profilePhone, reason: 'student_counselor', fallback: false };
      }
      const employee = await db.employee.findFirst({ where: { userId: ctx.counselorId } });
      const employeePhone = employee?.whatsapp ? toBdDisplayPhone(employee.whatsapp) : '';
      if (employeePhone && OFFICIAL_NUMBERS.includes(employeePhone)) {
        return { number: employeePhone, reason: 'student_counselor_employee', fallback: false };
      }
    } catch {
      // Continue to the configured fallback; the actual send path fails closed
      // if its registry/provider checks cannot be completed.
    }
  }

  if (ctx.branch) {
    try {
      const branchNumber = await db.whatsAppOfficialNumber.findFirst({
        where: { branch: ctx.branch, activeStatus: 'active' },
        orderBy: { createdAt: 'asc' },
      });
      const configuredBranchPhone = branchNumber?.phoneNumber ? toBdDisplayPhone(branchNumber.phoneNumber) : '';
      if (configuredBranchPhone && OFFICIAL_NUMBERS.includes(configuredBranchPhone)) {
        return { number: configuredBranchPhone, reason: 'branch_assignment', fallback: false };
      }
    } catch {
      // Do not invent a replacement number on a registry failure.
    }
  }

  return {
    number: MAIN_NUMBER,
    reason: MAIN_NUMBER ? 'default_fallback' : 'no_configured_sender',
    fallback: true,
  };
}

export async function logNumberAssignment(params: {
  numberId: string;
  phoneNumber: string;
  changedById: string;
  changedByName?: string;
  changedByRole?: string;
  previous: Record<string, any>;
  next: Record<string, any>;
  reason?: string;
  ip?: string;
  userAgent?: string;
}) {
  await db.whatsAppNumberAssignmentAudit.create({
    data: {
      numberId: params.numberId,
      phoneNumber: params.phoneNumber,
      changedById: params.changedById,
      changedByName: params.changedByName || '',
      changedByRole: params.changedByRole || '',
      previousOwnerType: params.previous.ownerType || '',
      newOwnerType: params.next.ownerType || '',
      previousEmployee: params.previous.employeeOwnerId || '',
      newEmployee: params.next.employeeOwnerId || '',
      previousBranch: params.previous.branch || '',
      newBranch: params.next.branch || '',
      previousValue: JSON.stringify(params.previous),
      newValue: JSON.stringify(params.next),
      reason: params.reason || '',
      ipAddress: params.ip || '',
      userAgent: params.userAgent || '',
    },
  });
}

export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

