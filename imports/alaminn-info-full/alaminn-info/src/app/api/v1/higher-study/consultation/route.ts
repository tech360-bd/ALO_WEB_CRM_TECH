/**
 * POST /api/v1/higher-study/consultation
 * --------------------------------------------------------------------
 * Books a free 1:1 Higher Study consultation.
 *
 * Validates the form payload, creates:
 *   1. A MeetingRequest record (status=new)
 *   2. A HigherStudyReferral audit record (referralType=consultation)
 *
 * Returns the meeting reference + a confirmation message. Confirmation
 * email is sent via `sendTransactional` (failure is logged but
 * non-fatal).
 *
 * Rate limit: 5 requests per minute per IP hash (in-memory).
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendTransactional } from "@/lib/email";
import { withObservability } from "@/lib/observability";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import {
  jsonResponse,
  safeString,
  hashIp,
  getDeviceCategory,
} from "@/lib/higher-study/api-helpers";
import { COUNTRIES_MAP } from "@/lib/higher-study/constants";

// ── Rate limit ──────────────────────────────────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ── Validation ──────────────────────────────────────────────────────

const VALID_TOPICS = new Set([
  "university-application",
  "course-selection",
  "scholarship",
  "phd",
  "visa",
  "english-test",
  "other",
]);

const VALID_TIME_SLOTS = new Set([
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "20:00", "20:30", "21:00",
]);

function ipHashFromReq(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return hashIp(ip, process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ── POST handler ────────────────────────────────────────────────────

export const POST = withObservability(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse(false, "Invalid request body.", null, {}, ["invalid_body"], 400);
    }

    // Honeypot — silently succeed (don't reveal it's a honeypot)
    if ((body as Record<string, unknown>).website) {
      return jsonResponse(true, "Consultation request received.", {
        reference: "HS-SPAM-0000",
        requestedDate: new Date().toISOString(),
        requestedTime: "00:00",
      });
    }

    // Rate limit
    const ip = ipHashFromReq(req);
    if (rateLimited(ip)) {
      return jsonResponse(
        false,
        "Too many submissions. Please try again shortly.",
        null,
        {},
        ["rate_limited"],
        429,
      );
    }

    // Extract + validate fields
    const contactName = safeString((body as Record<string, unknown>).contactName as string | null | undefined);
    const contactEmail = normalizeEmail(
      safeString((body as Record<string, unknown>).contactEmail as string | null | undefined),
    );
    const _contactPhone = safeString((body as Record<string, unknown>).contactPhone as string | null | undefined);
    const requestedDateRaw = safeString((body as Record<string, unknown>).requestedDate as string | null | undefined);
    const requestedTime = safeString((body as Record<string, unknown>).requestedTime as string | null | undefined);
    const topic = safeString((body as Record<string, unknown>).topic as string | null | undefined);
    const countrySlug = safeString((body as Record<string, unknown>).countrySlug as string | null | undefined);
    const studyLevel = safeString((body as Record<string, unknown>).studyLevel as string | null | undefined);
    const consentGiven = (body as Record<string, unknown>).consentGiven === true;

    const errors: string[] = [];
    if (!contactName || contactName.length < 2) errors.push("contactName_required");
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.push("contactEmail_invalid");
    }
    if (!requestedDateRaw) errors.push("requestedDate_required");
    else {
      const parsed = new Date(requestedDateRaw);
      if (Number.isNaN(parsed.getTime())) errors.push("requestedDate_invalid");
      else {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const maxFuture = new Date(now);
        maxFuture.setDate(maxFuture.getDate() + 30);
        if (parsed < now || parsed > maxFuture) errors.push("requestedDate_out_of_range");
        // Skip Friday (Bangladesh weekend)
        if (parsed.getDay() === 5) errors.push("requestedDate_weekend");
      }
    }
    if (!requestedTime || !VALID_TIME_SLOTS.has(requestedTime)) {
      errors.push("requestedTime_invalid");
    }
    if (!topic || !VALID_TOPICS.has(topic)) errors.push("topic_invalid");
    if (!consentGiven) errors.push("consent_required");
    // countrySlug is optional but if provided must be valid
    if (countrySlug && !COUNTRIES_MAP[countrySlug]) {
      errors.push("countrySlug_invalid");
    }

    if (errors.length > 0) {
      return jsonResponse(false, "Validation failed.", null, {}, errors, 400);
    }

    const parsedDate = new Date(requestedDateRaw);
    parsedDate.setHours(0, 0, 0, 0);

    // Generate reference numbers
    const meetingRef = `HS-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const referralCode = `CON-${randomBytes(5).toString("hex").toUpperCase()}`;

    // Map Higher Study topic → meetingType enum used by MeetingRequest model
    const meetingTypeMap: Record<string, string> = {
      "university-application": "education",
      "course-selection": "education",
      scholarship: "education",
      phd: "education",
      visa: "education",
      "english-test": "education",
      other: "discovery",
    };
    const meetingType = meetingTypeMap[topic] ?? "discovery";

    // Run both creates in parallel
    const [meeting, referral] = await Promise.all([
      db.meetingRequest.create({
        data: {
          reference: meetingRef,
          meetingType,
          requestedDate: parsedDate,
          requestedTime,
          timezone: "Asia/Dhaka",
          contactName,
          contactEmail,
          topic: `Higher Study Consultation — ${topic.replace(/-/g, " ")}` +
            (countrySlug ? ` (${COUNTRIES_MAP[countrySlug]?.name})` : "") +
            (studyLevel ? ` [${studyLevel}]` : ""),
          status: "new",
          ipHash: ip,
        },
      }),
      db.higherStudyReferral.create({
        data: {
          referralCode,
          source: "ALAMINN_CONSULTATION",
          referralType: "consultation",
          targetUrl: "https://alaminn.info/higher-study/book-consultation",
          countrySlug: countrySlug || null,
          studyLevel: studyLevel || null,
          consentGiven: true,
          consentVersion: "consultation-v1",
          consentTimestamp: new Date(),
          status: "created",
          ipHash: ip,
          deviceCategory: getDeviceCategory(req.headers.get("user-agent")),
        },
      }),
    ]);

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          action: "higher_study.consultation_requested",
          resource: "meeting_request",
          resourceId: meeting.id,
          meta: JSON.stringify({
            reference: meetingRef,
            referralCode,
            topic,
            countrySlug: countrySlug || null,
            studyLevel: studyLevel || null,
          }),
          ipHash: ip,
        },
      });
    } catch {
      // Audit log failure is non-fatal
    }

    // Send confirmation email — failure is logged but doesn't crash
    const scheduledAt = `${parsedDate.toDateString()} ${requestedTime}`;
    await sendTransactional(
      "meetingConfirmation",
      {
        name: contactName,
        meetingType: `Higher Study Consultation (${topic.replace(/-/g, " ")})`,
        scheduledAt,
        durationMin: 30,
        timezone: "Asia/Dhaka",
      },
      {
        to: contactEmail,
        ipHash: ip,
        triggeredBy: "higher_study.consultation_requested",
      },
    ).catch(() => null);

    return jsonResponse(
      true,
      "Consultation request received. Confirmation within 24 hours.",
      {
        reference: meetingRef,
        referralCode,
        id: meeting.id,
        requestedDate: parsedDate.toISOString(),
        requestedTime,
        contactEmail,
        topic,
        countrySlug: countrySlug || null,
        studyLevel: studyLevel || null,
        expectedResponse: "Confirmation within 24 hours with meeting link",
      },
      { referralId: referral.id },
    );
  } catch (e) {
    const errorId = getRequestId() ?? undefined;
    logger.error("higher_study.consultation_failed", { error: e });
    return NextResponse.json(
      {
        success: false,
        message: "Internal error.",
        data: null,
        meta: errorId ? { errorId } : {},
        errors: ["server_error"],
      },
      { status: 500 },
    );
  }
});

export async function GET() {
  return jsonResponse(
    false,
    "Method not allowed. Use POST.",
    null,
    {},
    ["method_not_allowed"],
    405,
  );
}
