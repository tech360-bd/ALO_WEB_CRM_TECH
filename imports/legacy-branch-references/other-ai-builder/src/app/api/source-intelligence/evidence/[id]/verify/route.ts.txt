import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/source-intelligence/evidence/[id]/verify
// Mark a piece of evidence as verified. Auth: admin only.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "evidence id is required" }, { status: 400 });
    }

    const { verifyEvidence } = await import("@/lib/source-intelligence");
    const result = await verifyEvidence(id, (session.user as any).id || "ADMIN");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[source-intelligence/evidence/[id]/verify] error", err);
    return NextResponse.json({ error: err?.message || "Failed to verify evidence" }, { status: 500 });
  }
}
