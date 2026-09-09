import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovals, processApproval } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);
    const approvals = await getPendingApprovals(limit);
    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, decision, reviewerId, notes } = body;

    if (!approvalId || !decision || !reviewerId) {
      return NextResponse.json({ error: "approvalId, decision, and reviewerId are required" }, { status: 400 });
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
    }

    const updated = await processApproval(approvalId, decision, reviewerId, notes);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
