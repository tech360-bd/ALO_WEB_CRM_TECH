import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMonitoringAdmin } from "@/lib/university-monitoring-auth";

// POST /api/university-monitoring/recheck
// Super Admin: request an immediate re-check of a specific change's source.
// Body: { changeId }
// The AI agent re-fetches the source, re-extracts facts, recalculates confidence.
//
// SECURITY: "Force recheck" is a Super-Admin-only action per the spec, and it
// causes outbound fetches to official sources. This route was previously
// unauthenticated and trusted a client-supplied `performedBy`.
export async function POST(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  const performedBy = guard.actor.userId;

  const body = await req.json().catch(() => ({}));
  const { changeId } = body as { changeId?: string };

  if (!changeId) {
    return NextResponse.json({ error: "changeId is required" }, { status: 400 });
  }

  const change = await db.dataChange.findUnique({
    where: { id: changeId },
    include: { source: true },
  });
  if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });

  // Update change status to RECHECK_REQUESTED
  await db.dataChange.update({
    where: { id: changeId },
    data: { status: "RECHECK_REQUESTED" },
  });

  // Update queue item
  await db.approvalQueueItem.updateMany({
    where: { changeId },
    data: { status: "RECHECK_REQUESTED", queueType: "RECHECK", requestedBy: performedBy },
  });

  // Audit log
  await db.approvalAction.create({
    data: {
      changeId,
      action: "REQUEST_RECHECK",
      performedBy,
      performedAt: new Date(),
      notes: "Manual recheck requested from Super Admin UI",
    },
  });

  await db.monitoringLog.create({
    data: {
      level: "AUDIT",
      message: `Recheck requested for change ${changeId} by ${performedBy}`,
      entityType: change.entityType,
      entitySlug: change.universitySlug || change.courseSlug,
      sourceUrl: change.sourceUrl,
      metadata: JSON.stringify({ changeId, fieldName: change.fieldName, oldValue: change.oldValue, newValue: change.newValue }),
    },
  });

  // Now actually re-fetch the source and re-analyze
  try {
    const { recheckSource } = await import("@/lib/university-monitoring-engine");
    const recheckResult = await recheckSource(change.source, change);

    // Update the change with the recheck results
    await db.dataChange.update({
      where: { id: changeId },
      data: {
        status: "PENDING", // back to pending for Super Admin review
        confidence: recheckResult.confidence,
        aiExplanation: recheckResult.aiExplanation,
        // Preserve original values — do NOT overwrite oldValue. newValue may be updated if recheck found a different value.
        newValue: recheckResult.newValue || change.newValue,
      },
    });

    await db.approvalQueueItem.updateMany({
      where: { changeId },
      data: { status: "PENDING", queueType: "STANDARD" },
    });

    return NextResponse.json({
      changeId,
      recheck: recheckResult,
      message: "Recheck completed — change is back in the pending queue for review",
    });
  } catch (err: any) {
    // If recheck fails (network error etc.), keep as NEEDS_REVIEW
    await db.dataChange.update({
      where: { id: changeId },
      data: { status: "NEEDS_REVIEW", aiExplanation: `Recheck failed: ${err.message}. Manual review required.` },
    });
    await db.approvalQueueItem.updateMany({
      where: { changeId },
      data: { status: "PENDING", queueType: "MANUAL_REVIEW" },
    });
    return NextResponse.json({
      changeId,
      error: err.message,
      message: "Recheck failed — change moved to manual review queue",
    }, { status: 500 });
  }
}
