/**
 * POST /api/v1/higher-study/referral
 * --------------------------------------------------------------------
 * Creates a HigherStudyReferral audit record + builds the ALO Education
 * redirect URL. The frontend will then `window.location.href = targetUrl`
 * to transfer the student to ALO Education's domain — no PII is sent
 * through this endpoint.
 *
 * Body: `{ referralType, countrySlug?, universitySlug?, courseSlug?,
 *         scholarshipSlug?, researchSlug?, supervisorSlug?, studyLevel?,
 *         intake?, campaignCode?, consentGiven, consentVersion? }`
 *
 * Validates:
 *   - consentGiven must be true
 *   - referralType must be one of REFERRAL_SOURCES[*].referralType
 *
 * Calls:
 *   - createReferralRecord() from integration.ts
 *   - buildAloEducationReferralUrl() (inside createReferralRecord)
 *
 * Returns: `{ referralCode, targetUrl, referralId }`
 *
 * Rate limit: 20 req/min per IP.
 */
import type { NextRequest } from "next/server";
import {
  jsonResponse,
  safeString,
  hashIp,
  getDeviceCategory,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";
import { createReferralRecord } from "@/lib/higher-study/integration";
import { REFERRAL_SOURCES } from "@/lib/higher-study/constants";
import type { ReferralType } from "@/lib/higher-study/types";

export const dynamic = "force-dynamic";

const VALID_REFERRAL_TYPES = new Set(
  REFERRAL_SOURCES.map((r) => r.referralType),
);

export async function POST(req: NextRequest) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs",
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
      return jsonResponse(false, "Invalid request body.", null, {}, ["invalid_body"], 400);
    }

    const referralType = safeString(
      (body as Record<string, unknown>).referralType as string,
    ) as ReferralType;
    const consentGiven = (body as Record<string, unknown>).consentGiven === true;
    const consentVersion = safeString(
      (body as Record<string, unknown>).consentVersion as string,
    ) || "higher-study-consent-v1";
    const campaignCode = safeString(
      (body as Record<string, unknown>).campaignCode as string,
    ) || undefined;

    const errors: string[] = [];
    if (!referralType || !VALID_REFERRAL_TYPES.has(referralType)) {
      errors.push("referralType_invalid");
    }
    if (!consentGiven) errors.push("consent_required");
    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    // Extract safe public context — validate against the allow-list
    // inside `validateReferralContext` (called by createReferralRecord).
    const context = {
      countrySlug: safeString((body as Record<string, unknown>).countrySlug as string) || undefined,
      universitySlug: safeString((body as Record<string, unknown>).universitySlug as string) || undefined,
      courseSlug: safeString((body as Record<string, unknown>).courseSlug as string) || undefined,
      scholarshipSlug: safeString((body as Record<string, unknown>).scholarshipSlug as string) || undefined,
      researchSlug: safeString((body as Record<string, unknown>).researchSlug as string) || undefined,
      supervisorSlug: safeString((body as Record<string, unknown>).supervisorSlug as string) || undefined,
      studyLevel: safeString((body as Record<string, unknown>).studyLevel as string) || undefined,
      intake: safeString((body as Record<string, unknown>).intake as string) || undefined,
      campaignCode: campaignCode || undefined,
    };

    const userAgent = req.headers.get("user-agent");
    const deviceCategory = getDeviceCategory(userAgent);

    let result;
    try {
      result = await createReferralRecord({
        referralType,
        consentGiven: true,
        consentVersion,
        ipHash: ip,
        deviceCategory,
        userAgent,
        context,
        campaignCode,
      });
    } catch (err) {
      // validateReferralContext throws if any forbidden (PII) key
      // was passed — surface that as a 400 instead of a 500.
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
        expiresAt: result.referral.expiresAt,
      },
    );
  } catch (err) {
    console.error("[higher-study/referral POST] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
