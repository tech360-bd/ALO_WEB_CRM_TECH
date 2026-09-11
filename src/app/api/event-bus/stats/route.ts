import { NextResponse } from "next/server";
import { getEventBusStats } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/event-bus/stats — REAL aggregate stats from EventLog.
export async function GET() {
  try {
    const stats = await getEventBusStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
