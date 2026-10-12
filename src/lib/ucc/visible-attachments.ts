import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { canUseUccDocuments, canViewUccB2B } from '@/lib/ucc/document-access';

export type VisibleUccAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  detectedDocType: string | null;
  createdAt: Date;
};

/** Return only private, integrity-addressable attachments the actor may view. */
export async function visibleUccAttachmentsByMessage(
  auth: AuthContext,
  conversationId: string,
  messageIds: string[],
): Promise<Map<string, VisibleUccAttachment[]>> {
  const result = new Map<string, VisibleUccAttachment[]>();
  if (!canUseUccDocuments(auth) || !messageIds.length) return result;

  const attachments = await db.uccAttachment.findMany({
    where: { conversationId, messageId: { in: messageIds } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      messageId: true,
      fileName: true,
      fileType: true,
      mimeType: true,
      fileSize: true,
      detectedDocType: true,
      applicationId: true,
      studentId: true,
      ocrExtractedData: true,
      createdAt: true,
    },
  });
  const applicationIds = [...new Set(attachments.map((item) => item.applicationId).filter((value): value is string => !!value))];
  const studentIds = [...new Set(attachments.map((item) => item.studentId).filter((value): value is string => !!value))];
  const applications: Array<{ id: string; studentId: string; isB2bConfidential: boolean }> = applicationIds.length
    ? await db.application.findMany({ where: { id: { in: applicationIds } }, select: { id: true, studentId: true, isB2bConfidential: true } })
    : [];
  const confidentialStudentApplications: Array<{ studentId: string }> = studentIds.length
    ? await db.application.findMany({ where: { studentId: { in: studentIds }, isB2bConfidential: true }, select: { studentId: true } })
    : [];
  const applicationsById = new Map(applications.map((item) => [item.id, item]));
  const confidentialStudentIds = new Set(confidentialStudentApplications.map((item) => item.studentId));

  for (const attachment of attachments) {
    let metadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(attachment.ocrExtractedData || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
    } catch { /* malformed metadata cannot establish private storage */ }
    if (typeof metadata.storagePath !== 'string' || !metadata.storagePath ||
        typeof metadata.fileHash !== 'string' || !/^[a-f0-9]{64}$/i.test(metadata.fileHash)) continue;

    if (attachment.applicationId) {
      const application = applicationsById.get(attachment.applicationId);
      if (!application || application.studentId !== attachment.studentId) continue;
      if (application.isB2bConfidential && !canViewUccB2B(auth)) continue;
    } else if (attachment.studentId && confidentialStudentIds.has(attachment.studentId) && !canViewUccB2B(auth)) {
      continue;
    }

    if (!attachment.messageId) continue;
    const visible: VisibleUccAttachment = {
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      detectedDocType: attachment.detectedDocType,
      createdAt: attachment.createdAt,
    };
    result.set(attachment.messageId, [...(result.get(attachment.messageId) || []), visible]);
  }
  return result;
}
