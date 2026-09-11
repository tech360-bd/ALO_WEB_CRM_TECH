import { NextResponse } from "next/server";
import { getContentOpportunityStats } from "@/lib/brains/content-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/content/stats — REAL stats from DB.
export async function GET() {
  try {
    const stats = await getContentOpportunityStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
