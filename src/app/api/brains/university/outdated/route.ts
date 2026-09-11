import { NextRequest, NextResponse } from "next/server";
import { detectOutdatedKnowledge } from "@/lib/brains/university-research-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/university/outdated — find stale / low-confidence knowledge.
export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const result = await detectOutdatedKnowledge(limit);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
