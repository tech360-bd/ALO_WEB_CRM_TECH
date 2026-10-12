import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMonitoringAdmin, requireMonitoringViewer } from "@/lib/university-monitoring-auth";
import { syncApprovedChange } from "@/lib/university-monitoring-sync";

// GET /api/university-monitoring/changes/[id]
// Returns full detail for a single change record (for the compare dialog).
// Staff-only: the record may contain an unapproved, unverified detected value.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const change = await db.dataChange.findUnique({
    where: { id },
    include: {
      source: true,
      values: true,
      approvals: { orderBy: { performedAt: "desc" } },
    },
  });
  if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });

  // Also fetch the previous snapshot for this source (for compare view)
  const previousSnapshots = await db.sourceSnapshot.findMany({
    where: { sourceId: change.sourceId },
    orderBy: { capturedAt: "desc" },
    take: 3,
    select: { id: true, capturedAt: true, contentHash: true, aiSummary: true, aiKeyFacts: true, httpStatus: true, title: true },
  });

  // History of this field for this entity (all changes ever recorded)
  const history = await db.dataChange.findMany({
    where: {
      entityType: change.entityType,
      universitySlug: change.universitySlug,
      courseSlug: change.courseSlug,
      fieldName: change.fieldName,
    },
    orderBy: { detectedAt: "desc" },
    take: 20,
    select: {
      id: true, detectedAt: true, oldValue: true, newValue: true,
      status: true, impactLevel: true, sourceUrl: true,
      reviewedBy: true, reviewedAt: true, appliedAt: true,
    },
  });

  return NextResponse.json({ change, previousSnapshots, history });
}

// PATCH /api/university-monitoring/changes/[id]
// Super Admin action: APPROVE | REJECT | REQUEST_RECHECK | MARK_VERIFIED
// Body: { action, notes? }
//
// SECURITY: the acting user is taken from the authenticated session, NOT from
// the request body. Previously this route was unauthenticated and trusted a
// client-supplied `performedBy`, so any anonymous caller could approve a change
// into the production database and have it audit-logged as the Super Admin.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  const actor = guard.actor;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, notes } = body as { action?: string; notes?: string };

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const change = await db.dataChange.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });

  const validActions = ["APPROVE", "REJECT", "REQUEST_RECHECK", "MARK_VERIFIED"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }, { status: 400 });
  }

  // Terminal states must not be silently re-approved/re-rejected.
  if ((change.status === "APPROVED" || change.status === "REJECTED") && action !== "REQUEST_RECHECK") {
    return NextResponse.json(
      { error: `Change is already ${change.status} and cannot be ${action.toLowerCase()}d again.` },
      { status: 409 },
    );
  }

  // Authenticated session identity — always a real User.id.
  const userId = actor.userId;

  // Use a transaction so the change status, audit log, and queue update are atomic
  const result = await db.$transaction(async (tx) => {
    // 1. Create the audit action record
    const approval = await tx.approvalAction.create({
      data: {
        changeId: id,
        action,
        performedBy: userId,
        performedAt: new Date(),
        notes: notes || null,
        metadata: JSON.stringify({
          source: "super-admin-ui",
          timestamp: new Date().toISOString(),
          actorEmail: actor.email,
          actorUserType: actor.userType,
        }),
      },
    });

    // 2. Update the change status based on the action
    let newStatus = change.status;
    let appliedAt: Date | null = null;
    let appliedBy: string | null = null;

    if (action === "APPROVE") {
      newStatus = "APPROVED";
      appliedAt = new Date();
      appliedBy = userId;
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "REQUEST_RECHECK") {
      newStatus = "RECHECK_REQUESTED";
    } else if (action === "MARK_VERIFIED") {
      newStatus = "APPROVED";
      appliedAt = new Date();
      appliedBy = userId;
    }

    const updated = await tx.dataChange.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        appliedAt,
        appliedBy,
      },
    });

    // 3. Update the approval queue item
    let queueStatus = "PENDING";
    if (action === "APPROVE" || action === "MARK_VERIFIED") queueStatus = "APPROVED";
    else if (action === "REJECT") queueStatus = "REJECTED";
    else if (action === "REQUEST_RECHECK") queueStatus = "RECHECK_REQUESTED";

    await tx.approvalQueueItem.updateMany({
      where: { changeId: id },
      data: { status: queueStatus, resolvedAt: new Date() },
    });

    // 4. If APPROVE — apply the change to production data and audit-log it
    if (action === "APPROVE" || action === "MARK_VERIFIED") {
      // Historical versioning FIRST: capture the pre-change value so the old
      // value is never destroyed (spec: "Never destroy the old value").
      await recordHistory(tx, updated, userId, approval.id);
      await applyChangeToProduction(tx, updated);
      // Audit log entry — use userId (resolved to a valid User.id, or null for "system")
      await tx.auditLog.create({
        data: {
          userId: !userId || userId === "system" ? "" : userId,
          action: updated.entityType === "UNIVERSITY" ? "UNIVERSITY_DATA_APPROVED" : "COURSE_DATA_APPROVED",
          resource: updated.entityType,
          resourceId: updated.universitySlug || updated.courseSlug || updated.id,
          details: JSON.stringify({
            changeId: updated.id,
            changeType: updated.changeType,
            fieldName: updated.fieldName,
            oldValue: updated.oldValue,
            newValue: updated.newValue,
            source: updated.sourceUrl,
            approvalId: approval.id,
          }),
        },
      });
    }

    return { updated, approval };
  });

  // 5. Post-commit CRM / public-website / Knowledge Center synchronisation.
  //    Runs after the transaction so caches are never invalidated for a write
  //    that then rolled back.
  let sync: Awaited<ReturnType<typeof syncApprovedChange>> | null = null;
  if (action === "APPROVE" || action === "MARK_VERIFIED") {
    sync = await syncApprovedChange(result.updated);
  }

  return NextResponse.json({
    change: result.updated,
    approval: result.approval,
    sync,
    message: `Change ${action.toLowerCase()}d successfully${action === "APPROVE" || action === "MARK_VERIFIED" ? " and applied to production" : ""}`,
  });
}

// Capture the CURRENT (pre-change) production value into the append-only
// history tables before the approved change overwrites it. Combined with
// DataChange (which keeps oldValue/newValue/source/detectedAt) this gives the
// searchable, permanent audit trail the spec requires:
//   OLD = 36,000 / NEW = 38,000 / SOURCE = official URL / DETECTED / APPROVED_BY / APPROVED_AT
async function recordHistory(tx: any, change: any, userId: string, approvalId: string) {
  const common = {
    fieldName: change.fieldName,
    oldValue: change.oldValue ?? null,
    newValue: change.newValue ?? null,
    changeId: change.id,
    changeType: change.changeType,
    sourceUrl: change.sourceUrl,
    detectedAt: change.detectedAt,
    approvedBy: userId,
    approvedAt: new Date(),
    approvalId,
  };

  if (change.entityType === "UNIVERSITY" && change.universitySlug) {
    await tx.universityHistory.create({ data: { universitySlug: change.universitySlug, ...common } });
  } else if (change.entityType === "COURSE" && change.courseSlug) {
    await tx.courseHistory.create({
      data: { courseSlug: change.courseSlug, universitySlug: change.universitySlug ?? null, ...common },
    });
  } else if (change.entityType === "SCHOLARSHIP") {
    await tx.scholarshipHistory.create({
      data: {
        scholarshipSlug: change.courseSlug || change.universitySlug || change.id,
        universitySlug: change.universitySlug ?? null,
        ...common,
      },
    });
  }
}

// Apply an approved change to the production database.
// This is the ONLY place where approved changes mutate UniversityPage / CoursePage.
//
// Phase 1 (2026-10-12): approving ONE field change must not mark the WHOLE
// record VERIFIED. The record's verificationStatus is left as it was; the
// approved field value, its source URL and the approver are kept in the
// University/Course history written by recordHistory().
// Phase 1 review (P1-D): lastVerifiedAt is a RECORD-level claim, so a
// single-field approval no longer refreshes it either; the field-level check
// date lives in the history row. An unmapped field writes nothing.
async function applyChangeToProduction(tx: any, change: any) {
  if (change.entityType === "UNIVERSITY" && change.universitySlug) {
    const data: any = {};
    // Map fieldName to the UniversityPage column
    if (change.fieldName === "overview") data.overview = change.newValue || "";
    else if (change.fieldName === "city") data.city = change.newValue || "";
    else if (change.fieldName === "sourceUrl") data.sourceUrl = change.newValue;
    else if (change.fieldName === "tuition") data.tuition = change.newValue || "{}";
    else if (change.fieldName === "entryRequirements") data.entryRequirements = change.newValue || "{}";
    else if (change.fieldName === "quickFacts") data.quickFacts = change.newValue || "{}";
    else if (change.fieldName === "strengths") data.strengths = change.newValue || "[]";
    else if (change.fieldName === "applicationSteps") data.applicationSteps = change.newValue || "[]";
    else if (change.fieldName === "documents") data.documents = change.newValue || "[]";
    else if (change.fieldName === "faqs") data.faqs = change.newValue || "[]";
    if (Object.keys(data).length) await tx.universityPage.update({ where: { slug: change.universitySlug }, data });
  } else if (change.entityType === "COURSE" && change.courseSlug) {
    const data: any = {};
    if (change.fieldName === "tuition") data.tuition = change.newValue || "";
    else if (change.fieldName === "intake") data.intake = change.newValue || "";
    else if (change.fieldName === "deadline") data.deadline = change.newValue;
    else if (change.fieldName === "englishRequirement") data.englishRequirement = change.newValue || "";
    else if (change.fieldName === "academicRequirement") data.academicRequirement = change.newValue || "";
    else if (change.fieldName === "duration") data.duration = change.newValue || "";
    else if (change.fieldName === "overview") data.overview = change.newValue || "";
    else if (change.fieldName === "modules") data.modules = change.newValue || "[]";
    else if (change.fieldName === "careerOutcomes") data.careerOutcomes = change.newValue || "[]";
    else if (change.fieldName === "scholarship") data.scholarship = change.newValue;
    else if (change.fieldName === "name") data.name = change.newValue || "";
    else if (change.fieldName === "level") data.level = change.newValue || "";
    else if (change.fieldName === "subject") data.subject = change.newValue || "";
    if (Object.keys(data).length) await tx.coursePage.update({ where: { slug: change.courseSlug }, data });
  }
}
