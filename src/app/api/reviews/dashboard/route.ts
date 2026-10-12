import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews/dashboard
// Marketing Manager review dashboard summary.
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "30d";
  const since = new Date();
  if (period === "7d") since.setDate(since.getDate() - 7);
  else if (period === "30d") since.setDate(since.getDate() - 30);
  else if (period === "90d") since.setDate(since.getDate() - 90);
  else since.setFullYear(since.getFullYear() - 1);

  const [
    totalReviews,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    needsReviewReviews,
    publishedReviews,
    totalInvitations,
    openedInvitations,
    submittedInvitations,
    expiredInvitations,
    googleClicks,
    facebookClicks,
  ] = await Promise.all([
    db.studentReview.count(),
    db.studentReview.count({ where: { moderationStatus: "PENDING" } }),
    db.studentReview.count({ where: { moderationStatus: "APPROVED" } }),
    db.studentReview.count({ where: { moderationStatus: "REJECTED" } }),
    db.studentReview.count({ where: { moderationStatus: "NEEDS_REVIEW" } }),
    db.studentReview.count({ where: { publicationStatus: "PUBLISHED" } }),
    db.reviewInvitation.count(),
    db.reviewInvitation.count({ where: { status: "OPENED" } }),
    db.reviewInvitation.count({ where: { status: "SUBMITTED" } }),
    db.reviewInvitation.count({ where: { status: "EXPIRED" } }),
    db.studentReview.count({ where: { googleSubmitted: true } }),
    db.studentReview.count({ where: { facebookSubmitted: true } }),
  ]);

  // Average rating
  const ratingAgg = await db.studentReview.aggregate({ _avg: { rating: true } });
  const avgRating = ratingAgg._avg.rating || 0;

  // Rating distribution
  const ratingDistribution = await db.studentReview.groupBy({
    by: ["rating"],
    _count: { id: true },
    orderBy: { rating: "asc" },
  });

  // Reviews by country
  const byCountry = await db.studentReview.groupBy({
    by: ["country"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  // Reviews by service type
  const byServiceType = await db.studentReview.groupBy({
    by: ["serviceType"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  // Sentiment distribution
  const bySentiment = await db.studentReview.groupBy({
    by: ["aiSentiment"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  // Recent reviews (for the moderation queue)
  const recentReviews = await db.studentReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, studentName: true, country: true, serviceType: true,
      rating: true, reviewText: true,
      consentPublish: true, consentMarketing: true, consentShowName: true,
      aiSpamScore: true, aiFlags: true, aiSentiment: true,
      moderationStatus: true, publicationStatus: true,
      googleSubmitted: true, facebookSubmitted: true,
      isVerifiedStudent: true, createdAt: true,
    },
  });

  return NextResponse.json({
    summary: {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      pending: pendingReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      needsReview: needsReviewReviews,
      published: publishedReviews,
      totalInvitations,
      openedInvitations,
      submittedInvitations,
      expiredInvitations,
      googleClicks,
      facebookClicks,
      responseRate: totalInvitations > 0 ? Math.round((submittedInvitations / totalInvitations) * 100) : 0,
    },
    ratingDistribution: ratingDistribution.map((r) => ({ rating: r.rating, count: r._count.id })),
    byCountry: byCountry.map((c) => ({ country: c.country || "unknown", count: c._count.id })),
    byServiceType: byServiceType.map((s) => ({ serviceType: s.serviceType || "unknown", count: s._count.id })),
    bySentiment: bySentiment.map((s) => ({ sentiment: s.aiSentiment || "unknown", count: s._count.id })),
    recentReviews,
  });
}
