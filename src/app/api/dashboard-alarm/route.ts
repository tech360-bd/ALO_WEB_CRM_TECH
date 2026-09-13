import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const alarms = await db.portalNotification.findMany({
        where: { userId: auth.userId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      }).catch(() => []);
      
      const critical = alarms.filter((a:any) => a.type === "critical" || a.priority === "high");
      
      return NextResponse.json({
        success: true,
        data: alarms,
        stats: { total: alarms.length, critical: critical.length, unread: alarms.length }
      });
    } catch {
      return NextResponse.json({ success: true, data: [], stats: { total: 0, critical: 0, unread: 0 } });
    }
  })(request);
}

