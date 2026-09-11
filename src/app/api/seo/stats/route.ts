import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSeoStats } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getSeoStats();
  return NextResponse.json(stats);
}
