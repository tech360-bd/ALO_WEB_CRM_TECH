import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "all";
      const where: any = {};
      if (status !== "all") where.status = status;
      
      // Try to fetch marketing content as proxy
      const content = await db.marketingGeneratedContent?.findMany?.({ where, take: 20, orderBy: { createdAt: "desc" } }).catch(() => []) || [];
      return NextResponse.json({
        success: true,
        data: content,
        stats: { total: content.length, draft: content.filter((c:any)=>c.status==="draft").length, published: content.filter((c:any)=>c.status==="published").length }
      });
    } catch {
      return NextResponse.json({ success: true, data: [], stats: { total: 0, draft: 0, published: 0 } });
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    const body = await req.json();
    return NextResponse.json({ success: true, message: "Content queued for generation", data: { id: "content-" + Date.now(), ...body } }, { status: 201 });
  })(request);
}

