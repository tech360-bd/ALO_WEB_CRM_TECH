import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST /api/reviews/invitation
// Marketing/Super Admin creates a review invitation for a student.
// Generates a secure token for /review/{token}. Optionally includes
// Google and Facebook review links (official URLs only — never fabricated).
//
// Body: { studentName, studentEmail?, studentPhone?, studentId?, counselorId?,
//         country?, serviceType?, googleReviewUrl?, facebookRecommendUrl?,
//         campaignId?, expiresDays?, createdBy }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    studentName, studentEmail, studentPhone, studentId, counselorId,
    country, serviceType, googleReviewUrl, facebookRecommendUrl,
    campaignId, expiresDays, createdBy,
  } = body;

  if (!studentName) {
    return NextResponse.json({ error: "studentName is required" }, { status: 400 });
  }

  // Generate a secure random token (32 bytes = 64 hex chars)
  const token = crypto.randomBytes(32).toString("hex");

  // Expiry (default 30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiresDays || 30));

  const invitation = await db.reviewInvitation.create({
    data: {
      token,
      studentId,
      studentName,
      studentEmail,
      studentPhone,
      counselorId,
      country,
      serviceType,
      googleReviewUrl, // official Google review link (e.g., Google Business Profile URL)
      facebookRecommendUrl, // official Facebook page recommendation link
      campaignId,
      expiresAt,
    },
  });

  // Resolve createdBy to a valid User.id (it may be an email or user ID)
  let userId = createdBy;
  if (createdBy && createdBy.includes("@")) {
    const user = await db.user.findFirst({ where: { email: createdBy.toLowerCase() }, select: { id: true } });
    if (user) userId = user.id;
    else userId = "system";
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: userId === "system" ? null : userId,
      action: "REVIEW_INVITATION_SENT",
      resource: "ReviewInvitation",
      resourceId: invitation.id,
      details: JSON.stringify({ studentName, country, serviceType, expiresAt }),
    },
  });

  return NextResponse.json({
    invitation,
    reviewUrl: `/review/${token}`,
    message: "Review invitation created. Share the link with the student.",
  }, { status: 201 });
}

// GET /api/reviews/invitation
// Lists all review invitations (for the Marketing dashboard).
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "ALL";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (status !== "ALL") where.status = status;

  const invitations = await db.reviewInvitation.findMany({
    where,
    orderBy: { sentAt: "desc" },
    take: limit,
  });

  // Also fetch the linked reviews (if any) for display
  const reviewIds = invitations.filter((i) => i.reviewId).map((i) => i.reviewId!);
  const reviews = reviewIds.length > 0
    ? await db.studentReview.findMany({ where: { id: { in: reviewIds } }, select: { id: true, rating: true, moderationStatus: true, publicationStatus: true } })
    : [];
  const reviewMap = new Map(reviews.map((r) => [r.id, r]));

  const invitationsWithReviews = invitations.map((i) => ({
    ...i,
    review: i.reviewId ? reviewMap.get(i.reviewId) || null : null,
  }));

  return NextResponse.json({ invitations: invitationsWithReviews });
}
