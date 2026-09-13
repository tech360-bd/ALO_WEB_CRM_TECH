import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/related
// Find content assets related to the given ContentDNA.
// Body: ContentDNAShape (contentAssetId, hash, topicTerms, ...)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.contentAssetId) {
      return NextResponse.json({ error: "contentAssetId is required in the DNA payload" }, { status: 400 });
    }

    const { findRelatedContent } = await import("@/lib/brains/seo-brain");
    const related = await findRelatedContent(body);
    return NextResponse.json({ related });
  } catch (err: any) {
    console.error("[brains/seo/related] error", err);
    return NextResponse.json({ error: err?.message || "Failed to find related content" }, { status: 500 });
  }
}
