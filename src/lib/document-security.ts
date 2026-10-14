/**
 * Document Security — ALO Education
 * Private storage, access control, security incidents, audit
 */

import { db } from '@/lib/db';

const ALLOWED_RECIPIENT_TYPES = ['student_verified', 'university_official', 'partner_official', 'alo_official', 'authorized_employee', 'application_recipient'];

export async function checkDocumentSharingAllowed(params: {
  documentId: string;
  studentId: string;
  requestedById: string;
  requestedByRole: string;
  recipient: string;
  recipientType: string;
}): Promise<{ allowed: boolean; reason?: string; severity?: string }> {
  // Check recipient type
  if (!ALLOWED_RECIPIENT_TYPES.includes(params.recipientType)) {
    return { allowed: false, reason: `Recipient type ${params.recipientType} not allowed`, severity: 'high' };
  }

  // If external recipient not in allowed list, block
  if (params.recipientType === 'external') {
    return { allowed: false, reason: 'External unauthorized recipient', severity: 'critical' };
  }

  // Check if requester has permission to share student's document
  if (params.requestedByRole === 'counselor') {
    // Counselor can only share if assigned to student
    const student = await db.student.findUnique({ where: { id: params.studentId } }).catch(() => null) ||
                    await db.portalStudentProfile.findFirst({ where: { studentId: params.studentId } }).catch(() => null);
    if (student) {
      const counselorId = (student as any).counselorId;
      if (counselorId && counselorId !== params.requestedById) {
        // Not assigned counselor trying to share
        return { allowed: false, reason: 'Counselor not assigned to this student', severity: 'medium' };
      }
    }
  }

  // Partner-only mode check
  const studentProfile = await db.portalStudentProfile.findFirst({
    where: { studentId: params.studentId },
  }).catch(() => null);

  if (studentProfile?.partnerId) {
    // If partner-only, counselor must not bypass partner
    const partnerMode = await db.featureAccessRule.findFirst({
      where: { ownerId: studentProfile.partnerId, featureKey: 'PARTNER_ONLY_MODE' },
    }).catch(() => null);

    if (partnerMode?.isEnabled && params.requestedByRole === 'counselor') {
      // In partner-only mode, restrict direct sharing
      if (params.recipientType === 'student_verified' && !params.recipient.includes(studentProfile.partnerId)) {
        return { allowed: false, reason: 'Partner-only mode: direct student communication restricted', severity: 'medium' };
      }
    }
  }

  return { allowed: true };
}

export async function createSecurityIncident(params: {
  documentId: string;
  studentId: string;
  attemptedById: string;
  attemptedByName?: string;
  attemptedByRole?: string;
  recipient: string;
  recipientType: string;
  action: string;
  severity: string;
  reason: string;
  blocked: boolean;
}) {
  const incident = await db.documentSecurityIncident.create({
    data: {
      documentId: params.documentId,
      studentId: params.studentId,
      attemptedById: params.attemptedById,
      attemptedByName: params.attemptedByName || '',
      attemptedByRole: params.attemptedByRole || '',
      recipient: params.recipient,
      recipientType: params.recipientType,
      action: params.action,
      severity: params.severity,
      reason: params.reason,
      blocked: params.blocked,
      status: params.blocked ? 'blocked' : 'open',
    },
  });

  // Notify based on severity
  if (params.severity === 'high' || params.severity === 'critical') {
    // Notify Branch Manager and CEO
    await db.notification.create({
      data: {
        studentId: params.studentId,
        title: `Document Security Incident: ${params.severity}`,
        message: `Attempted ${params.action} of document ${params.documentId} to ${params.recipient} blocked. Reason: ${params.reason}. By ${params.attemptedByName}`,
        type: 'critical',
      },
    }).catch(() => {});

    await db.dashboardAlarm.create({
      data: {
        alarmType: 'DOCUMENT_SECURITY',
        studentId: params.studentId,
        studentName: `Security Incident`,
        assignedEmployee: 'BRANCH_MANAGER',
        escalationLevel: params.severity === 'critical' ? 3 : 2,
        priority: params.severity,
        status: 'active',
      },
    }).catch(() => {});
  }

  // Audit log
  await db.aloAuditLog.create({
    data: {
      studentId: params.studentId,
      actorType: params.attemptedByRole || 'employee',
      actorName: params.attemptedByName || params.attemptedById,
      action: 'DOCUMENT_SECURITY_INCIDENT',
      resource: 'Document',
      resourceId: params.documentId,
      details: JSON.stringify({ recipient: params.recipient, action: params.action, severity: params.severity, blocked: params.blocked }),
    },
  }).catch(() => {});

  return incident;
}

export async function logDocumentAccess(params: {
  documentId: string;
  studentId: string;
  accessedById: string;
  accessedByName?: string;
  accessedByRole?: string;
  action: 'view' | 'download' | 'share';
  ip?: string;
}) {
  await db.documentAudit.create({
    data: {
      documentId: params.documentId,
      studentId: params.studentId,
      actorId: params.accessedById,
      actorName: params.accessedByName || '',
      actorRole: params.accessedByRole || '',
      action: params.action,
      note: `Document ${params.action} by ${params.accessedByName}`,
    },
  }).catch(() => {});

  await db.aloAuditLog.create({
    data: {
      studentId: params.studentId,
      actorType: params.accessedByRole || 'employee',
      actorName: params.accessedByName || params.accessedById,
      action: `DOCUMENT_${params.action.toUpperCase()}`,
      resource: 'Document',
      resourceId: params.documentId,
      details: JSON.stringify({ action: params.action, ip: params.ip }),
      ipAddress: params.ip || '',
    },
  }).catch(() => {});
}

export function isPrivateDocumentPath(filePath: string): boolean {
  // All student documents must be private
  return filePath.includes('/student/') || filePath.includes('/documents/') || filePath.includes('/private/');
}

export function sanitizeFilePathForResponse(filePath: string): string {
  // Never expose internal filesystem path
  const parts = filePath.split('/');
  return parts[parts.length - 1] || 'document';
}

// ─────────────────────────────────────────────────────────────────────────────
// Recipient authorization for sending a student document
// ─────────────────────────────────────────────────────────────────────────────

export interface RecipientDecision {
  allowed: boolean;
  /** One of ALLOWED_RECIPIENT_TYPES, or 'external' when the send is refused. */
  recipientType: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** True only when the destination is a channel the platform already links to this student. */
  verified: boolean;
}

/**
 * Decide whether a document belonging to `studentId` may be sent to
 * `recipientPhone`.
 *
 * Deny by default. The previous implementation only consulted
 * `checkDocumentSharingAllowed`, which validates the *recipient type* the caller
 * claims but never the actual destination number, and which skipped its own
 * counselor check whenever the student had no assigned counselor. A document
 * could therefore be sent to any number at all.
 *
 * Allowed destinations, in order:
 *   1. an official ALO number (the number pool)
 *   2. a WhatsApp contact already linked to this student  → verified
 *   3. a WhatsApp contact linked to the student's partner → partner_official
 *   4. the phone recorded on the student's own profile     → unverified, allowed
 *
 * Anything else is refused and reported as a security incident by the caller.
 */
export async function resolveAuthorizedDocumentRecipient(params: {
  studentId: string;
  recipientPhone: string;
}): Promise<RecipientDecision> {
  const studentId = (params.studentId || '').trim();
  const recipientPhone = (params.recipientPhone || '').trim();

  if (!studentId || !recipientPhone) {
    return {
      allowed: false,
      recipientType: 'external',
      reason: 'A student and a destination number are both required before a document can be sent.',
      severity: 'medium',
      verified: false,
    };
  }

  const { OFFICIAL_NUMBERS, normalizeBdPhone } = await import('@/lib/whatsapp-number-pool');
  const normalized = normalizeBdPhone(recipientPhone);
  if (!normalized) {
    return {
      allowed: false,
      recipientType: 'external',
      reason: 'The destination number could not be parsed.',
      severity: 'medium',
      verified: false,
    };
  }

  // 1. Official ALO numbers always accept a student document.
  if (OFFICIAL_NUMBERS.some((number) => normalizeBdPhone(number) === normalized)) {
    return {
      allowed: true,
      recipientType: 'alo_official',
      reason: 'Destination is an official ALO WhatsApp number.',
      severity: 'low',
      verified: true,
    };
  }

  // 2 & 3. Contacts the platform already links to this student or their partner.
  const contact = await db.whatsAppContact
    .findFirst({ where: { normalizedPhone: normalized } })
    .catch(() => null);
  if (contact) {
    if (contact.studentId && contact.studentId === studentId) {
      return {
        allowed: true,
        recipientType: 'student_verified',
        reason: 'Destination is a WhatsApp contact already linked to this student.',
        severity: 'low',
        verified: true,
      };
    }
    if (contact.studentId && contact.studentId !== studentId) {
      return {
        allowed: false,
        recipientType: 'external',
        reason: 'Destination belongs to a different student.',
        severity: 'critical',
        verified: false,
      };
    }
    if (contact.partnerId) {
      const profile = await db.portalStudentProfile
        .findFirst({ where: { studentId }, select: { partnerId: true } })
        .catch(() => null);
      if (profile?.partnerId && profile.partnerId === contact.partnerId) {
        return {
          allowed: true,
          recipientType: 'partner_official',
          reason: 'Destination is a contact of the partner that owns this student.',
          severity: 'low',
          verified: true,
        };
      }
      return {
        allowed: false,
        recipientType: 'external',
        reason: 'Destination belongs to a partner that does not own this student.',
        severity: 'high',
        verified: false,
      };
    }
  }

  // 4. The number recorded on the student's own record.
  const student = await db.student
    .findUnique({ where: { id: studentId }, select: { phone: true } })
    .catch(() => null);
  if (student?.phone && normalizeBdPhone(student.phone) === normalized) {
    return {
      allowed: true,
      recipientType: 'student_verified',
      reason: "Destination matches the phone on the student's own record.",
      severity: 'low',
      verified: false,
    };
  }

  const profile = await db.portalStudentProfile
    .findFirst({ where: { studentId }, select: { altPhone: true } })
    .catch(() => null);
  if (profile?.altPhone && normalizeBdPhone(profile.altPhone) === normalized) {
    return {
      allowed: true,
      recipientType: 'student_verified',
      reason: "Destination matches an alternate phone on the student's profile.",
      severity: 'low',
      verified: false,
    };
  }

  return {
    allowed: false,
    recipientType: 'external',
    reason: 'Destination is not linked to this student, this student’s partner, or ALO.',
    severity: 'high',
    verified: false,
  };
}
