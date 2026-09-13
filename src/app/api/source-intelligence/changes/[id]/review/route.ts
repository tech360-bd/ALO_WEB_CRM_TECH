import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/source-intelligence/changes/[id]/review
// Review a source change: AI-evaluate then apply or reject.
// Auth: admin only.
// Body: { decision: "APPLY" | "REJECT", reason? }
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
      return NextResponse.json({ error: "change id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const decision = String(body?.decision || "").toUpperCase();
    if (decision !== "APPLY" && decision !== "REJECT") {
      return NextResponse.json(
        { error: "decision must be 'APPLY' or 'REJECT'" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id || "ADMIN";
    const lib = await import("@/lib/source-intelligence");

    // 1. Always AI-evaluate (for explanation / impact level).
    const aiEval = await lib.evaluateSourceChangeWithAI(id).catch((e: any) => ({
      changeId: id,
      aiExplanation: `AI evaluation failed: ${e?.message || "unknown"}`,
      confidence: 0,
      impactLevel: "MEDIUM",
    }));

    // 2. Apply or reject.
    if (decision === "APPLY") {
      const result = await lib.applySourceChange(id, userId);
      return NextResponse.json({ decision: "APPLY", aiEvaluation: aiEval, result });
    } else {
      const result = await lib.rejectSourceChange(id, userId, body?.reason);
      return NextResponse.json({ decision: "REJECT", aiEvaluation: aiEval, result });
    }
  } catch (err: any) {
    console.error("[source-intelligence/changes/[id]/review] error", err);
    return NextResponse.json({ error: err?.message || "Review failed" }, { status: 500 });
  }
}
