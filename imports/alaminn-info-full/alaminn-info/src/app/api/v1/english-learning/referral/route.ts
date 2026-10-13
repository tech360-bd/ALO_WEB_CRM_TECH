/**
 * POST /api/v1/english-learning/referral
 * --------------------------------------------------------------------
 * Creates an EnglishLearningReferral audit record + builds the ALO
 * Education redirect URL. The frontend will then `window.location.href =
 * targetUrl` to transfer the student to ALO Education's domain — no PII
 * is sent through this endpoint.
 *
 * Body:
 *   {
 *     "referralType": "course-package" | "tutor-booking" | "mock-test-bundle",
 *     "courseSlug"?: "...",
 *     "tutorSlug"?:  "...",
 *     "testSlug"?:   "...",
 *     "level"?:      "...",
 *     "campaignCode"?: "...",
 *     "consentGiven": true,           // MUST be true
 *     "consentVersion"?: "..."
 *   }
 *
 * Returns: { referralCode, targetUrl, referralId, referralToken, expiresAt }
 *
 * Rate limit: 20 req/min per IP.
 */
import type { NextRequest } from "next/server";
import {
  jsonResponse,
  safeString,
  hashIp,
  getDeviceCategory,
} from "@/lib/english-learning/api-helpers";
import { rateLimit } from "@/lib/english-learning/rate-limit";
import { createReferralRecord } from "@/lib/english-learning/integration";
import { REFERRAL_SOURCES } from "@/lib/english-learning/constants";
import type { ReferralType } from "@/lib/english-learning/types";

export const dynamic = "force-dynamic";

const VALID_REFERRAL_TYPES = new Set(
  REFERRAL_SOURCES.map((r) => r.referralType),
);

export async function POST(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.ENGLISH_LEARNING_REFERRAL_SECRET ?? "alaminn-el",
  );
  if (rateLimit(ip, 20)) {
    return jsonResponse(
      false,
      "Too many referral requests. Please slow down.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(
        false,
        "Invalid request body.",
        null,
        {},
        ["invalid_body"],
        400,
      );
    }

    const referralType = safeString(
      (body as Record<string, unknown>).referralType as string,
    ) as ReferralType;
    const consentGiven = (body as Record<string, unknown>).consentGiven === true;
    const consentVersion =
      safeString((body as Record<string, unknown>).consentVersion as string) ||
      "english-learning-consent-v1";
    const campaignCode = safeString(
      (body as Record<string, unknown>).campaignCode as string,
    );
    const sourceEntityId = safeString(
      (body as Record<string, unknown>).sourceEntityId as string,
    );
    const sourceEntityType = safeString(
      (body as Record<string, unknown>).sourceEntityType as string,
    );

    const errors: string[] = [];
    if (!referralType || !VALID_REFERRAL_TYPES.has(referralType)) {
      errors.push("referralType_invalid");
    }
    if (!consentGiven) errors.push("consent_required");
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    const context = {
      courseSlug:
        safeString((body as Record<string, unknown>).courseSlug as string) ||
        undefined,
      tutorSlug:
        safeString((body as Record<string, unknown>).tutorSlug as string) ||
        undefined,
      testSlug:
        safeString((body as Record<string, unknown>).testSlug as string) ||
        undefined,
      level:
        safeString((body as Record<string, unknown>).level as string) ||
        undefined,
      campaignCode: campaignCode || undefined,
    };

    const userAgent = req.headers.get("user-agent");
    const _deviceCategory = getDeviceCategory(userAgent);

    let result;
    try {
      result = await createReferralRecord({
        referralType,
        consentGiven: true,
        consentVersion,
        ipHash: ip,
        userAgent,
        context,
        sourceEntityId: sourceEntityId || null,
        sourceEntityType: sourceEntityType || null,
        campaignCode,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Referral context invalid.";
      return jsonResponse(false, message, null, {}, ["context_invalid"], 400);
    }

    return jsonResponse(
      true,
      "Referral created. Redirect the user to targetUrl to complete the handoff.",
      {
        referralCode: result.referral.referralCode,
        targetUrl: result.referral.targetUrl,
        referralId: result.referral.id,
        referralToken: result.referralToken,
      },
    );
  } catch (err) {
    console.error("[english-learning/referral POST] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
