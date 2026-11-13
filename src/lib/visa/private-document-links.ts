import { db } from '@/lib/db';

/**
 * Returns only private, unarchived files owned by this student and either linked
 * to the current case or to the student's general (case-less) profile. The URL
 * remains an authenticated Visa API route; it is not a filesystem or storage URL.
 * Callers must separately enforce document-download and sensitive-data RBAC.
 */
export async function listPrivateVisaDocumentLinks(
  studentId: string,
  caseId: string,
  documentIds: string[],
  allowSensitive = false,
) {
  const ids = [...new Set(documentIds.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 191))].slice(0, 50);
  if (!ids.length) return [];

  const documents = await db.studentDocument.findMany({
    where: {
      id: { in: ids },
      studentId,
      caseId: { in: [caseId, ''] },
      isArchived: false,
      storagePath: { not: null },
      mimeType: { not: null },
      fileHash: { not: null },
    },
    select: { id: true, category: true },
  });
  const available = new Map(documents
    .filter((document) => allowSensitive || !['medical', 'criminal', 'sensitive'].some((part) => document.category.toLowerCase().includes(part)))
    .map((document) => [document.id, document]));

  return ids.filter((id) => available.has(id)).map((id) => ({
    id,
    downloadUrl: `/api/visa/documents/${encodeURIComponent(id)}/download`,
  }));
}
