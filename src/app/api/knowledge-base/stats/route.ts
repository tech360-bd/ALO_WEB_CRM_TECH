import { NextResponse } from "next/server";
import { getKbStats } from "@/lib/knowledge-base-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/knowledge-base/stats — REAL KB article stats.
export async function GET() {
  try {
    const stats = await getKbStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
