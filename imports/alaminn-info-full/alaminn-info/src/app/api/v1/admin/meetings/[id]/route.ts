import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "meetings.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.meetingRequest.findUnique({ where: { id } });
  if (!item) return fail("Meeting not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "meetings.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.meetingRequest.update({
      where: { id },
      data: {
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.meetingType !== undefined ? { meetingType: String(b.meetingType) } : {}),
        ...(b.requestedDate !== undefined ? { requestedDate: new Date(String(b.requestedDate)) } : {}),
        ...(b.requestedTime !== undefined ? { requestedTime: String(b.requestedTime) } : {}),
        ...(b.notes !== undefined ? { notes: b.notes ? String(b.notes) : null } : {}),
        ...(b.topic !== undefined ? { topic: b.topic ? String(b.topic) : null } : {}),
      },
    });
    await writeAudit(guard.session, "meeting.update", "MeetingRequest", id);
    return ok(updated, "Meeting updated.");
  } catch (e) {
    return fail("Failed to update meeting.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "meetings.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.meetingRequest.delete({ where: { id } });
    await writeAudit(guard.session, "meeting.delete", "MeetingRequest", id);
    return NextResponse.json({ success: true, message: "Meeting deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete meeting.", [(e as Error).message], 500);
  }
}
