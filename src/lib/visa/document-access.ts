import { db } from '@/lib/db';
import type { AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive } from '@/lib/visa/access';

export type VisaDocumentAccessResult =
  | { ok: true; document: NonNullable<Awaited<ReturnType<typeof db.studentDocument.findUnique>>>; visaCase: NonNullable<Awaited<ReturnType<typeof db.visaCase.findFirst>>> }
  | { ok: false; status: number; error: string };

function isSensitive(category: string) {
  return ['medical', 'criminal', 'sensitive'].some((word) => category.toLowerCase().includes(word));
}

export async function loadAuthorizedVisaDocument(auth: AuthContext, id: string, permission: string): Promise<VisaDocumentAccessResult> {
  const document = await db.studentDocument.findUnique({ where: { id } });
  if (!document || document.isArchived) return { ok: false, status: 404, error: 'Visa document not found.' };
  if (!document.storagePath || !document.mimeType || !document.fileHash) return { ok: false, status: 409, error: 'Document bytes are not available in verified private storage.' };

  const candidates = document.caseId
    ? [await db.visaCase.findUnique({ where: { id: document.caseId } })].filter(Boolean)
    : await db.visaCase.findMany({ where: { studentId: document.studentId }, orderBy: { updatedAt: 'desc' } });
  const visaCase = candidates.find((candidate: any) => candidate && candidate.studentId === document.studentId && canManageVisaPermission(auth, permission, candidate));
  if (!visaCase) return { ok: false, status: 403, error: `Assigned visa case and ${permission} permission required.` };
  if (isSensitive(document.category) && !canViewVisaSensitive(auth, visaCase as any)) return { ok: false, status: 403, error: 'Explicit sensitive-data permission is required for this document.' };
  return { ok: true, document, visaCase: visaCase as NonNullable<Awaited<ReturnType<typeof db.visaCase.findFirst>>> };
}
