import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const entityId = url.searchParams.get("entityId") || url.searchParams.get("noteId");
      
      const versions = await db.portalTimelineEvent.findMany({
        where: entityId ? { entityId } : {},
        orderBy: { createdAt: "desc" },
        take: 20,
      }).catch(() => []);
      
      return NextResponse.json({ success: true, data: versions });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
  })(request);
}

