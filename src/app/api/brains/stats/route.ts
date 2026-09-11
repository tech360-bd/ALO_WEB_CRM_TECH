import { NextResponse } from "next/server";
import { getBrainStats } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/stats — REAL aggregate stats across all brain extensions.
export async function GET() {
  try {
    const stats = await getBrainStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
