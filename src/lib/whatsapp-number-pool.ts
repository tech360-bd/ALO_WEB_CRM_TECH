/**
 * WhatsApp Official Number Pool — ALO Education
 * Manages 20 official numbers 01805020100-01805020119
 * Provides routing engine with auditable assignments
 */

import { db } from '@/lib/db';
import crypto from 'crypto';

// Official number range
export const OFFICIAL_NUMBERS = Array.from({ length: 20 }, (_, i) => {
  const num = 1805020100 + i;
  return `0${num}`; // 01805020100 format
});

export const MAIN_NUMBER = '01805020100';
export const COO_NUMBER = '01805020101';
export const EMPLOYEE_POOL = OFFICIAL_NUMBERS.slice(2); // 01805020102-01805020119

export function normalizeBdPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('01') && digits.length === 11) digits = '880' + digits.slice(1);
  else if (digits.startsWith('+880')) digits = digits.slice(1);
  else if (digits.length === 10 && digits.startsWith('1')) digits = '880' + digits;
  return digits;
}

export async function seedOfficialNumberPool() {
  // Explicit, additive initialization: create only missing canonical rows and
  // never overwrite employee assignments, Meta IDs, status, or admin settings.
  const toCreate = OFFICIAL_NUMBERS.map((phone, idx) => {
    const normalized = normalizeBdPhone(phone);
    let ownerType = 'EMPLOYEE';
    let purpose = 'Employee WhatsApp';
    let isDefault = false;
    let isComplaint = false;
    let isFollowUp = false;
    let is247 = false;

    if (phone === MAIN_NUMBER) {
      ownerType = 'ALO_MAIN';
      purpose = 'Main WhatsApp - Complaint - Follow-up - Default automation sender';
      isDefault = true;
      isComplaint = true;
      isFollowUp = true;
    } else if (phone === COO_NUMBER) {
      ownerType = 'COO';
      purpose = 'COO - 24/7 urgent support - Escalation';
      is247 = true;
    }

    return {
      phoneNumber: phone,
      normalizedPhone: normalized,
      displayName: idx === 0 ? 'ALO Education Main' : idx === 1 ? 'ALO COO 24/7' : `ALO Employee ${idx - 1}`,
      ownerType,
      purpose,
      isDefaultSender: isDefault,
      isComplaintSender: isComplaint,
      isFollowUpSender: isFollowUp,
      isSupport247: is247,
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
  // Priority:
  // 1. Explicit conversation assignment
  // 2. Student counselor
  // 3. Branch assignment
  // 4. Department routing
  // 5. Purpose-specific sender
  // 6. Main ALO number

  if (ctx.explicitNumber) {
    return { number: ctx.explicitNumber, reason: 'explicit_assignment', fallback: false };
  }

  if (ctx.isUrgent) {
    return { number: COO_NUMBER, reason: 'urgent_support', fallback: false };
  }

  if (ctx.isComplaint) {
    return { number: MAIN_NUMBER, reason: 'complaint', fallback: false };
  }

  if (ctx.isFollowUp) {
    return { number: MAIN_NUMBER, reason: 'follow_up', fallback: false };
  }

  if (ctx.counselorId) {
    try {
      const empProfile = await db.employeeCommunicationProfile.findUnique({
        where: { employeeId: ctx.counselorId },
      });
      if (empProfile?.officialPhone && OFFICIAL_NUMBERS.includes(empProfile.officialPhone)) {
        return { number: empProfile.officialPhone, reason: 'student_counselor', fallback: false };
      }
      const employee = await db.employee.findFirst({
        where: { userId: ctx.counselorId },
      });
      if (employee?.whatsapp && OFFICIAL_NUMBERS.includes(employee.whatsapp)) {
        return { number: employee.whatsapp, reason: 'student_counselor_employee', fallback: false };
      }
    } catch {}
  }

  if (ctx.branch) {
    try {
      const branchNumber = await db.whatsAppOfficialNumber.findFirst({
        where: { branch: ctx.branch, activeStatus: 'active' },
        orderBy: { createdAt: 'asc' },
      });
      if (branchNumber) {
        return { number: branchNumber.phoneNumber, reason: 'branch_assignment', fallback: false };
      }
    } catch {}
  }

  // Default fallback
  return { number: MAIN_NUMBER, reason: 'default_fallback', fallback: true };
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

export function getPool(): { number: string; reason: string }[] {
  return OFFICIAL_NUMBERS.map((n) => ({ number: n, reason: 'pool' }));
}
