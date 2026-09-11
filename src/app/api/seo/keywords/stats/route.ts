import { NextResponse } from "next/server";
import { getKeywordStats } from "@/lib/keyword-research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/keywords/stats — REAL stats from KeywordResearch table.
export async function GET() {
  try {
    const stats = await getKeywordStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
