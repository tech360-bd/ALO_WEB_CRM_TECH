/**
 * POST /api/v1/higher-study/referral/[code]/confirm
 * --------------------------------------------------------------------
 * Server-to-server callback endpoint called by ALO Education when the
 * student has been created / started an application on their side.
 *
 * Headers required:
 *   X-Alaminn-Signature: <HMAC-SHA256 base64url signature of the JSON body>
 *
 * Body: `{ aloStudentId?, status: 'completed' | 'failed', failureReason? }`
 *
 * Verifies the signature using `verifyReferralToken()` (the token was
 * issued by `signReferralToken()` when the referral was created — both
 * sides share `process.env.HIGHER_STUDY_REFERRAL_SECRET`).
 *
 * Updates the HigherStudyReferral record. Returns 200 OK on success.
 *
 * NOTE: This endpoint is INTENTIONALLY unauthenticated (no session
 * cookie) — it's machine-to-machine. The signature is the only auth.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  verifyReferralToken,
} from "@/lib/higher-study/api-helpers";

export const dynamic = "force-dynamic";

interface ConfirmBody {
  aloStudentId?: string;
  status: "completed" | "failed";
  failureReason?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const referralCode = safeString(code);
    if (!referralCode) {
      return jsonResponse(false, "Referral code required.", null, {}, ["code_required"], 400);
    }

    // Read the raw body for signature verification.
    const rawBody = await req.text();
    let body: ConfirmBody;
    try {
      body = JSON.parse(rawBody) as ConfirmBody;
    } catch {
      return jsonResponse(false, "Invalid JSON body.", null, {}, ["invalid_body"], 400);
    }

    if (body.status !== "completed" && body.status !== "failed") {
      return jsonResponse(
        false,
        "status must be 'completed' or 'failed'.",
        null,
        {},
        ["status_invalid"],
        400,
      );
    }

    // Verify the signature. ALO Education should send the signed
    // referral token (the one we returned from POST /referral) in the
    // X-Alaminn-Signature header. We re-verify with our shared secret.
    const signatureHeader = req.headers.get("x-alaminn-signature");
    if (!signatureHeader) {
      return jsonResponse(false, "Missing signature.", null, {}, ["signature_missing"], 401);
    }

    const secret = process.env.HIGHER_STUDY_REFERRAL_SECRET || "alaminn-hs-dev";
    const payload = verifyReferralToken(signatureHeader, secret);
    if (!payload || payload.referralCode !== referralCode) {
      return jsonResponse(false, "Invalid signature.", null, {}, ["signature_invalid"], 401);
    }

    // Look up the referral.
    const referral = await db.higherStudyReferral.findUnique({
      where: { referralCode },
    });
    if (!referral) {
      return jsonResponse(false, "Referral not found.", null, {}, ["not_found"], 404);
    }

    // Apply the status transition.
    const now = new Date();
    if (body.status === "completed") {
      await db.higherStudyReferral.update({
        where: { id: referral.id },
        data: {
          status: "completed",
          completedAt: now,
          failureReason: null,
        },
      });
    } else {
      await db.higherStudyReferral.update({
        where: { id: referral.id },
        data: {
          status: "failed",
          failureReason: safeString(body.failureReason).slice(0, 500) || null,
        },
      });
    }

    // Write an audit log entry.
    try {
      await db.higherStudyAuditLog.create({
        data: {
          action: `referral.${body.status}`,
          entityType: "referral",
          entityId: referral.id,
          entitySlug: referralCode,
          beforeData: JSON.stringify({ status: referral.status }),
          afterData: JSON.stringify({
            status: body.status,
            aloStudentId: body.aloStudentId ?? null,
            failureReason: body.failureReason ?? null,
          }),
        },
      });
    } catch {
      // Non-fatal
    }

    return jsonResponse(true, "Referral updated.", {
      referralCode,
      status: body.status,
    });
  } catch (err) {
    console.error("[higher-study/referral/[code]/confirm] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
