import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "meetings.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["contactName", "contactEmail", "topic", "reference"]),
    ...(status && status !== "all" ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    db.meetingRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.meetingRequest.count({ where }),
  ]);
  return ok(items, "Meetings loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "meetings.update");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.meetingType || !b.contactName || !b.contactEmail) {
    return fail("meetingType, contactName, contactEmail are required.", ["missing_fields"]);
  }
  try {
    const meeting = await db.meetingRequest.create({
      data: {
        reference: `M-${Date.now().toString(36)}`,
        meetingType: String(b.meetingType),
        requestedDate: b.requestedDate ? new Date(String(b.requestedDate)) : new Date(),
        requestedTime: b.requestedTime ? String(b.requestedTime) : "09:00",
        timezone: b.timezone ? String(b.timezone) : "Asia/Dhaka",
        contactName: String(b.contactName),
        contactEmail: String(b.contactEmail),
        organization: b.organization ? String(b.organization) : null,
        topic: b.topic ? String(b.topic) : null,
        status: b.status ? String(b.status) : "new",
      },
    });
    await writeAudit(guard.session, "meeting.create", "MeetingRequest", meeting.id, { reference: meeting.reference });
    return ok(meeting, "Meeting created.", {}, 201);
  } catch (e) {
    return fail("Failed to create meeting.", [(e as Error).message], 500);
  }
}
