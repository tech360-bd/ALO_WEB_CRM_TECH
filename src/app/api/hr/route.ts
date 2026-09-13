import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "dashboard";
      
      if (type === "employees") {
        const employees = await db.employeeProfile.findMany({ take: 50, orderBy: { createdAt: "desc" } }).catch(() => []);
        return NextResponse.json({ success: true, data: employees });
      }
      
      const stats = {
        totalEmployees: await db.employeeProfile.count().catch(() => 0),
        activeToday: 0,
        pendingLeaves: 0,
        openPositions: 0,
      };
      
      return NextResponse.json({ success: true, data: stats });
    } catch {
      return NextResponse.json({ success: true, data: { totalEmployees: 0, activeToday: 0 } });
    }
  }, { requireRoles: ["hr_manager", "super_admin", "admin"] })(request);
}

