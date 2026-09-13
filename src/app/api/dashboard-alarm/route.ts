import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { getPortalNotificationAlarms } from "@/lib/dashboard-alarm-service";
// Consolidated 2026-09-14 via src/lib/dashboard-alarm-service.ts — preserves portalNotification logic (20, critical)
// Original logic moved to service for lossless consolidation with src/app/api/dashboard/alarm/route.ts

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { alarms, stats } = await getPortalNotificationAlarms(auth.userId);
      return NextResponse.json({ success: true, data: alarms, stats });
    } catch {
      return NextResponse.json({ success: true, data: [], stats: { total: 0, critical: 0, unread: 0 } });
    }
  })(request);
}
