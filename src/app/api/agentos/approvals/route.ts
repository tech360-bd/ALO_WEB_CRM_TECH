import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovals } from "@/lib/agentos/agent-service";

import { processApproval, canDecideApproval, ApprovalConflict, ApprovalForbidden } from "@/lib/agentos/approval-transition";

export async function GET(req: NextRequest) {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canDecideApproval(auth)) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: 403 });
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
  if (!canDecideApproval(auth)) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: 403 });
  try {
    const body = await req.json();
    // reviewerId must match authenticated user (prevent impersonation) — SEC-10
    const { approvalId, decision, notes } = body;


    if (typeof approvalId !== "string" || !approvalId || (notes !== undefined && (typeof notes !== "string" || notes.length > 4000))) {
      return NextResponse.json({ error: "approvalId and decision are required" }, { status: 400 });
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
    }

    const updated = await processApproval(approvalId, decision, auth, notes);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ApprovalConflict) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof ApprovalForbidden) return NextResponse.json({ error: error.message }, { status: 403 });
    console.error("Error processing approval:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
