import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST — resolve a ContactMatchReview record (decision: OPEN_EXISTING | MERGE_REQUEST | CREATE_NEW)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { decision, decidedBy } = body;

    if (!decision || !["OPEN_EXISTING", "MERGE_REQUEST", "CREATE_NEW"].includes(decision)) {
      return NextResponse.json({ error: "decision must be OPEN_EXISTING, MERGE_REQUEST, or CREATE_NEW" }, { status: 400 });
    }

    const existing = await db.contactMatchReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ContactMatchReview not found" }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      OPEN_EXISTING: "RESOLVED_LINKED",
      MERGE_REQUEST: "RESOLVED_MERGED",
      CREATE_NEW: "RESOLVED_NEW",
    };

    const updated = await db.contactMatchReview.update({
      where: { id },
      data: {
        decision,
        decidedBy,
        decidedAt: new Date(),
        status: statusMap[decision],
      },
    });
    return NextResponse.json({ review: updated, resolved: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to resolve review" }, { status: 500 });
  }
}
