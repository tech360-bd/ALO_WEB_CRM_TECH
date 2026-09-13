import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const stats = {
        totalPartners: await db.partnerProfile.count().catch(() => 0),
        activePartners: await db.partnerProfile.count({ where: { approvalStatus: "approved" } }).catch(() => 0),
        pendingApprovals: await db.partnerProfile.count({ where: { approvalStatus: "pending" } }).catch(() => 0),
        totalLeads: 0,
        totalApplications: 0,
      };
      return NextResponse.json({ success: true, data: stats });
    } catch {
      return NextResponse.json({ success: true, data: { totalPartners: 0, activePartners: 0 } });
    }
  }, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] })(request);
}

