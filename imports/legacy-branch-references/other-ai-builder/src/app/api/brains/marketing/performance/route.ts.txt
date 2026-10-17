import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/marketing/performance
// Returns the content performance report (top performing assets, by-platform).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getContentPerformanceReport } = await import("@/lib/brains/marketing-brain");
    const report = await getContentPerformanceReport();
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[brains/marketing/performance] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load performance report" }, { status: 500 });
  }
}
