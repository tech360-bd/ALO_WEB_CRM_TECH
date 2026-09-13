import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/stale
// Detect content dependencies that have gone stale for a given source.
// Body: { sourceType, sourceId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.sourceType || !body?.sourceId) {
      return NextResponse.json({ error: "sourceType and sourceId are required" }, { status: 400 });
    }

    const { detectStaleContent, markContentFresh } = await import("@/lib/brains/seo-brain");
    const staleResult = await detectStaleContent(body.sourceType, body.sourceId);

    // If the caller requested auto-refresh, mark each stale dependency fresh
    let marked = { updatedCount: 0 };
    if (body?.autoRefresh && staleResult.staleDependencyIds.length > 0) {
      // markContentFresh operates per (dependentAssetType, dependentAssetId); we
      // don't have those here directly so we just return the stale ids for now.
      marked.updatedCount = 0;
    }

    return NextResponse.json({ ...staleResult, autoRefresh: marked });
  } catch (err: any) {
    console.error("[brains/seo/stale] error", err);
    return NextResponse.json({ error: err?.message || "Stale detection failed" }, { status: 500 });
  }
}
