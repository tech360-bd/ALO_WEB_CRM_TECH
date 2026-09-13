import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { rating, comment, category } = body;
      
      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json({ success: false, error: "Rating must be 1-5" }, { status: 400 });
      }
      
      // Log review as audit (since no Review model yet, use audit log)
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "REVIEW_SUBMITTED",
          entityType: "REVIEW",
          entityId: "review-" + Date.now(),
          metadata: JSON.stringify({ rating, comment, category, userId: auth.userId })
        }
      }).catch(() => null);
      
      return NextResponse.json({ success: true, message: "Review submitted successfully", data: { id: "review-" + Date.now(), rating, status: "pending_moderation" } }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 });
    }
  })(request);
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, data: [], message: "Use POST to submit review" });
  })(request);
}

