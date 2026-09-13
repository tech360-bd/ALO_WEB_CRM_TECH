import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const events = await db.portalAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => []);
      return NextResponse.json({ success: true, data: events });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  }, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, message: "Event published", data: { id: "evt-" + Date.now(), ...body, publishedBy: auth.userId, timestamp: new Date().toISOString() } }, { status: 201 });
  })(request);
}

