import { NextResponse } from "next/server";
import { getAttributionStats } from "@/lib/brains/marketing-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/attribution-stats
export async function GET() {
  try {
    const stats = await getAttributionStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
