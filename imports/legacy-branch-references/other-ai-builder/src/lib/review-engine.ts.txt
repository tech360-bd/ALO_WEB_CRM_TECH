/**
 * Review Engine
 *
 * Manages the post-service student review lifecycle:
 *   1. createReviewRequest   — invite a student to review ALO
 *   2. submitFeedback        — capture the student's rating + text + consents
 *   3. requestGoogleReview   — offer the optional Google review path
 *   4. getReviewStats        — aggregate metrics for the dashboard
 *
 * HARD RULE: incentivized = false ALWAYS.
 *   - No rewards, discounts, vouchers, or any other compensation may be
 *     offered in exchange for a review or for a positive rating.
 *   - Reviews must be genuine, voluntary, and uncompensated.
 *   - This rule is enforced by omitting any "incentive" field entirely
 *     from the data model and from every API surface in this module.
 */

import { db } from "@/lib/db";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────

export type ReviewServiceType =
  | "ADMISSIONS"
  | "VISA"
  | "ENGLISH_TEST"
  | "SOP"
  | "GENERAL";

export interface CreateReviewRequestInput {
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  counselorId?: string;
  serviceType?: ReviewServiceType;
  country?: string;
  campaignId?: string;
  expiresInDays?: number;
}

export interface ReviewRequestResult {
  requestId: string;
  token: string;
  publicUrl: string;
  expiresAt: Date;
  incentivized: false; // ALWAYS false — encoded in the type
}

export interface SubmitFeedbackInput {
  rating: number; // 1-5
  text: string;
  consentPublish?: boolean;
  consentMarketing?: boolean;
  consentShowName?: boolean;
  consentIp?: string;
  counselorName?: string;
  studentEmail?: string;
}

export interface ReviewStats {
  totalRequests: number;
  submitted: number;
  pending: number;
  expired: number;
  revoked: number;
  responseRate: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // {1: n, 2: n, ...}
  googleSubmittedCount: number;
  moderationPending: number;
  moderationApproved: number;
}

// ─── createReviewRequest ─────────────────────────────────────────

/**
 * Create a review request (ReviewInvitation) for a student.
 *
 * Generates a secure random token used in the public review URL
 * (/review/{token}). The invitation expires after `expiresInDays` (default 30).
 *
 * INVARIANT: this function NEVER accepts or stores an `incentivized` flag.
 */
export async function createReviewRequest(
  input: CreateReviewRequestInput
): Promise<ReviewRequestResult> {
  if (!input.studentName) {
    throw new Error("createReviewRequest: studentName is required");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30));

  const invitation = await db.reviewInvitation.create({
    data: {
      token,
      studentId: input.studentId ?? null,
      studentName: input.studentName,
      studentEmail: input.studentEmail ?? null,
      studentPhone: input.studentPhone ?? null,
      counselorId: input.counselorId ?? null,
      country: input.country ?? null,
      serviceType: input.serviceType ?? null,
      campaignId: input.campaignId ?? null,
      status: "SENT",
      sentAt: new Date(),
      expiresAt,
    },
  });

  return {
    requestId: invitation.id,
    token,
    publicUrl: `/review/${token}`,
    expiresAt,
    incentivized: false,
  };
}

// ─── submitFeedback ──────────────────────────────────────────────

/**
 * Submit the student's review feedback for a given review request.
 *
 * Validates:
 *   - The invitation exists and is not expired/revoked.
 *   - rating is 1-5.
 *
 * Side effects:
 *   - Creates a StudentReview record linked to the invitation.
 *   - Marks the invitation status as SUBMITTED.
 *   - Stores explicit consents (publish, marketing, showName). Defaults to false
 *     — consent must be opt-in, never opt-out.
 *
 * NEVER incentivizes: this function does not offer, record, or trigger any
 * reward for the reviewer.
 */
export async function submitFeedback(
  requestId: string,
  feedback: SubmitFeedbackInput
): Promise<{ reviewId: string }> {
  if (!Number.isInteger(feedback.rating) || feedback.rating < 1 || feedback.rating > 5) {
    throw new Error("submitFeedback: rating must be an integer between 1 and 5");
  }
  if (!feedback.text || feedback.text.trim().length < 10) {
    throw new Error("submitFeedback: text must be at least 10 characters");
  }

  const invitation = await db.reviewInvitation.findUnique({ where: { id: requestId } });
  if (!invitation) throw new Error("submitFeedback: review request not found");
  if (invitation.status === "REVOKED") throw new Error("submitFeedback: review request was revoked");
  if (invitation.status === "SUBMITTED") throw new Error("submitFeedback: review request already submitted");
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await db.reviewInvitation.update({ where: { id: requestId }, data: { status: "EXPIRED" } });
    throw new Error("submitFeedback: review request has expired");
  }

  const review = await db.studentReview.create({
    data: {
      invitationId: invitation.id,
      studentId: invitation.studentId,
      studentName: invitation.studentName,
      studentEmail: feedback.studentEmail ?? invitation.studentEmail,
      country: invitation.country,
      counselorName: feedback.counselorName ?? null,
      serviceType: invitation.serviceType,
      rating: feedback.rating,
      reviewText: feedback.text,
      consentPublish: feedback.consentPublish === true, // explicit opt-in
      consentMarketing: feedback.consentMarketing === true,
      consentShowName: feedback.consentShowName === true,
      consentCapturedAt: new Date(),
      consentIp: feedback.consentIp ?? null,
      aiSpamScore: 0,
      aiFlags: "[]",
      moderationStatus: "PENDING",
      publicationStatus: "INTERNAL",
      isVerifiedStudent: !!invitation.studentId,
    },
  });

  await db.reviewInvitation.update({
    where: { id: requestId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      reviewId: review.id,
    },
  });

  return { reviewId: review.id };
}

// ─── requestGoogleReview ─────────────────────────────────────────

/**
 * Mark that the student has been offered (or has clicked through to)
 * the Google review path.
 *
 * The Google review URL is provided by the caller (configured per
 * ALO branch / Google Business Profile). This function records the
 * URL on the invitation AND flips `googleSubmitted=true` on the linked
 * StudentReview (if it exists), so we can track cross-platform submission.
 *
 * NEVER incentivizes the Google review.
 */
export async function requestGoogleReview(
  requestId: string,
  googleReviewUrl: string
): Promise<{ updated: boolean }> {
  if (!googleReviewUrl || !/^https?:\/\//.test(googleReviewUrl)) {
    throw new Error("requestGoogleReview: a valid http(s) googleReviewUrl is required");
  }

  const invitation = await db.reviewInvitation.findUnique({ where: { id: requestId } });
  if (!invitation) throw new Error("requestGoogleReview: review request not found");

  await db.reviewInvitation.update({
    where: { id: requestId },
    data: {
      googleReviewUrl,
      openedAt: invitation.openedAt ?? new Date(),
      status: invitation.status === "SENT" ? "OPENED" : invitation.status,
    },
  });

  if (invitation.reviewId) {
    await db.studentReview.update({
      where: { id: invitation.reviewId },
      data: {
        googleSubmitted: true,
        googleSubmittedAt: new Date(),
      },
    });
  }

  return { updated: true };
}

// ─── getReviewStats ──────────────────────────────────────────────

/**
 * Aggregate review metrics for the dashboard.
 */
export async function getReviewStats(): Promise<ReviewStats> {
  const [
    totalRequests,
    submitted,
    pending,
    expired,
    revoked,
    reviews,
    googleSubmittedCount,
    moderationPending,
    moderationApproved,
  ] = await Promise.all([
    db.reviewInvitation.count(),
    db.reviewInvitation.count({ where: { status: "SUBMITTED" } }),
    db.reviewInvitation.count({ where: { status: { in: ["SENT", "OPENED"] } } }),
    db.reviewInvitation.count({ where: { status: "EXPIRED" } }),
    db.reviewInvitation.count({ where: { status: "REVOKED" } }),
    db.studentReview.findMany({ select: { rating: true } }),
    db.studentReview.count({ where: { googleSubmitted: true } }),
    db.studentReview.count({ where: { moderationStatus: "PENDING" } }),
    db.studentReview.count({ where: { moderationStatus: "APPROVED" } }),
  ]);

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  for (const r of reviews) {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] ?? 0) + 1;
    ratingSum += r.rating;
  }

  const responseRate = totalRequests > 0 ? Math.round((submitted / totalRequests) * 100) : 0;
  const averageRating = reviews.length > 0 ? Math.round((ratingSum / reviews.length) * 10) / 10 : 0;

  return {
    totalRequests,
    submitted,
    pending,
    expired,
    revoked,
    responseRate,
    averageRating,
    ratingDistribution,
    googleSubmittedCount,
    moderationPending,
    moderationApproved,
  };
}
