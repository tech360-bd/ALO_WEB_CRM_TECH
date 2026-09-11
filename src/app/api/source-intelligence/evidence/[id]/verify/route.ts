import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyEvidence } from "@/lib/source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/source-intelligence/evidence/[id]/verify
// Body: { verifierId? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const verifierId = body?.verifierId || (session.user as any)?.id || "system";

  try {
    const evidence = await verifyEvidence(id, verifierId);
    return NextResponse.json({ evidence });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 400 }
    );
  }
}
