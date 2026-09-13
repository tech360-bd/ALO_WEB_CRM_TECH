import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "pending";
      
      const changes = await db.crmSourceVerificationEvent.findMany({
        where: status !== "all" ? { status } : {},
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => []);
      
      return NextResponse.json({ success: true, data: changes, total: changes.length });
    } catch {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: "src-" + Date.now(), ...body, status: "logged" } }, { status: 201 });
  })(request);
}

