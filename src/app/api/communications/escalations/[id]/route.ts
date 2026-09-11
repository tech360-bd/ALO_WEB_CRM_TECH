import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH — acknowledge or resolve an escalation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, actionTaken, resolvedAt } = body;

    if (!status || !["OPEN", "ACKNOWLEDGED", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "status must be OPEN, ACKNOWLEDGED, RESOLVED, or CLOSED" }, { status: 400 });
    }

    const existing = await db.escalationEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
    }

    const data: any = { status };
    if (actionTaken !== undefined) data.actionTaken = actionTaken;
    if (status === "RESOLVED" || status === "CLOSED") {
      data.resolvedAt = resolvedAt ? new Date(resolvedAt) : new Date();
    }

    const escalation = await db.escalationEvent.update({ where: { id }, data });
    return NextResponse.json({ escalation });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update escalation" }, { status: 500 });
  }
}
