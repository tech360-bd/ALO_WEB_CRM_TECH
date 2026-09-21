import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// PATCH /api/reviews/[id]
// Marketing/Super Admin moderates a review: APPROVE | REJECT | PUBLISH | UNPUBLISH
// Body: { action, notes, performedBy }
async function moderateReview(req: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context!.params;
  const body = await req.json();
  const { action, notes } = body as { action: string; notes?: string };

  const role = (auth.userType || auth.roles[0] || '').toUpperCase();
  if (!['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Review moderation access required' }, { status: 403 });
  }
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
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

  const userId = auth.userId;

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

export const PATCH = withAuth(moderateReview, {
  requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'MARKETING_MANAGER'],
});
