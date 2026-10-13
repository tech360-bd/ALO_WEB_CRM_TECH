import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list SLA incident counters (joined with User for counselor name)
export async function GET(req: NextRequest) {
  try {
    const counselorId = req.nextUrl.searchParams.get("counselorId");
    const period = req.nextUrl.searchParams.get("period");

    const where: any = {};
    if (counselorId) where.counselorId = counselorId;
    if (period) where.period = period;

    const incidents = await db.slaIncidentCounter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Resolve counselor names via User lookup
    const counselorIds = Array.from(new Set(incidents.map((i) => i.counselorId)));
    const users = counselorIds.length > 0 ? await db.user.findMany({ where: { id: { in: counselorIds } }, select: { id: true, name: true, role: true } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = incidents.map((i) => ({
      ...i,
      counselor: userMap.get(i.counselorId) || null,
    }));
    return NextResponse.json({ incidents: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch incidents" }, { status: 500 });
  }
}
