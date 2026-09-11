import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { repurposeContent } from "@/lib/content-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/content-engine/assets/[id]/repurpose
// Body: { targetContentType }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { targetContentType } = body;

  if (!targetContentType) {
    return NextResponse.json({ error: "targetContentType is required" }, { status: 400 });
  }

  try {
    const asset = await repurposeContent(id, targetContentType);
    return NextResponse.json({ asset });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Repurpose failed" },
      { status: 400 }
    );
  }
}
