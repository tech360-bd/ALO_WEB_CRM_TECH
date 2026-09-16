/**
 * Review Engine
 *
 * Manages the post-service review request lifecycle for students:
 *   1. createReviewRequest  — counselor asks the student for a review
 *   2. submitFeedback       — student submits a rating + free-text
 *   3. requestGoogleReview  — asks the student to also leave a public Google review
 *   4. markReviewCompleted  — final close-out when the Google review is confirmed
 *   5. getReviewStats       — aggregate metrics for dashboards
 *
 * CRITICAL POLICY: incentivized reviews are NEVER enabled. The `incentivized`
 * field on ReviewRequest is forced to false at creation, regardless of input.
 */

import { db } from "@/lib/db";

export type ServiceType =
  | "ADMISSION"
  | "VISA"
  | "ENGLISH_TEST"
  | "MOCK_TEST"
  | "COUNSELING"
  | "SCHOLARSHIP"
  | "ACCOMMODATION"
  | "GENERAL";

export interface CreateReviewRequestParams {
  studentId: string;       // Student.id (db id) — required
  serviceType: ServiceType | string;
  country?: string;
  studentName?: string;    // optional override (looked up from Student if absent)
  studentEmail?: string;
  studentPhone?: string;
  requestedById?: string;  // User.id of the counselor/staff who requested
}

export interface ReviewRequestResult {
  id: string;
  studentId: string;
  studentName: string;
  serviceType: string;
  country?: string;
  status: string;
  incentivized: boolean; // always false
  createdAt: Date;
}

export async function createReviewRequest(
  params: CreateReviewRequestParams
): Promise<ReviewRequestResult> {
  if (!params.studentId) throw new Error("studentId is required");
  if (!params.serviceType) throw new Error("serviceType is required");

  // Look up student for name/email/phone if not provided
  const student = await db.student.findUnique({ where: { id: params.studentId } });
  if (!student) throw new Error("Student not found");

  const studentName = params.studentName || student.name;
  const studentEmail = params.studentEmail || student.email;
  const studentPhone = params.studentPhone || student.phone || undefined;

  // CRITICAL: incentivized is ALWAYS false. We hardcode this to prevent any
  // caller from accidentally enabling an incentivized review (which would
  // violate Google's review policies and ALO Education's compliance stance).
  const created = await db.reviewRequest.create({
    data: {
      studentId: params.studentId,
      studentName,
      studentEmail,
      studentPhone,
      serviceType: params.serviceType,
      country: params.country || null,
      status: "PENDING",
      incentivized: false,
    },
  });

  // Audit trail
  await db.auditLog.create({
    data: {
      userId: params.requestedById || "",
      action: "REVIEW_REQUESTED",
      resource: "ReviewRequest",
      resourceId: created.id,
      details: JSON.stringify({
        studentId: params.studentId,
        serviceType: params.serviceType,
        country: params.country || null,
        incentivized: false,
      }),
    },
  }).catch(() => {});

  return {
    id: created.id,
    studentId: created.studentId,
    studentName: created.studentName,
    serviceType: created.serviceType,
    country: created.country || undefined,
    status: created.status,
    incentivized: created.incentivized,
    createdAt: created.createdAt,
  };
}

export interface SubmitFeedbackParams {
  rating: number;  // 1-5
  text?: string;
}

export async function submitFeedback(
  requestId: string,
  params: SubmitFeedbackParams
): Promise<ReviewRequestResult> {
  if (!requestId) throw new Error("requestId is required");
  if (typeof params.rating !== "number" || params.rating < 1 || params.rating > 5) {
    throw new Error("rating must be a number between 1 and 5");
  }

  const existing = await db.reviewRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new Error("Review request not found");

  const updated = await db.reviewRequest.update({
    where: { id: requestId },
    data: {
      feedbackRating: params.rating,
      feedbackText: params.text || null,
      status: "FEEDBACK_RECEIVED",
    },
  });

  await db.auditLog.create({
    data: {
      action: "REVIEW_FEEDBACK_SUBMITTED",
      resource: "ReviewRequest",
      resourceId: requestId,
      details: JSON.stringify({ rating: params.rating, textLength: (params.text || "").length }),
    },
  }).catch(() => {});

  return {
    id: updated.id,
    studentId: updated.studentId,
    studentName: updated.studentName,
    serviceType: updated.serviceType,
    country: updated.country || undefined,
    status: updated.status,
    incentivized: updated.incentivized,
    createdAt: updated.createdAt,
  };
}

export async function requestGoogleReview(
  requestId: string,
  googleReviewUrl: string
): Promise<ReviewRequestResult> {
  if (!requestId) throw new Error("requestId is required");
  if (!googleReviewUrl) throw new Error("googleReviewUrl is required");

  const existing = await db.reviewRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new Error("Review request not found");

  const updated = await db.reviewRequest.update({
    where: { id: requestId },
    data: {
      googleReviewUrl,
      reviewRequestedAt: new Date(),
      status: existing.status === "FEEDBACK_RECEIVED" ? "GOOGLE_REVIEW_REQUESTED" : existing.status,
    },
  });

  await db.auditLog.create({
    data: {
      action: "REVIEW_GOOGLE_REQUESTED",
      resource: "ReviewRequest",
      resourceId: requestId,
      details: JSON.stringify({ googleReviewUrl }),
    },
  }).catch(() => {});

  return {
    id: updated.id,
    studentId: updated.studentId,
    studentName: updated.studentName,
    serviceType: updated.serviceType,
    country: updated.country || undefined,
    status: updated.status,
    incentivized: updated.incentivized,
    createdAt: updated.createdAt,
  };
}

export async function markReviewCompleted(
  requestId: string
): Promise<ReviewRequestResult> {
  if (!requestId) throw new Error("requestId is required");

  const existing = await db.reviewRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new Error("Review request not found");

  const updated = await db.reviewRequest.update({
    where: { id: requestId },
    data: {
      reviewCompletedAt: new Date(),
      status: "COMPLETED",
    },
  });

  await db.auditLog.create({
    data: {
      action: "REVIEW_COMPLETED",
      resource: "ReviewRequest",
      resourceId: requestId,
      details: JSON.stringify({ status: "COMPLETED" }),
    },
  }).catch(() => {});

  return {
    id: updated.id,
    studentId: updated.studentId,
    studentName: updated.studentName,
    serviceType: updated.serviceType,
    country: updated.country || undefined,
    status: updated.status,
    incentivized: updated.incentivized,
    createdAt: updated.createdAt,
  };
}

export interface ReviewStats {
  total: number;
  pending: number;
  feedbackReceived: number;
  googleReviewRequested: number;
  completed: number;
  averageRating: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  byServiceType: Record<string, number>;
  incentivizedCount: number; // should ALWAYS be 0
}

export async function getReviewStats(): Promise<ReviewStats> {
  const requests = await db.reviewRequest.findMany({
    select: {
      id: true,
      status: true,
      feedbackRating: true,
      serviceType: true,
      incentivized: true,
    },
  });

  const stats: ReviewStats = {
    total: requests.length,
    pending: 0,
    feedbackReceived: 0,
    googleReviewRequested: 0,
    completed: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    byServiceType: {},
    incentivizedCount: 0,
  };

  let ratingSum = 0;
  let ratingCount = 0;

  for (const r of requests) {
    if (r.status === "PENDING") stats.pending += 1;
    else if (r.status === "FEEDBACK_RECEIVED") stats.feedbackReceived += 1;
    else if (r.status === "GOOGLE_REVIEW_REQUESTED") stats.googleReviewRequested += 1;
    else if (r.status === "COMPLETED") stats.completed += 1;

    if (r.incentivized) stats.incentivizedCount += 1;

    if (typeof r.feedbackRating === "number" && r.feedbackRating >= 1 && r.feedbackRating <= 5) {
      stats.ratingDistribution[r.feedbackRating as 1 | 2 | 3 | 4 | 5] += 1;
      ratingSum += r.feedbackRating;
      ratingCount += 1;
    }

    stats.byServiceType[r.serviceType] = (stats.byServiceType[r.serviceType] || 0) + 1;
  }

  stats.averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

  return stats;
}
