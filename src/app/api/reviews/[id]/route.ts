import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/reviews/[id]
// Marketing/Super Admin moderates a review: APPROVE | REJECT | PUBLISH | UNPUBLISH
// Body: { action, notes, performedBy }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, notes, performedBy } = body as { action: string; notes?: string; performedBy: string };

  if (!action || !performedBy) {
    return NextResponse.json({ error: "action and performedBy are required" }, { status: 400 });
  }

  const review = await db.studentReview.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const validActions = ["APPROVE", "REJECT", "PUBLISH", "UNPUBLISH", "MARK_VERIFIED"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }, { status: 400 });
  }

  // If publishing, check consent
  if (action === "PUBLISH" && !review.consentPublish) {
    return NextResponse.json({
      error: "Cannot publish — student did not consent to website publication. The review can only be used internally.",
    }, { status: 400 });
  }

  let moderationStatus = review.moderationStatus;
  let publicationStatus = review.publicationStatus;
  let publishedAt = review.publishedAt;
  let unpublishedAt = review.unpublishedAt;

  if (action === "APPROVE") {
    moderationStatus = "APPROVED";
  } else if (action === "REJECT") {
    moderationStatus = "REJECTED";
  } else if (action === "PUBLISH") {
    moderationStatus = "APPROVED";
    publicationStatus = "PUBLISHED";
    publishedAt = new Date();
  } else if (action === "UNPUBLISH") {
    publicationStatus = "UNPUBLISHED";
    unpublishedAt = new Date();
  } else if (action === "MARK_VERIFIED") {
    moderationStatus = "APPROVED";
    publicationStatus = "PUBLISHED";
    publishedAt = new Date();
  }

  // Resolve performedBy to a valid User.id
  let userId = performedBy;
  if (performedBy.includes("@")) {
    const user = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    if (user) userId = user.id;
    else userId = "system";
  }

  const updated = await db.studentReview.update({
    where: { id },
    data: {
      moderationStatus,
      publicationStatus,
      publishedAt,
      unpublishedAt,
      moderatedBy: userId,
      moderatedAt: new Date(),
      moderationNotes: notes,
      isVerifiedStudent: action === "MARK_VERIFIED" ? true : review.isVerifiedStudent,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: !userId || userId === "system" ? "" : userId,
      action: `REVIEW_${action}`,
      resource: "StudentReview",
      resourceId: review.id,
      details: JSON.stringify({ moderationStatus, publicationStatus, notes }),
    },
  });

  return NextResponse.json({
    review: updated,
    message: `Review ${action.toLowerCase()}d successfully.`,
  });
}
