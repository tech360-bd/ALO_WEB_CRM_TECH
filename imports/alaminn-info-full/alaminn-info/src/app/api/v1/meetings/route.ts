import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";
import { sendTransactional } from "@/lib/email";
import { withObservability } from "@/lib/observability";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ipHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function ok(data: unknown, message = "OK", meta: unknown = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}

function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

// Simple in-memory rate limiting (per IP hash)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5; // per window
const RATE_WINDOW = 60_000; // 1 min

function rateLimited(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// basic spam heuristic
function isSpam(body: Record<string, unknown>) {
  const honey = body["website"]; // honeypot
  if (honey) return true;
  const text = [body.topic, body.organization, body.contactName]
    .filter(Boolean)
    .join(" ");
  if (/viagra|casino|crypto airdrop|http:\/\/\S+\.(ru|cn)/i.test(text)) return true;
  return false;
}

const VALID_MEETING_TYPES = new Set([
  "discovery",
  "strategy",
  "partnership",
  "education",
]);

const VALID_TIME_SLOTS = new Set([
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "20:00", "20:30", "21:00",
]);

export const POST = withObservability(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    // honeypot + spam
    if (isSpam(body)) return fail("Submission rejected.", ["spam"]);

    // rate limit
    const hash = ipHash(req);
    if (rateLimited(hash)) {
      return fail("Too many submissions. Please try again shortly.", ["rate_limited"], 429);
    }

    // validate required
    const meetingType = String(body.meetingType || "").trim();
    const requestedDate = body.requestedDate ? String(body.requestedDate) : "";
    const requestedTime = String(body.requestedTime || "").trim();
    const contactName = String(body.contactName || "").trim();
    const contactEmail = normalizeEmail(String(body.contactEmail || ""));

    const errors: string[] = [];
    if (!meetingType) errors.push("meetingType_required");
    else if (!VALID_MEETING_TYPES.has(meetingType)) errors.push("meetingType_invalid");
    if (!requestedDate) errors.push("requestedDate_required");
    else {
      const parsed = new Date(requestedDate);
      if (isNaN(parsed.getTime())) errors.push("requestedDate_invalid");
      else {
        // Date must be in the future (within next 30 days)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const maxFuture = new Date(now);
        maxFuture.setDate(maxFuture.getDate() + 30);
        if (parsed < now || parsed > maxFuture) errors.push("requestedDate_out_of_range");
        // Reject Friday weekends (Bangladesh)
        if (parsed.getDay() === 5) errors.push("requestedDate_weekend");
      }
    }
    if (!requestedTime) errors.push("requestedTime_required");
    else if (!VALID_TIME_SLOTS.has(requestedTime)) errors.push("requestedTime_invalid");
    if (!contactName) errors.push("contactName_required");
    else if (contactName.length < 2) errors.push("contactName_too_short");
    if (!contactEmail) errors.push("contactEmail_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.push("contactEmail_invalid");

    if (errors.length > 0) return fail("Validation failed.", errors);

    // Parse the requested date
    const parsedDate = new Date(requestedDate);
    parsedDate.setHours(0, 0, 0, 0);

    // Generate a unique reference
    const reference = `MTG-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Create the meeting request
    const meeting = await db.meetingRequest.create({
      data: {
        reference,
        meetingType,
        requestedDate: parsedDate,
        requestedTime,
        timezone: "Asia/Dhaka",
        contactName,
        contactEmail,
        organization: body.organization ? String(body.organization).slice(0, 200) : null,
        topic: body.topic ? String(body.topic).slice(0, 1000) : null,
        utmSource: body.utmSource ? String(body.utmSource) : null,
        utmMedium: body.utmMedium ? String(body.utmMedium) : null,
        utmCampaign: body.utmCampaign ? String(body.utmCampaign) : null,
        status: "new",
        ipHash: hash,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: "meeting_request.created",
        resource: "meeting_request",
        resourceId: meeting.id,
        meta: JSON.stringify({ reference, meetingType, requestedTime }),
        ipHash: hash,
      },
    });

    // Send meeting confirmation email to the requester.
    // Failure is logged but never crashes the meeting request.
    const scheduledAt = `${parsedDate.toDateString()} ${requestedTime}`;
    await sendTransactional(
      "meetingConfirmation",
      {
        name: contactName,
        meetingType: meetingType.replace(/-/g, " "),
        scheduledAt,
        durationMin: 30,
        timezone: "Asia/Dhaka",
      },
      { to: contactEmail, ipHash: hash, triggeredBy: "meeting_request.created" }
    ).catch(() => null);

    return ok(
      {
        reference,
        id: meeting.id,
        status: meeting.status,
        meetingType,
        requestedDate: parsedDate.toISOString(),
        requestedTime,
        contactEmail,
        expectedResponse: "Confirmation within 24 hours with meeting link",
      },
      "Meeting request received."
    );
  } catch (e) {
    // errorId = request ID, lets support staff look up this failure.
    const errorId = getRequestId() ?? undefined;
    logger.error("meetings.create_failed", { error: e });
    return NextResponse.json(
      {
        success: false,
        message: "Internal error.",
        data: null,
        meta: errorId ? { errorId } : {},
        errors: ["server_error"],
      },
      { status: 500 }
    );
  }
});

export async function GET() {
  // Public GET not allowed — admin listing is via Command Center data flow
  return NextResponse.json(
    { success: false, message: "Method not allowed.", data: null, meta: {}, errors: ["method_not_allowed"] },
    { status: 405 }
  );
}
