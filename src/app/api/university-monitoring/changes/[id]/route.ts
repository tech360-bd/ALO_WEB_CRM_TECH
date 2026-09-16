import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/changes/[id]
// Returns full detail for a single change record (for the compare dialog).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
// Body: { action, notes?, performedBy }  — performedBy is the user ID or email
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, notes, performedBy } = body as { action: string; notes?: string; performedBy: string };

  if (!action || !performedBy) {
    return NextResponse.json({ error: "action and performedBy are required" }, { status: 400 });
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

  // Resolve performedBy to a valid User.id (it may be an email or a user ID)
  let userId = performedBy;
  if (performedBy.includes("@")) {
    const user = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    if (user) userId = user.id;
    else userId = "system"; // fallback — AuditLog.userId is optional
  }

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
        metadata: JSON.stringify({ source: "super-admin-ui", timestamp: new Date().toISOString() }),
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

  return NextResponse.json({
    change: result.updated,
    approval: result.approval,
    message: `Change ${action.toLowerCase()}d successfully${action === "APPROVE" || action === "MARK_VERIFIED" ? " and applied to production" : ""}`,
  });
}

// Apply an approved change to the production database.
// This is the ONLY place where approved changes mutate UniversityPage / CoursePage.
async function applyChangeToProduction(tx: any, change: any) {
  if (change.entityType === "UNIVERSITY" && change.universitySlug) {
    const data: any = { lastVerifiedAt: new Date(), verificationStatus: "VERIFIED" };
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
    await tx.universityPage.update({ where: { slug: change.universitySlug }, data });
  } else if (change.entityType === "COURSE" && change.courseSlug) {
    const data: any = { lastVerifiedAt: new Date(), verificationStatus: "VERIFIED" };
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
    await tx.coursePage.update({ where: { slug: change.courseSlug }, data });
  }
}
