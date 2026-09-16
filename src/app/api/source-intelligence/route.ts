import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "pending";
      // CrmSourceVerificationEvent has no `status` column — callers' "pending"
      // maps to the model's NEEDS_REVIEW verification state.
      const verificationStatus = status === "pending" ? "NEEDS_REVIEW" : status;

      const changes = await db.crmSourceVerificationEvent.findMany({
        where: status !== "all" ? { verificationStatus } : {},
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ success: true, data: changes, total: changes.length });
    } catch (err: any) {
      console.error('[source-intelligence] error', err);
      return NextResponse.json({ success: false, error: err?.message || 'Failed to load verification events' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: "src-" + Date.now(), ...body, status: "logged" } }, { status: 201 });
  })(request);
}

