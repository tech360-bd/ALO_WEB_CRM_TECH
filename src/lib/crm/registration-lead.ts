import { normalizePhone } from '@/lib/phone-normalization';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';

/** Core registration records and lead/assignment/audit must commit together.
 * Contact matches are hints, NOT authority to claim somebody else's records.
 * No provider calls and no MarketingLead/User FK are invented here.
 */
export async function createRegistrationLead(tx: Prisma.TransactionClient, input: {
  domain: 'user' | 'portal'; userId: string; studentId: string; name: string; email: string; phone: string;
}) {
  const phone = normalizePhone(input.phone) || '';
  const candidates = await tx.lead.findMany({
    where: { OR: [{ email: input.email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true }, take: 2,
  });
  const lead = await tx.lead.create({ data: {
    leadId: `ALO-L-${randomUUID()}`, fullName: input.name, email: input.email, phone,
    studentId: input.studentId, status: 'NEW', welcomeSent: false,
    source: input.domain === 'user' ? 'USER_STUDENT_REGISTRATION' : 'PORTAL_STUDENT_REGISTRATION',
    sourceDetail: 'Self-registration; contact matches require verified human identity review, not automatic merging.',
  } });
  // Verification must precede assignment: do not route unverified contacts
  // into counselor workload or trigger calls to a victim's supplied phone.
  const assignment = { counselorId: null, reason: 'Awaiting email verification' };
  await tx.portalAuditLog.create({ data: {
    actorUserId: input.userId, action: 'REGISTRATION_LEAD_CREATED', entityType: 'Lead', entityId: lead.id,
    metadata: JSON.stringify({ identityDomain: input.domain, studentId: input.studentId,
      duplicateReviewRequired: candidates.length > 0, counselorId: assignment.counselorId,
      assignmentReason: assignment.reason, providerNotificationSent: false }),
  } });
  return { leadId: lead.id, ...assignment, duplicateReviewRequired: candidates.length > 0 };
}
