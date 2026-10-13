import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";
import { requirePermission } from "@/lib/auth";
import { withObservability } from "@/lib/observability";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

// ─── Helpers ─────────────────────────────────────────────────────────

function ok(data: unknown, message = "OK", meta: unknown = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}

function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

function ipHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// ─── Rate limiting ───────────────────────────────────────────────────

const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // per window
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

// ─── Status validation ──────────────────────────────────────────────

const VALID_STATUSES = new Set(["new", "confirmed", "rescheduled", "cancelled", "completed"]);

// Allowed transitions: current status → set of allowed next statuses
const TRANSITIONS: Record<string, Set<string>> = {
  new: new Set(["confirmed", "rescheduled", "cancelled"]),
  confirmed: new Set(["rescheduled", "cancelled", "completed"]),
  rescheduled: new Set(["confirmed", "cancelled", "completed"]),
  cancelled: new Set([]), // terminal
  completed: new Set([]), // terminal
};

// ─── GET: List all meeting requests (requires meetings.view) ────────

export const GET = withObservability(async (req: NextRequest) => {
  // ─── AUTHORIZATION ───────────────────────────────────────────────
  const guard = await requirePermission(req, "meetings.view");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: guard.response.status === 401 ? "Authentication required." : "Insufficient permissions.", data: null, meta: {}, errors: [guard.response.status === 401 ? "unauthenticated" : "forbidden"] },
      { status: guard.response.status }
    );
  }

  try {
    const hash = ipHash(req);
    if (rateLimited(hash)) {
      return fail("Too many requests.", ["rate_limited"], 429);
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (statusFilter && VALID_STATUSES.has(statusFilter)) {
      where.status = statusFilter;
    }

    const meetings = await db.meetingRequest.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    const data = meetings.map((m) => ({
      id: m.id,
      reference: m.reference,
      meetingType: m.meetingType,
      requestedDate: m.requestedDate.toISOString(),
      requestedTime: m.requestedTime,
      timezone: m.timezone,
      contactName: m.contactName,
      contactEmail: m.contactEmail,
      organization: m.organization,
      topic: m.topic,
      status: m.status,
      notes: m.notes,
      utmSource: m.utmSource,
      utmMedium: m.utmMedium,
      utmCampaign: m.utmCampaign,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return ok({ meetings, total: data.length }, "Meeting requests fetched.", {
      statusFilter: statusFilter || "all",
    });
  } catch (e) {
    const errorId = getRequestId() ?? undefined;
    logger.error("meetings.admin.list_failed", { error: e });
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

// ─── PATCH: Update meeting request status (requires meetings.update) ────

export const PATCH = withObservability(async (req: NextRequest) => {
  // ─── AUTHORIZATION ───────────────────────────────────────────────
  const guard = await requirePermission(req, "meetings.update");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: guard.response.status === 401 ? "Authentication required." : "Insufficient permissions.", data: null, meta: {}, errors: [guard.response.status === 401 ? "unauthenticated" : "forbidden"] },
      { status: guard.response.status }
    );
  }

  try {
    const hash = ipHash(req);
    if (rateLimited(hash)) {
      return fail("Too many requests.", ["rate_limited"], 429);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    const { id, status, newDate, newTime, notes } = body as {
      id?: string;
      status?: string;
      newDate?: string;
      newTime?: string;
      notes?: string;
    };

    // Validate required fields
    const errors: string[] = [];
    if (!id) errors.push("id_required");
    if (!status) errors.push("status_required");
    else if (!VALID_STATUSES.has(status)) errors.push("status_invalid");

    if (errors.length > 0) return fail("Validation failed.", errors);

    // Find the meeting
    const meeting = await db.meetingRequest.findUnique({ where: { id } });
    if (!meeting) return fail("Meeting request not found.", ["not_found"], 404);

    // Validate transition
    const allowed = TRANSITIONS[meeting.status] ?? new Set<string>();
    if (!allowed.has(status!)) {
      return fail(
        `Cannot transition from "${meeting.status}" to "${status}".`,
        ["invalid_transition"]
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };

    // If rescheduling, require new date/time
    if (status === "rescheduled") {
      if (!newDate) errors.push("newDate_required_for_reschedule");
      if (!newTime) errors.push("newTime_required_for_reschedule");
      if (errors.length > 0) return fail("Reschedule requires new date and time.", errors);

      const parsed = new Date(newDate!);
      if (isNaN(parsed.getTime())) return fail("Invalid new date.", ["newDate_invalid"]);

      updateData.requestedDate = parsed;
      updateData.requestedTime = newTime!;
    }

    // Optional admin notes
    if (typeof notes === "string") {
      updateData.notes = notes;
    }

    // Update the meeting
    const updated = await db.meetingRequest.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `meeting_request.status_changed`,
        resource: "meeting_request",
        resourceId: updated.id,
        meta: JSON.stringify({
          reference: updated.reference,
          from: meeting.status,
          to: status,
          newDate: status === "rescheduled" ? newDate : undefined,
          newTime: status === "rescheduled" ? newTime : undefined,
        }),
        ipHash: hash,
      },
    });

    return ok(
      {
        id: updated.id,
        reference: updated.reference,
        status: updated.status,
        requestedDate: updated.requestedDate.toISOString(),
        requestedTime: updated.requestedTime,
      },
      `Meeting request ${status}.`
    );
  } catch (e) {
    const errorId = getRequestId() ?? undefined;
    logger.error("meetings.admin.update_failed", { error: e });
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
