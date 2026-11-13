import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { DOCUMENT_TYPES } from '../constants';
import { recordPhdAudit } from '../audit';
import { deletePhdFile, readPhdFile, savePhdFile } from '../storage';

export interface UploadInput {
  projectId: string;
  documentType: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  applicationId?: string | null;
  requirementId?: string | null;
}

export async function uploadDocument(actor: PhdActor, input: UploadInput) {
  const project = await db.phdProject.findUnique({ where: { id: input.projectId } });
  if (!project || !canAccessProject(actor, project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  if (!DOCUMENT_TYPES.includes(input.documentType as (typeof DOCUMENT_TYPES)[number])) {
    throw new PhdAccessError('Unknown document type.', 422);
  }
  if (input.applicationId) {
    const application = await db.phdApplication.findUnique({ where: { id: input.applicationId } });
    if (!application || application.projectId !== input.projectId) {
      throw new PhdAccessError('The application does not belong to this project.', 422);
    }
  }
  if (input.requirementId) {
    const requirement = await db.phdDocumentRequirement.findUnique({ where: { id: input.requirementId } });
    if (!requirement) throw new PhdAccessError('Document requirement not found.', 422);
    if (!input.applicationId) throw new PhdAccessError('A requirement can only be linked through an application.', 422);
  }

  const stored = await savePhdFile({
    scope: 'documents',
    ownerSegment: input.projectId,
    filename: input.filename,
    mimeType: input.mimeType,
    buffer: input.buffer,
  });

  const document = await db.phdDocument.create({
    data: {
      projectId: input.projectId,
      name: stored.originalName,
      documentType: input.documentType,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      uploadedById: actor.userId,
      applicationId: input.applicationId ?? null,
      requirementId: input.requirementId ?? null,
      retentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await recordPhdAudit({
    actor,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'PhdDocument',
    entityId: document.id,
    projectId: input.projectId,
    details: { documentType: input.documentType, bytes: stored.sizeBytes, mime: stored.mimeType },
  });
  return document;
}

export async function listDocuments(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'read')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return db.phdDocument.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, documentType: true, mimeType: true, sizeBytes: true,
      version: true, status: true, createdAt: true, retentionUntil: true,
      applicationId: true, requirementId: true,
    },
  });
}

export async function downloadDocument(actor: PhdActor, documentId: string) {
  const document = await db.phdDocument.findUnique({ where: { id: documentId }, include: { project: true } });
  if (!document || document.deletedAt || !canAccessProject(actor, document.project, 'read')) {
    throw new PhdAccessError('Document not found or access denied.', 404);
  }
  const buffer = await readPhdFile(document.storageKey);
  await recordPhdAudit({
    actor,
    action: 'DOCUMENT_DOWNLOADED',
    entityType: 'PhdDocument',
    entityId: document.id,
    projectId: document.projectId,
    details: { documentType: document.documentType },
  });
  return {
    buffer,
    filename: document.name,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
  };
}

/**
 * Soft delete first: the private file is retained for the documented retention
 * window so an accidental deletion can be investigated, then a retention job
 * removes it. The file is never publicly addressable.
 */
export async function deleteDocument(actor: PhdActor, documentId: string) {
  const document = await db.phdDocument.findUnique({ where: { id: documentId }, include: { project: true } });
  if (!document || !canAccessProject(actor, document.project, 'write')) {
    throw new PhdAccessError('Document not found or access denied.', 404);
  }
  await db.phdDocument.update({
    where: { id: documentId },
    data: { deletedAt: new Date(), status: 'REJECTED', retentionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
  await recordPhdAudit({ actor, action: 'DOCUMENT_DELETED', entityType: 'PhdDocument', entityId: documentId, projectId: document.projectId });
  return { deleted: true, physicalFileRetainedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
}

export async function purgeExpiredDocuments(now: Date = new Date()): Promise<{ purged: number }> {
  const expired = await db.phdDocument.findMany({
    where: { deletedAt: { not: null }, retentionUntil: { lt: now } },
    take: 100,
  });
  let purged = 0;
  for (const document of expired) {
    await deletePhdFile(document.storageKey);
    await db.phdDocument.delete({ where: { id: document.id } });
    purged += 1;
  }
  return { purged };
}
