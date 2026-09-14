import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { calcHoursWorked, determineStatus } from "@/lib/hrms/attendance";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0,7); // YYYY-MM
    const date = url.searchParams.get("date") || "";
    const view = url.searchParams.get("view") || "monthly"; // monthly, calendar, summary

    let targetEmployeeId = employeeId;
    if (!targetEmployeeId) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      targetEmployeeId = hr?.employeeId || "";
    }
    // RBAC: employee can only view own, HR can view all, manager can view team (simplified: allow HR/manager or owner)
    const hrSelf = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const isOwner = hrSelf?.employeeId === targetEmployeeId;
    const canViewAll = isHR(auth) || isSuperAdmin(auth) || auth.roles.some(r=> ['manager','team_leader','branch_manager'].includes(r.toLowerCase()));
    if (!isOwner && !canViewAll) return NextResponse.json({ success:false, error:"Access denied" }, { status:403 });

    if (date) {
      const rec = await (db as any).employeeAttendance.findFirst({ where:{ employeeId: targetEmployeeId, date } }).catch(()=>null);
      return NextResponse.json({ success:true, data: rec });
    }

    if (view === 'calendar') {
      const records = await (db as any).employeeAttendance.findMany({ where:{ employeeId: targetEmployeeId, date: { startsWith: month } }, orderBy:{ date:'asc' } }).catch(()=>[]);
      const holidays = await (db as any).hrmAttendanceHoliday.findMany({ where:{ date: { startsWith: month } } }).catch(()=>[]);
      const holidaySet = new Set(holidays.map((h:any)=> h.date));
      return NextResponse.json({ success:true, data:{ records, holidays, holidaySet: Array.from(holidaySet) }});
    }

    // monthly + summary
    const records = await (db as any).employeeAttendance.findMany({ where:{ employeeId: targetEmployeeId, date: { startsWith: month } }, orderBy:{ date:'asc' } }).catch(()=>[]);
    const summary = {
      totalDays: records.length,
      present: records.filter((r:any)=> ['present','late'].includes((r.status||'').toLowerCase())).length,
      absent: records.filter((r:any)=> (r.status||'').toLowerCase()==='absent').length,
      late: records.filter((r:any)=> (r.status||'').toLowerCase()==='late').length,
      halfDay: records.filter((r:any)=> (r.status||'').toLowerCase()==='half_day').length,
      holiday: records.filter((r:any)=> (r.status||'').toLowerCase()==='holiday').length,
      leave: records.filter((r:any)=> (r.status||'').toLowerCase()==='leave').length,
      totalHours: records.reduce((s:number,r:any)=> s+ Number(r.hoursWorked||0),0),
    };
    return NextResponse.json({ success:true, data:{ records, summary }});
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    const body = await request.json().catch(()=>({}));
    const { action, employeeId, date, clockIn, clockOut, note } = body;
    // Resolve employeeId
    let eid = employeeId;
    if (!eid) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      eid = hr?.employeeId || "";
    }
    if (!eid) return NextResponse.json({ success:false, error:"employeeId required" }, { status:400 });
    const isOwner = (await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null))?.employeeId === eid;
    const canManage = isHR(auth) || isSuperAdmin(auth);
    if (!isOwner && !canManage) return NextResponse.json({ success:false, error:"Access denied" }, { status:403 });

    const today = date || new Date().toISOString().slice(0,10);
    const ip = request.headers.get('x-forwarded-for')||"";
    const existing = await (db as any).employeeAttendance.findFirst({ where:{ employeeId: eid, date: today }}).catch(()=>null);

    if (action === 'clock_in') {
      const time = clockIn || new Date().toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Dhaka' });
      if (existing) {
        if (existing.clockIn || existing.checkIn) return NextResponse.json({ success:false, error:"Already clocked in" }, { status:400 });
        const updated = await (db as any).employeeAttendance.update({ where:{ id: existing.id }, data:{ clockIn: time, checkIn: time, ipAddress: ip }});
        const { status, isLate, lateMinutes } = determineStatus(time, updated.clockOut||"", false, false);
        const final = await (db as any).employeeAttendance.update({ where:{ id: existing.id }, data:{ status, isLate, lateMinutes }});
        await logHrmAudit({ actor: auth, action:'CLOCK_IN', entityType:'EmployeeAttendance', entityId: final.id, employeeId: eid, newValue: { clockIn: time }});
        return NextResponse.json({ success:true, data: final });
      } else {
        const { status, isLate, lateMinutes } = determineStatus(time, "", false, false);
        const rec = await (db as any).employeeAttendance.create({ data:{
          employeeId: eid, date: today, clockIn: time, checkIn: time, clockOut:"", checkOut:"", status, isLate, lateMinutes, hoursWorked:0, workingHours:8, ipAddress: ip, note: note||""
        }});
        await logHrmAudit({ actor: auth, action:'CLOCK_IN', entityType:'EmployeeAttendance', entityId: rec.id, employeeId: eid, newValue: rec });
        return NextResponse.json({ success:true, data: rec });
      }
    }

    if (action === 'clock_out') {
      const time = clockOut || new Date().toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Dhaka' });
      if (!existing) return NextResponse.json({ success:false, error:"No clock-in found for today" }, { status:400 });
      const hours = calcHoursWorked(existing.clockIn||existing.checkIn||"", time);
      const { status, isLate, lateMinutes } = determineStatus(existing.clockIn||existing.checkIn||"", time, false, false);
      const updated = await (db as any).employeeAttendance.update({ where:{ id: existing.id }, data:{
        clockOut: time, checkOut: time, hoursWorked: hours, workingHours:8, status, isLate, lateMinutes, idleTime: Math.max(0, 8 - hours)
      }});
      await logHrmAudit({ actor: auth, action:'CLOCK_OUT', entityType:'EmployeeAttendance', entityId: updated.id, employeeId: eid, newValue: { clockOut: time, hoursWorked: hours }});
      return NextResponse.json({ success:true, data: updated });
    }

    // Manual create/update (HR only)
    if (!canManage) return NextResponse.json({ success:false, error:"Only HR can manually manage attendance" }, { status:403 });
    const statusInfo = determineStatus(clockIn||"", clockOut||"", false, false);
    const hours = calcHoursWorked(clockIn||"", clockOut||"");
    let rec;
    if (existing) {
      rec = await (db as any).employeeAttendance.update({ where:{ id: existing.id }, data:{
        clockIn: clockIn||existing.clockIn, clockOut: clockOut||existing.clockOut, checkIn: clockIn||existing.checkIn, checkOut: clockOut||existing.checkOut,
        hoursWorked: hours||existing.hoursWorked, status: statusInfo.status, isLate: statusInfo.isLate, lateMinutes: statusInfo.lateMinutes, note: note||existing.note, isManual:true, approvedBy: auth.userId
      }});
    } else {
      rec = await (db as any).employeeAttendance.create({ data:{
        employeeId: eid, date: today, clockIn: clockIn||"", clockOut: clockOut||"", checkIn: clockIn||"", checkOut: clockOut||"", hoursWorked: hours, workingHours:8, status: statusInfo.status, isLate: statusInfo.isLate, lateMinutes: statusInfo.lateMinutes, note: note||"", isManual:true, approvedBy: auth.userId
      }});
    }
    await logHrmAudit({ actor: auth, action:'MANUAL_ATTENDANCE', entityType:'EmployeeAttendance', entityId: rec.id, employeeId: eid, newValue: rec });
    return NextResponse.json({ success:true, data: rec });
  })(req);
}
