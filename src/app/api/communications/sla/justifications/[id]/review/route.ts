import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST — review a SLA justification (decision: ACCEPTED | REJECTED | CLARIFICATION_REQUESTED)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reviewedBy, decision, reviewNotes } = body;

    if (!decision || !["ACCEPTED", "REJECTED", "CLARIFICATION_REQUESTED"].includes(decision)) {
      return NextResponse.json({ error: "decision must be ACCEPTED, REJECTED, or CLARIFICATION_REQUESTED" }, { status: 400 });
    }
    if (!reviewedBy) {
      return NextResponse.json({ error: "reviewedBy is required" }, { status: 400 });
    }

    const existing = await db.slaJustification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Justification not found" }, { status: 404 });
    }

    const updated = await db.slaJustification.update({
      where: { id },
      data: {
        status: decision,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });
    return NextResponse.json({ justification: updated, reviewed: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to review justification" }, { status: 500 });
  }
}
