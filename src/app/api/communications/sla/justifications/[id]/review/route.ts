import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import type { AuthContext } from "@/lib/auth-middleware";
import { STAFF_POLICIES, staffGuardDenied } from "@/lib/api/staff-endpoint-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };

// POST — review a SLA justification (§155 manager review).
//   decision: ACCEPTED | REJECTED | CLARIFICATION_REQUESTED
//   incidentEffect: "EXCLUDE" — mark the linked SLA event as a valid exclusion
//                   (never deleted; excluded from breach counting), or "KEEP".
//   createCoachingTask: true — also create a coaching follow-up task for the
//                   counselor. All decisions stay auditable via SlaJustification
//                   review columns + the linked SlaEvent resolution marker.
export const POST = withAuth(async (req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) => {
  const denied = staffGuardDenied(auth, STAFF_POLICIES.slaPolicies, { write: true, request: req });
  if (denied) return denied;
  try {
    const { id } = await (context?.params ?? Promise.resolve({ id: "" }));
    if (!id) return NextResponse.json({ error: "Justification id is required" }, { status: 400, headers: NO_STORE });
    const body = await req.json();
    const { decision, reviewNotes, incidentEffect, createCoachingTask } = body;
    // The reviewer is bound to the authenticated session, never the request body.
    const reviewedBy = auth.actorUserId || auth.userId;

    if (!decision || !["ACCEPTED", "REJECTED", "CLARIFICATION_REQUESTED"].includes(decision)) {
      return NextResponse.json({ error: "decision must be ACCEPTED, REJECTED, or CLARIFICATION_REQUESTED" }, { status: 400, headers: NO_STORE });
    }
    if (incidentEffect !== undefined && !["EXCLUDE", "KEEP"].includes(incidentEffect)) {
      return NextResponse.json({ error: "incidentEffect must be EXCLUDE or KEEP" }, { status: 400, headers: NO_STORE });
    }

    const existing = await db.slaJustification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Justification not found" }, { status: 404 });
    }

    const updated = await db.slaJustification.update({
      where: { id },
      data: {
        status: decision,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    // §155 — incident handling: EXCLUDE marks the related SLA event as a
    // valid exclusion (the event itself is never deleted).
    let incidentUpdated = false;
    const effect = decision === "ACCEPTED" && incidentEffect === undefined ? "EXCLUDE" : incidentEffect;
    if (existing.slaEventId && (effect === "EXCLUDE" || effect === "KEEP")) {
      await db.slaEvent.update({
        where: { id: existing.slaEventId },
        data: { resolution: effect === "EXCLUDE" ? "excluded" : "kept" },
      }).catch(() => {});
      incidentUpdated = true;
      // Keep the period counter consistent without waiting for the next
      // evaluation pass: an excluded event reduces the breach count by one.
      if (effect === "EXCLUDE") {
        await db.slaIncidentCounter.updateMany({
          where: { counselorId: existing.counselorId, period: existing.period, slaBreaches: { gt: 0 } },
          data: {
            slaBreaches: { decrement: 1 },
            validExclusions: { increment: 1 },
          },
        }).catch(() => {});
      }
    }

    // §155 — coaching task on request.
    let coachingTaskId: string | null = null;
    if (createCoachingTask === true) {
      const task = await db.counselorTask.create({
        data: {
          employeeId: existing.counselorId,
          title: `SLA coaching follow-up — justification ${id.slice(-6)} (${decision})`,
          description:
            `Manager review of SLA justification ${id}: ${decision}. ` +
            (reviewNotes ? `Notes: ${reviewNotes}. ` : "") +
            "Coaching task created per review workflow (§155).",
          type: "sla_coaching",
          priority: "medium",
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }).catch(() => null);
      coachingTaskId = task?.id ?? null;
    }

    await db.portalAuditLog.create({
      data: {
        actorUserId: reviewedBy,
        action: "SLA_JUSTIFICATION_REVIEWED",
        entityType: "SlaJustification",
        entityId: id,
        metadata: JSON.stringify({ decision, incidentEffect: effect, actorRole: auth.roles.join(",") }),
      },
    });

    return NextResponse.json({
      justification: updated,
      reviewed: true,
      incidentUpdated,
      coachingTaskId,
    }, { headers: NO_STORE });
  } catch (error: any) {
    console.error("[sla-justification-review] failed", error?.message || "unknown error");
    return NextResponse.json({ success: false, error: "Justification review could not be completed." }, { status: 503, headers: NO_STORE });
  }
});
