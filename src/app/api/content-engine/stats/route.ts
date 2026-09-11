import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContentPerformanceStats } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/content-engine/stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getContentPerformanceStats();
  return NextResponse.json(stats);
}
