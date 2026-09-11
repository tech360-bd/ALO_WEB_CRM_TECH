import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applySourceChange, rejectSourceChange } from "@/lib/source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/source-intelligence/changes/[id]/review
// Body: { action: "APPLY" | "REJECT", reviewerId, reason? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, reviewerId, reason } = body;

  if (!action || !["APPLY", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "action must be APPLY or REJECT" }, { status: 400 });
  }

  const actorId = reviewerId || (session.user as any)?.id || "system";

  try {
    if (action === "APPLY") {
      const result = await applySourceChange(id, actorId);
      return NextResponse.json(result);
    } else {
      const result = await rejectSourceChange(id, actorId, reason);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Review failed" },
      { status: 400 }
    );
  }
}
