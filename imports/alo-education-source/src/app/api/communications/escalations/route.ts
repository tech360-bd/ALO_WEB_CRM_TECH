import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list escalations (filter by status / type)
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const type = req.nextUrl.searchParams.get("type");
    const counselorId = req.nextUrl.searchParams.get("counselorId");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (counselorId) where.counselorId = counselorId;

    const escalations = await db.escalationEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ escalations });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch escalations" }, { status: 500 });
  }
}

// POST — create escalation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, level, communicationId, slaEventId, studentId, counselorId, supervisorId, message } = body;

    if (!type || !message) {
      return NextResponse.json({ error: "type and message are required" }, { status: 400 });
    }

    const escalation = await db.escalationEvent.create({
      data: {
        type,
        level: typeof level === "number" ? level : 1,
        communicationId,
        slaEventId,
        studentId,
        counselorId,
        supervisorId,
        message,
        status: "OPEN",
      },
    });
    return NextResponse.json({ escalation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create escalation" }, { status: 500 });
  }
}
