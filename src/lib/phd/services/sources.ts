import { db } from '@/lib/db';
import { PhdAccessError, canVerify, type PhdActor } from '../auth';
import { recordPhdAudit } from '../audit';
import type { z } from 'zod';
import type { evidenceCreateSchema, verificationUpdateSchema } from '../validation';

/**
 * Source Verification Centre.
 *
 * Every institutional claim kept by the module has an evidence row with the exact
 * URL, an excerpt, the authority of the source and a status. Nothing here turns a
 * "not found" into a "confirmed unavailable", and no record is ever labelled
 * verified merely because a homepage was reachable.
 */

const OPEN_STATUSES = ['NOT_YET_VERIFIED', 'SOURCE_UNAVAILABLE', 'NEEDS_REVIEW', 'PARTIALLY_VERIFIED'];

export async function listSourceEvidence(
  actor: PhdActor,
  options: { status?: string; entityType?: string; page?: number; pageSize?: number } = {},
) {
  if (!canVerify(actor)) {
    throw new PhdAccessError('Only a data verifier or administrator can open the verification queue.', 403);
  }
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const where = {
    ...(options.status ? { verificationStatus: options.status } : {}),
    ...(options.entityType ? { entityType: options.entityType } : {}),
  };
  const [total, openCount, rows] = await Promise.all([
    db.phdSourceEvidence.count({ where }),
    db.phdSourceEvidence.count({ where: { verificationStatus: { in: OPEN_STATUSES } } }),
    db.phdSourceEvidence.findMany({
      where,
      orderBy: [{ verificationStatus: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { university: { select: { name: true } } },
    }),
  ]);
  return { evidence: rows, total, openCount, page, pageSize };
}

export async function createSourceEvidence(actor: PhdActor, input: z.infer<typeof evidenceCreateSchema>) {
  if (!canVerify(actor)) {
    throw new PhdAccessError('Only a data verifier or administrator can record evidence.', 403);
  }
  const evidence = await db.phdSourceEvidence.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      fieldName: input.fieldName ?? '',
      claim: input.claim,
      sourceUrl: input.sourceUrl ?? null,
      sourceAuthority: input.sourceAuthority,
      excerpt: input.excerpt ?? '',
      verificationStatus: input.verificationStatus,
      conflictNotes: '',
      universityId: input.universityId ?? null,
      nextVerificationAt: input.nextVerificationAt ? new Date(input.nextVerificationAt) : null,
      createdById: actor.userId,
    },
  });
  await db.phdVerificationEvent.create({
    data: {
      evidenceId: evidence.id,
      entityType: evidence.entityType,
      entityId: evidence.entityId,
      action: 'EVIDENCE_RECORDED',
      fromStatus: '',
      toStatus: evidence.verificationStatus,
      actorId: actor.userId,
      notes: `Field: ${evidence.fieldName || 'record'}`,
    },
  });
  await recordPhdAudit({
    actor,
    action: 'SOURCE_EVIDENCE_CREATED',
    entityType: 'PhdSourceEvidence',
    entityId: evidence.id,
    details: { entityType: evidence.entityType, status: evidence.verificationStatus },
  });
  return evidence;
}

export async function reviewSourceEvidence(
  actor: PhdActor,
  evidenceId: string,
  input: z.infer<typeof verificationUpdateSchema>,
) {
  if (!canVerify(actor)) {
    throw new PhdAccessError('Only a data verifier or administrator can review evidence.', 403);
  }
  const existing = await db.phdSourceEvidence.findUnique({ where: { id: evidenceId } });
  if (!existing) throw new PhdAccessError('Evidence record not found.', 404);

  const updated = await db.phdSourceEvidence.update({
    where: { id: evidenceId },
    data: {
      verificationStatus: input.verificationStatus,
      conflictNotes: input.conflictNotes ?? existing.conflictNotes,
      nextVerificationAt: input.nextVerificationAt ? new Date(input.nextVerificationAt) : existing.nextVerificationAt,
      reviewerId: actor.userId,
      reviewedAt: new Date(),
    },
  });
  await db.phdVerificationEvent.create({
    data: {
      evidenceId: updated.id,
      entityType: updated.entityType,
      entityId: updated.entityId,
      action: 'EVIDENCE_REVIEWED',
      fromStatus: existing.verificationStatus,
      toStatus: updated.verificationStatus,
      actorId: actor.userId,
      notes: (input.notes ?? '').slice(0, 2000),
    },
  });
  await recordPhdAudit({
    actor,
    action: 'SOURCE_EVIDENCE_REVIEWED',
    entityType: 'PhdSourceEvidence',
    entityId: updated.id,
    details: { from: existing.verificationStatus, to: updated.verificationStatus },
  });
  return updated;
}
