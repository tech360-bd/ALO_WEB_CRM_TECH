import { z } from 'zod';
import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, isVisaSuperAdmin, visaCaseViewScope } from '@/lib/visa/access';

const schema = z.object({
  supportiveText: z.string().trim().min(10).max(2500),
  nextSteps: z.string().trim().max(2000).default(''),
  missingDocs: z.array(z.string().trim().min(1).max(191)).max(30).default([]),
  practiceTips: z.string().trim().max(2000).default(''),
  approved: z.literal(true),
}).strict();

const UNSAFE_FEEDBACK = [
  /\b(?:guarantee|guaranteed|100\s*%\s*success|visa will be approved|approval is certain)\b/i,
  /\b(?:internal risk|risk flag|confidential|officer note|staff criticism)\b/i,
  /\b(?:medical condition|criminal record|criminal offense|sensitive review)\b/i,
  /\b(?:embassy confirmed|official embassy rule|official requirement)\b/i,
];

export class VisaFeedbackError extends Error {
  constructor(message: string, public status = 400, public details?: unknown) {
    super(message);
    this.name = 'VisaFeedbackError';
  }
}

export async function publishApprovedStudentFeedback(auth: AuthContext, visaCase: { id: string; studentId: string }, input: unknown) {
  const fullScope = visaCaseViewScope(auth, visaCase) === 'full';
  if (!isVisaSuperAdmin(auth) && !(fullScope && hasVisaPermission(auth, 'visa.notes.student_feedback.create'))) {
    throw new VisaFeedbackError('Assigned case and visa.notes.student_feedback.create permission required.', 403);
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new VisaFeedbackError('Complete feedback fields and explicit officer approval are required.', 400, parsed.error.flatten());
  const combined = [parsed.data.supportiveText, parsed.data.nextSteps, parsed.data.practiceTips, ...parsed.data.missingDocs].join('\n');
  if (UNSAFE_FEEDBACK.some((pattern) => pattern.test(combined))) {
    throw new VisaFeedbackError('Feedback contains language that may expose internal or sensitive information or imply an outcome guarantee.', 400);
  }

  const message = [parsed.data.supportiveText, parsed.data.nextSteps && `Next steps: ${parsed.data.nextSteps}`, parsed.data.missingDocs.length && `Documents to review: ${parsed.data.missingDocs.join(', ')}`, parsed.data.practiceTips && `Practice tips: ${parsed.data.practiceTips}`].filter(Boolean).join('\n\n');
  return db.$transaction(async (tx) => {
    const saved = await tx.visaStudentFeedback.create({
      data: {
        caseId: visaCase.id,
        studentId: visaCase.studentId,
        supportiveText: parsed.data.supportiveText,
        nextSteps: parsed.data.nextSteps,
        missingDocs: JSON.stringify(parsed.data.missingDocs),
        practiceTips: parsed.data.practiceTips,
        approvedBy: auth.actorUserId,
        isSentToStudent: true,
        sentAt: new Date(),
      },
    });
    await tx.studentMessage.create({ data: { studentId: visaCase.studentId, senderType: 'visa_team', senderName: auth.name || 'Visa Team', message, channel: 'portal', isRead: false } });
    await tx.timelineEvent.create({ data: { studentId: visaCase.studentId, stage: 'VISA_STUDENT_FEEDBACK_SENT', title: 'Approved visa preparation feedback shared in the student portal.', description: 'A visa officer reviewed and approved preparation guidance. No visa decision or guarantee is represented.', actor: auth.actorUserId } });
    await tx.portalAuditLog.create({
      data: { actorUserId: auth.actorUserId, action: 'VISA_STUDENT_FEEDBACK_APPROVE_SEND', entityType: 'VisaStudentFeedback', entityId: saved.id, metadata: JSON.stringify({ caseId: visaCase.id, studentId: visaCase.studentId, channel: 'portal', approvedBy: auth.actorUserId }), ipAddress: '', userAgent: '' },
    });
    return { id: saved.id, caseId: saved.caseId, approved: true, sentToStudentPortal: true, sentAt: saved.sentAt };
  });
}
