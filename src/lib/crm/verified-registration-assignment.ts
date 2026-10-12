import type { Prisma } from '@prisma/client';
import { autoAssignCounselor } from '@/lib/crm-automation';

/** Called only inside the verified account transaction. Never contact-match.
 * The caller claims PENDING->ACTIVE atomically; only its winner can assign.
 */
export async function assignVerifiedRegistration(tx: Prisma.TransactionClient, input: { domain: 'user' | 'portal'; userId: string }) {
  const canonical = input.domain === 'user';
  const student = canonical
    ? await tx.student.findFirst({ where: { userId: input.userId }, select: { id: true, studentId: true, leadId: true } })
    : await tx.portalStudentProfile.findUnique({ where: { userId: input.userId }, select: { id: true, studentId: true } });
  if (!student) throw new Error('Registered student profile missing');
  // Canonical identity owns an exact primary-key link. Portal registrations
  // record that same link in their transaction-scoped, namespace-aware audit.
  // Never fall back to matching email, phone or a recycled business code.
  let leadId = 'leadId' in student ? student.leadId : null;
  if (!canonical) {
    const records = await tx.portalAuditLog.findMany({ where: { actorUserId: input.userId,
      action: 'REGISTRATION_LEAD_CREATED', entityType: 'Lead' }, select: { entityId: true, metadata: true }, take: 2 });
    if (records.length === 1) {
      try {
        const metadata = JSON.parse(records[0].metadata);
        if (metadata.identityDomain === 'portal' && metadata.studentId === student.studentId) leadId = records[0].entityId;
      } catch { /* Legacy/corrupt metadata requires review, never inference. */ }
    }
  }
  const lead = typeof leadId === 'string' && leadId
    ? await tx.lead.findUnique({ where: { id: leadId } }) : null;
  if (!lead || lead.studentId !== student.studentId || lead.source !== (canonical ? 'USER_STUDENT_REGISTRATION' : 'PORTAL_STUDENT_REGISTRATION')) {
    await tx.portalAuditLog.create({ data: { actorUserId: input.userId, action: 'REGISTRATION_ASSIGNMENT_REVIEW_REQUIRED', entityType: 'StudentRegistration', entityId: student.id,
      metadata: JSON.stringify({ identityDomain: input.domain, reason: 'Missing or inconsistent exact registration lead link' }) } });
    return;
  }
  const assignment = await autoAssignCounselor(lead.id, tx);
  if (canonical) await tx.student.update({ where: { id: student.id }, data: { counselorId: assignment.counselorId, journeyStage: assignment.counselorId ? 'assigned' : 'lead_created' } });
  // Never copy User counselor IDs into Portal profile fields.
  await tx.portalAuditLog.create({ data: { actorUserId: input.userId, action: 'VERIFIED_REGISTRATION_ASSIGNMENT', entityType: 'Lead', entityId: lead.id,
    metadata: JSON.stringify({ identityDomain: input.domain, counselorId: assignment.counselorId, reason: assignment.reason, portalMappingVerified: false, externalNotificationSent: false }) } });
}
