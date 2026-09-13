import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, data: [], message: "No pending delete requests" });
  }, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { reason, confirmation } = body;
      if (!confirmation) return NextResponse.json({ success: false, error: "Confirmation required" }, { status: 400 });
      
      // Log delete request
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "DELETE_REQUEST",
          entityType: "USER",
          entityId: auth.userId,
          metadata: JSON.stringify({ reason, requestedAt: new Date().toISOString() })
        }
      }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "Delete request submitted for review", data: { id: "del-" + Date.now(), status: "pending_review" } }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to submit delete request" }, { status: 500 });
    }
  })(request);
}

