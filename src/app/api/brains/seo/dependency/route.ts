import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seo/dependency
// Create a content dependency record (idempotent).
// Body: { dependentAssetType, dependentAssetId, sourceType, sourceId, sourceField? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.dependentAssetType || !body?.dependentAssetId || !body?.sourceType || !body?.sourceId) {
      return NextResponse.json(
        { error: "dependentAssetType, dependentAssetId, sourceType, sourceId are required" },
        { status: 400 }
      );
    }

    const { createContentDependency } = await import("@/lib/brains/seo-brain");
    const result = await createContentDependency(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[brains/seo/dependency] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create dependency" }, { status: 500 });
  }
}
