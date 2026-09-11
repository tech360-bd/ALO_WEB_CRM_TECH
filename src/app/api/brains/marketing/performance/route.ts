import { NextResponse } from "next/server";
import { getContentPerformanceReport } from "@/lib/brains/marketing-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/performance
export async function GET() {
  try {
    const report = await getContentPerformanceReport();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
