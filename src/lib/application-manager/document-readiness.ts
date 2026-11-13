import type { Prisma } from '@prisma/client';

type DocumentReadinessClient = Pick<Prisma.TransactionClient, 'applicationDocument' | 'application'>;
type AggregateDocumentStatus = 'PENDING' | 'INCOMPLETE' | 'UNDER_REVIEW' | 'COMPLETE';

export const DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS = [
  { type: 'Passport', label: 'Valid passport (information pages)' },
  { type: 'Academic', label: 'Academic certificates and transcripts' },
  { type: 'English', label: 'English proficiency certificate or accepted alternative' },
  { type: 'SOP', label: 'Statement of purpose' },
  { type: 'CV', label: 'Curriculum vitae or resume' },
  { type: 'References', label: 'Academic or professional references' },
] as const;

async function readLatestDocuments(client: DocumentReadinessClient, applicationId: string) {
  const documents = await client.applicationDocument.findMany({
    where: { applicationId, status: { not: 'SUPERSEDED' } },
    orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
    select: { documentType: true, status: true, version: true },
  });

  const latestByType = new Map<string, (typeof documents)[number]>();
  for (const document of documents) {
    const type = document.documentType.trim().toLowerCase();
    if (type && !latestByType.has(type)) latestByType.set(type, document);
  }
  return [...latestByType.values()];
}

/** Recompute the application aggregate exclusively from current document versions. */
export async function refreshApplicationDocumentStatus(client: DocumentReadinessClient, applicationId: string): Promise<AggregateDocumentStatus> {
  const current = await readLatestDocuments(client, applicationId);
  const allVerified = current.length > 0 && current.every((document) => ['VERIFIED', 'LOCKED'].includes(document.status.toUpperCase()));
  const hasReviewPending = current.some((document) => ['UPLOADED', 'STUDENT_SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(document.status.toUpperCase()));
  const status: AggregateDocumentStatus = current.length === 0
    ? 'PENDING'
    : allVerified
      ? 'COMPLETE'
      : hasReviewPending
        ? 'UNDER_REVIEW'
        : 'INCOMPLETE';
  await client.application.update({ where: { id: applicationId }, data: { documentStatus: status } });
  return status;
}

/** Enforce a hard submission gate based on the latest version of every requirement. */
export async function assertApplicationDocumentsReady(client: DocumentReadinessClient, applicationId: string): Promise<void> {
  const status = await refreshApplicationDocumentStatus(client, applicationId);
  if (status !== 'COMPLETE') {
    throw new Error(status === 'PENDING'
      ? 'No application document requirements have been recorded.'
      : 'All current application documents must be verified before submission.');
  }
}

/** Mirror a verified/rejected student-file decision onto every linked application requirement. */
export async function syncStudentDocumentReadiness(
  client: DocumentReadinessClient,
  documentId: string,
  applicationStatus: 'VERIFIED' | 'REJECTED' | 'REQUEST_AGAIN' | 'UNDER_REVIEW' | 'UPLOADED',
  review?: { reviewerId?: string; reviewerNote?: string },
): Promise<void> {
  const links = await client.applicationDocument.findMany({
    where: { documentId, status: { not: 'SUPERSEDED' } },
    select: { applicationId: true },
  });
  const applicationIds = [...new Set(links.map((link) => link.applicationId))];
  if (!applicationIds.length) return;
  await client.applicationDocument.updateMany({
    where: { documentId, status: { not: 'SUPERSEDED' } },
    data: { status: applicationStatus, ...(review?.reviewerId !== undefined ? { reviewerId: review.reviewerId } : {}), ...(review?.reviewerNote !== undefined ? { reviewerNote: review.reviewerNote } : {}) },
  });
  for (const applicationId of applicationIds) await refreshApplicationDocumentStatus(client, applicationId);
}
