import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { canViewUccB2B } from '@/lib/ucc/document-access';

type StudentLinkedConversation = { studentId?: string | null };

/**
 * UCC threads do not carry an applicationId. Fail closed by hiding a student's
 * thread from actors without explicit B2B access whenever that student has a
 * B2B-confidential application.
 */
export async function canViewUccConversationB2B(
  auth: AuthContext,
  conversation: StudentLinkedConversation,
): Promise<boolean> {
  if (!conversation.studentId || canViewUccB2B(auth)) return true;
  const confidentialApplication = await db.application.findFirst({
    where: { studentId: conversation.studentId, isB2bConfidential: true },
    select: { id: true },
  });
  return !confidentialApplication;
}

export async function filterUccConversationsByB2B<T extends StudentLinkedConversation>(
  auth: AuthContext,
  conversations: T[],
): Promise<T[]> {
  if (canViewUccB2B(auth)) return conversations;
  const studentIds = [...new Set(conversations.map((conversation) => conversation.studentId).filter((value): value is string => !!value))];
  if (!studentIds.length) return conversations;
  const confidentialApplications = await db.application.findMany({
    where: { studentId: { in: studentIds }, isB2bConfidential: true },
    select: { studentId: true },
  });
  const confidentialStudentIds = new Set(confidentialApplications.map((application) => application.studentId));
  return conversations.filter((conversation) => !conversation.studentId || !confidentialStudentIds.has(conversation.studentId));
}
