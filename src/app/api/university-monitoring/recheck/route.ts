import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';
import { recheckSource } from '@/lib/university-monitoring-engine';

// POST /api/university-monitoring/recheck — Super Admin refresh of one pending
// evidence-backed change. Rechecking may update its review evidence only; it
// never publishes the value into catalogue records.
export async function POST(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin rechecks are not allowed' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const changeId = body && typeof body.changeId === 'string' ? body.changeId.trim() : '';
  if (!changeId) return NextResponse.json({ success: false, error: 'changeId is required' }, { status: 400 });

  const change = await db.dataChange.findUnique({
    where: { id: changeId },
    include: { source: true, values: true },
  });
  if (!change) return NextResponse.json({ success: false, error: 'Change not found' }, { status: 404 });
  if (['APPROVED', 'REJECTED', 'SUPERSEDED'].includes(change.status)) {
    return NextResponse.json({ success: false, error: `A ${change.status.toLowerCase()} change cannot be reopened; create a new detection instead.` }, { status: 409 });
  }
  if (['SOURCE_UNAVAILABLE', 'SOURCE_CHANGED', 'POSSIBLE_DATA_CONFLICT', 'NEEDS_MANUAL_REVIEW'].includes(change.changeType)) {
    return NextResponse.json({
      success: false,
      error: 'This item has no single factual value to recheck. Recheck the source from the source registry or resolve the conflict/manual-review item.',
    }, { status: 409 });
  }

  const userId = guard.actor.userId;
  await db.$transaction(async (tx) => {
    await tx.dataChange.update({ where: { id: changeId }, data: { status: 'RECHECK_REQUESTED' } });
    await tx.approvalQueueItem.updateMany({
      where: { changeId },
      data: { status: 'RECHECK_REQUESTED', queueType: 'RECHECK', requestedBy: userId, resolvedAt: null },
    });
    await tx.approvalAction.create({
      data: {
        changeId,
        action: 'REQUEST_RECHECK',
        performedBy: userId,
        performedAt: new Date(),
        notes: 'Manual official-source recheck requested by Super Admin',
        metadata: JSON.stringify({ actorEmail: guard.actor.email, sourceId: change.sourceId }),
      },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: 'MONITORING_CHANGE_RECHECK_REQUESTED',
        resource: 'DataChange',
        resourceId: changeId,
        details: JSON.stringify({ sourceId: change.sourceId, fieldName: change.fieldName, sourceUrl: change.sourceUrl }),
      },
    });
    await tx.monitoringLog.create({
      data: {
        level: 'AUDIT',
        message: `Super Admin ${userId} requested a fresh official-source recheck for change ${changeId}.`,
        entityType: change.entityType,
        entitySlug: change.universitySlug || change.courseSlug || change.countrySlug,
        sourceUrl: change.sourceUrl,
        metadata: JSON.stringify({ changeId, sourceId: change.sourceId, fieldName: change.fieldName }),
      },
    });
  });

  try {
    const result = await recheckSource(change.source, change);
    const refreshed = await db.$transaction(async (tx) => {
      const updated = await tx.dataChange.update({
        where: { id: changeId },
        data: {
          status: 'PENDING',
          newValue: result.newValue,
          sourceUrl: result.sourceUrl,
          sourcePageTitle: result.sourcePageTitle,
          snapshotId: result.snapshotId,
          newSourceDate: result.newSourceDate,
          confidence: result.confidence,
          aiExplanation: result.aiExplanation,
          reviewedBy: null,
          reviewedAt: null,
          reviewNotes: null,
          appliedAt: null,
          appliedBy: null,
        },
      });
      const priorValue = change.values.find((value) => value.fieldName === change.fieldName);
      if (priorValue) {
        await tx.dataChangeValue.update({
          where: { id: priorValue.id },
          data: {
            newValue: result.newValue,
            newValueHash: createHash('sha256').update(result.newValue).digest('hex'),
            evidenceQuote: result.evidenceQuote,
            sourceUrl: result.sourceUrl,
          },
        });
      } else {
        await tx.dataChangeValue.create({
          data: {
            changeId,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: result.newValue,
            oldValueHash: change.oldValue ? createHash('sha256').update(change.oldValue).digest('hex') : null,
            newValueHash: createHash('sha256').update(result.newValue).digest('hex'),
            evidenceQuote: result.evidenceQuote,
            sourceUrl: result.sourceUrl,
          },
        });
      }
      await tx.approvalQueueItem.updateMany({
        where: { changeId },
        data: { status: 'PENDING', queueType: 'STANDARD', requestedBy: null, resolvedAt: null },
      });
      await tx.approvalAction.create({
        data: {
          changeId,
          action: 'RECHECK_COMPLETED',
          performedBy: userId,
          performedAt: new Date(),
          notes: 'Fresh source snapshot and exact evidence quote saved; change remains pending approval',
          metadata: JSON.stringify({ snapshotId: result.snapshotId, extractedField: result.extractedField, sourceUrl: result.sourceUrl }),
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MONITORING_CHANGE_RECHECK_COMPLETED',
          resource: 'DataChange',
          resourceId: changeId,
          details: JSON.stringify({ snapshotId: result.snapshotId, extractedField: result.extractedField, sourceUrl: result.sourceUrl }),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'AUDIT',
          message: `Recheck completed for change ${changeId}; fresh exact source evidence is pending a Super Admin decision.`,
          entityType: change.entityType,
          entitySlug: change.universitySlug || change.courseSlug || change.countrySlug,
          sourceUrl: result.sourceUrl,
          metadata: JSON.stringify({ changeId, snapshotId: result.snapshotId, extractedField: result.extractedField }),
        },
      });
      return updated;
    });

    return NextResponse.json({
      success: true,
      change: refreshed,
      recheck: result,
      message: 'Recheck completed. A fresh source version and exact quote were saved; the change remains pending Super Admin review.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Official-source recheck failed';
    await db.$transaction(async (tx) => {
      await tx.dataChange.update({
        where: { id: changeId },
        data: { status: 'NEEDS_REVIEW', aiExplanation: `Recheck failed: ${message.slice(0, 450)}. Manual review is required.` },
      });
      await tx.approvalQueueItem.updateMany({
        where: { changeId },
        data: { status: 'PENDING', queueType: 'MANUAL_REVIEW', requestedBy: userId, resolvedAt: null },
      });
      await tx.approvalAction.create({
        data: {
          changeId,
          action: 'RECHECK_FAILED',
          performedBy: userId,
          performedAt: new Date(),
          notes: message.slice(0, 500),
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MONITORING_CHANGE_RECHECK_FAILED',
          resource: 'DataChange',
          resourceId: changeId,
          details: JSON.stringify({ sourceId: change.sourceId, error: message.slice(0, 500) }),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'ERROR',
          message: `Recheck failed for change ${changeId}: ${message.slice(0, 500)}`,
          entityType: change.entityType,
          entitySlug: change.universitySlug || change.courseSlug || change.countrySlug,
          sourceUrl: change.sourceUrl,
          metadata: JSON.stringify({ changeId, sourceId: change.sourceId, actorId: userId }),
        },
      });
    });
    return NextResponse.json({ success: false, changeId, error: message, message: 'Recheck failed; the item remains in the manual-review queue and verified production data is unchanged.' }, { status: 422 });
  }
}
