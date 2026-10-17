import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/repurpose
// Repurpose a content asset into a new content type. Auth: any logged-in user.
// Body: { targetContentType }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "asset id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.targetContentType) {
      return NextResponse.json({ error: "targetContentType is required" }, { status: 400 });
    }

    const { repurposeContent } = await import("@/lib/content-engine");
    const result = await repurposeContent(id, body.targetContentType);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[content-engine/assets/[id]/repurpose] error", err);
    return NextResponse.json({ error: err?.message || "Repurpose failed" }, { status: 500 });
  }
}
