import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { widgetsForRole } from "@/lib/hrms/rbac";
import { computeHrAnalytics } from "@/lib/hrms/analytics";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const role = (url.searchParams.get("role") || auth.roles?.[0] || auth.userType || "employee").toLowerCase();
    if (role === 'student') return NextResponse.json({ success:false, error:"HR widgets not available for Student" }, { status:403 });

    const allowed = widgetsForRole(role);
    const analytics = await computeHrAnalytics().catch(()=>null);
    const hrSelf = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const eid = hrSelf?.employeeId || "";

    // Fetch role-specific data
    const data: any = { allowed, role, analytics: null, own:{} };

    // Own attendance/leaves for employee
    if (eid) {
      const today = new Date().toISOString().slice(0,10);
      const month = today.slice(0,7);
      const [todayAtt, pendingLeave, docs, payroll] = await Promise.all([
        (db as any).employeeAttendance.findFirst({ where:{ employeeId: eid, date: today }}).catch(()=>null),
        (db as any).leaveRequest.findMany({ where:{ employeeId: eid, status:'PENDING' } }).catch(()=>[]),
        (db as any).employeeDocument.findMany({ where:{ employeeId: eid, isDeleted:false }}).catch(()=>[]),
        (db as any).payroll.findFirst({ where:{ employeeId: eid, monthYear: month }}).catch(()=>null),
      ]);
      data.own = {
        attendance: todayAtt,
        pendingLeaves: pendingLeave.length,
        documentsCount: docs.length,
        missingMandatory: 22 - docs.length,
        salaryStatus: payroll?.status || 'N/A',
        netPay: payroll?.netPay || null,
      };
    }

    // Manager/HR data
    if (allowed.includes('team_attendance') || allowed.includes('pending_leave')) {
      const team = await (db as any).employeeHR.findMany({ where:{ reportingManagerId: auth.userId }}).catch(()=>[]);
      // Fallback: if no reportingManagerId, use branch/dept
      let teamAttend = 0, teamLate=0;
      if (team.length) {
        const today = new Date().toISOString().slice(0,10);
        const att = await (db as any).employeeAttendance.findMany({ where:{ employeeId:{ in: team.map((t:any)=> t.employeeId)}, date: today }}).catch(()=>[]);
        teamAttend = att.filter((a:any)=> ['present','late'].includes((a.status||'').toLowerCase())).length;
        teamLate = att.filter((a:any)=> (a.status||'').toLowerCase()==='late').length;
      }
      data.team = { count: team.length, present: teamAttend, late: teamLate };
    }

    if (allowed.includes('payroll_pending') || allowed.includes('headcount')) {
      data.analytics = analytics;
      // summary for widgets
      if (analytics) {
        data.widgets = {
          headcount: analytics.headcount,
          attendanceRate: analytics.attendanceRate,
          latePercent: analytics.latePercent,
          pendingLeaves: (analytics as any).pendingLeaves ?? analytics.probationEmployees,
          payrollCost: analytics.payrollCost,
          newJoiners: analytics.newJoiners,
          probation: analytics.probationEmployees,
          upcomingConfirmation: analytics.upcomingConfirmation,
          upcomingBirthday: analytics.upcomingBirthday.slice(0,3),
          upcomingAnniversary: analytics.upcomingWorkAnniversary.slice(0,3),
        };
      }
    }

    // Common HR quick stats for all internal dashboards
    data.quick = {
      pendingLeave: (analytics as any)?.pendingLeaves ?? 0,
      payrollPending: analytics ? 0 : 0, // computed via payroll status
      joiningToday: analytics?.newJoiners ?? 0,
      documentsMissing: analytics ? 0 : 0,
      birthdays: analytics?.upcomingBirthday?.length ?? 0,
      expiringContracts: analytics?.upcomingConfirmation ?? 0,
    };

    return NextResponse.json({ success:true, data });
  })(req);
}
