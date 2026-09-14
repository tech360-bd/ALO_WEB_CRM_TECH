import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovals, processApproval } from "@/lib/agentos/agent-service";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
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
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    // reviewerId must match authenticated user (prevent impersonation) — SEC-10
    const { approvalId, decision, notes } = body;
    const reviewerId = (auth as any).userId;

    if (!approvalId || !decision) {
      return NextResponse.json({ error: "approvalId and decision are required" }, { status: 400 });
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
