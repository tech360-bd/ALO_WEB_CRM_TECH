import type { Prisma } from '@prisma/client';
import { mapStageToSafeStatus, normalizeApplicationStage, validateApplicationStageTransition } from './service';
import { assertApplicationDocumentsReady } from './document-readiness';

export type StageTransitionFailureCode = 'NOT_FOUND' | 'INVALID_TRANSITION' | 'INVALID_REASON' | 'CONCURRENT_UPDATE' | 'DOCUMENTS_NOT_READY';

const DOCUMENT_GATED_STAGES = new Set([
  'SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'SUBMITTED_TO_UNIVERSITY',
  'SUBMITTED_VIA_PORTAL', 'SUBMITTED_VIA_EMAIL', 'SUBMITTED_VIA_REP',
]);

export class ApplicationStageTransitionError extends Error {
  constructor(readonly code: StageTransitionFailureCode, message: string) {
    super(message);
    this.name = 'ApplicationStageTransitionError';
  }
}

export interface TransitionApplicationStageInput {
  applicationId: string;
  toStage: string;
  actorId: string;
  reason: string;
  visibility?: string;
}

/**
 * Apply one validated lifecycle transition and persist both history records in
 * the caller's transaction. Conditional updateMany is a compare-and-set so two
 * counselors cannot overwrite each other's stage concurrently.
 */
export async function transitionApplicationStage(
  tx: Prisma.TransactionClient,
  input: TransitionApplicationStageInput,
) {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 180) {
    throw new ApplicationStageTransitionError('INVALID_REASON', 'A transition reason of 3–180 characters is required.');
  }

  const existing = await tx.application.findUnique({ where: { id: input.applicationId } });
  if (!existing) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');

  const targetStage = normalizeApplicationStage(input.toStage);
  const decision = validateApplicationStageTransition(existing.stage, targetStage);
  if (!decision.ok) throw new ApplicationStageTransitionError('INVALID_TRANSITION', decision.reason);

  if (DOCUMENT_GATED_STAGES.has(targetStage)) {
    try {
      await assertApplicationDocumentsReady(tx, existing.id);
    } catch (error) {
      throw new ApplicationStageTransitionError('DOCUMENTS_NOT_READY', error instanceof Error ? error.message : 'Application documents are not ready for submission.');
    }
  }

  if (normalizeApplicationStage(existing.stage) === targetStage) {
    return { application: existing, previousStage: existing.stage, stage: targetStage, changed: false };
  }

  const safeStatus = mapStageToSafeStatus(targetStage);
  const changed = await tx.application.updateMany({
    where: { id: existing.id, stage: existing.stage },
    data: { stage: targetStage, safeStatus, updatedBy: input.actorId },
  });
  if (changed.count !== 1) {
    throw new ApplicationStageTransitionError('CONCURRENT_UPDATE', 'Application changed while this transition was being saved. Reload and try again.');
  }

  const visibility = input.visibility || (existing.isB2bConfidential ? 'B2B_CONFIDENTIAL' : 'public_safe');
  await tx.applicationStatusLog.create({
    data: {
      applicationId: existing.id,
      oldStatus: existing.stage,
      newStatus: targetStage,
      safeStatus,
      changedBy: input.actorId,
      visibility,
      note: reason,
    },
  });
  await tx.applicationStageHistory.create({
    data: {
      applicationId: existing.id,
      stage: targetStage,
      status: 'completed',
      note: reason,
      actor: input.actorId,
    },
  });

  const application = await tx.application.findUnique({ where: { id: existing.id } });
  if (!application) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application disappeared while saving the transition.');
  return { application, previousStage: existing.stage, stage: targetStage, changed: true };
}
