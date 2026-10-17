import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/keywords/cluster
// Assign multiple keywords to a cluster.
// Auth: any logged-in user.
// Body: { clusterName, keywordIds }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.clusterName || !Array.isArray(body?.keywordIds) || body.keywordIds.length === 0) {
      return NextResponse.json(
        { error: "clusterName and a non-empty keywordIds array are required" },
        { status: 400 }
      );
    }

    const { clusterKeywords } = await import("@/lib/keyword-research-engine");
    const result = await clusterKeywords(body.clusterName, body.keywordIds);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[seo/keywords/cluster] error", err);
    return NextResponse.json({ error: err?.message || "Cluster failed" }, { status: 500 });
  }
}
