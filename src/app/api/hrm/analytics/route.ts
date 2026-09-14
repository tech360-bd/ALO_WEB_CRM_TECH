import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { computeHrAnalytics } from "@/lib/hrms/analytics";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth) && !auth.roles.some(r=> ['manager','branch_manager','admin'].includes(r.toLowerCase()))) {
      // employees still get limited own analytics via widgets, but full analytics requires HR
      // allow limited summary for non-HR
      const analytics = await computeHrAnalytics();
      // strip costs for non-HR
      return NextResponse.json({ success:true, data:{
        headcount: analytics.headcount,
        activeEmployees: analytics.activeEmployees,
        attendanceRate: analytics.attendanceRate,
        probationEmployees: analytics.probationEmployees,
        upcomingBirthday: analytics.upcomingBirthday.slice(0,3),
        upcomingWorkAnniversary: analytics.upcomingWorkAnniversary.slice(0,3),
        note: "Full analytics visible only to HR/Super Admin"
      }});
    }
    const analytics = await computeHrAnalytics();
    return NextResponse.json({ success:true, data: analytics });
  })(req);
}
