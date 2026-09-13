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
