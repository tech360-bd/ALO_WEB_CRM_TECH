import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { isHR, isSuperAdmin, canManageLeave } from "@/lib/hrms/rbac";
import { createHrmNotification } from "@/lib/hrms/notifications";

function daysBetween(start:string, end:string): number {
  const s = new Date(start); const e = new Date(end);
  if (isNaN(s.getTime())||isNaN(e.getTime())) return 1;
  const diff = Math.ceil((e.getTime()-s.getTime())/86400000)+1;
  return Math.max(1, diff);
}

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const status = url.searchParams.get("status") || "";
    const view = url.searchParams.get("view") || "list"; // list, balance, pending

    let eid = employeeId;
    if (!eid) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      eid = hr?.employeeId || "";
    }

    if (view === 'balance') {
      const year = url.searchParams.get("year") || new Date().getFullYear().toString();
      let bal = await (db as any).employeeLeaveBalance.findUnique({ where:{ employeeId: eid }}).catch(()=>null);
      if (!bal) {
        // fallback LeaveRequest aggregation
        bal = await (db as any).employeeLeaveBalance.findFirst({ where:{ employeeId: eid, year }}).catch(()=>null);
      }
      // also compute from LeaveRequest
      const leaves = await (db as any).leaveRequest.findMany({ where:{ employeeId: eid, status:'APPROVED' } }).catch(()=>[]);
      const byType: Record<string, number> = {};
      for (const l of leaves as any[]) byType[l.leaveType] = (byType[l.leaveType]||0) + Number(l.days||0);
      return NextResponse.json({ success:true, data:{ balance: bal, usedByType: byType, leaves }});
    }

    // list
    let where: any = {};
    if (!isHR(auth) && !isSuperAdmin(auth) && !canManageLeave(auth)) {
      // employee sees own only
      where.employeeId = eid;
    } else if (eid && !url.searchParams.get("employeeId")) {
      // HR viewing without filter -> all
    } else if (eid) where.employeeId = eid;
    if (status) where.status = status.toUpperCase();

    const leaves = await (db as any).leaveRequest.findMany({ where, orderBy:{ createdAt:'desc' }, take:100 }).catch(async()=>{
      return await (db as any).employeeLeave.findMany({ where, orderBy:{ createdAt:'desc' }, take:100 }).catch(()=>[]);
    });

    const pending = await (db as any).leaveRequest.count({ where:{ status:'PENDING' }}).catch(()=>0);

    return NextResponse.json({ success:true, data: leaves, pending, canApprove: canManageLeave(auth) || isHR(auth) });
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    const body = await request.json().catch(()=>({}));
    const { leaveType, startDate, endDate, reason, documentUrl } = body;
    if (!leaveType || !startDate || !endDate) return NextResponse.json({ success:false, error:"leaveType, startDate, endDate required" }, { status:400 });

    const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const eid = hr?.employeeId || auth.userId;
    const days = daysBetween(startDate, endDate);

    // Check balance (casual/annual etc)
    const bal = await (db as any).employeeLeaveBalance.findUnique({ where:{ employeeId: eid }}).catch(()=>null);
    if (bal) {
      const map: Record<string,string> = { casual:'casualRemaining', annual:'annualRemaining', medical:'medicalRemaining', maternity:'maternityRemaining', paternity:'paternityRemaining', compensatory:'compOffRemaining' };
      const key = map[String(leaveType).toLowerCase()];
      if (key && bal[key] !== undefined && bal[key] < days && !['lwp','without_pay'].includes(String(leaveType).toLowerCase())) {
        return NextResponse.json({ success:false, error:`Insufficient ${leaveType} balance. Remaining: ${bal[key]}, requested: ${days}` }, { status:400 });
      }
    }

    const leave = await (db as any).leaveRequest.create({ data:{
      employeeId: eid,
      leaveType: String(leaveType).toUpperCase(),
      startDate,
      endDate,
      days,
      reason: reason||"",
      status:'PENDING',
    }}).catch(async()=>{
      // fallback to EmployeeLeave
      return await (db as any).employeeLeave.create({ data:{
        employeeId: eid,
        leaveType: String(leaveType).toLowerCase(),
        startDate,
        endDate,
        totalDays: days,
        reason: reason||"",
        status:'pending',
        documentUrl: documentUrl||""
      }});
    });

    await logHrmAudit({ actor: auth, action:'APPLY_LEAVE', entityType:'LeaveRequest', entityId: leave.id, employeeId: eid, newValue: leave });
    await createHrmNotification({ recipientId: eid, title:'Leave applied', message:`${leaveType} ${startDate} to ${endDate} (${days} days) pending approval`, category:'LEAVE', actionUrl:'/crm/hrm/leave' });

    // Notify HR/managers
    try {
      const hrs = await (db as any).portalUser.findMany({ where:{ userType:{ in:['HR','HR_MANAGER','SUPER_ADMIN'] }}, take:5 }).catch(()=>[]);
      for (const h of hrs as any[]) {
        await createHrmNotification({ recipientId: h.id, recipientRole:'HR', title:'Leave approval pending', message:`${hr?.fullName||eid} applied for ${leaveType}`, category:'LEAVE', actionUrl:'/crm/hrm/leave' }).catch(()=>{});
      }
    } catch {}

    return NextResponse.json({ success:true, data: leave });
  })(req);
}

export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (!canManageLeave(auth) && !isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR/Manager can approve leave" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, action, reviewNote } = body; // approve, reject, cancel
    if (!id || !action) return NextResponse.json({ success:false, error:"id and action required" }, { status:400 });
    const existing = await (db as any).leaveRequest.findUnique({ where:{ id }}).catch(async()=> await (db as any).employeeLeave.findUnique({ where:{ id }}).catch(()=>null));
    if (!existing) return NextResponse.json({ success:false, error:"Leave not found" }, { status:404 });

    let updated;
    const statusMap: Record<string,string> = { approve:'APPROVED', approved:'APPROVED', reject:'REJECTED', rejected:'REJECTED', cancel:'CANCELLED' };
    const newStatus = statusMap[String(action).toLowerCase()] || 'PENDING';
    try {
      updated = await (db as any).leaveRequest.update({ where:{ id }, data:{ status: newStatus, approvedBy: auth.userId, approvedAt: new Date(), reviewNote: reviewNote||"" }});
      // Deduct balance if approved
      if (newStatus==='APPROVED') {
        const bal = await (db as any).employeeLeaveBalance.findUnique({ where:{ employeeId: existing.employeeId }}).catch(()=>null);
        if (bal) {
          const typeMap: Record<string,string> = { CASUAL:'casualUsed', ANNUAL:'annualUsed', MEDICAL:'medicalUsed', MATERNITY:'maternityUsed', PATERNITY:'paternityUsed', COMPENSATORY:'compOffUsed', WITHOUT_PAY:'lwpUsed' };
          const field = typeMap[String(existing.leaveType).toUpperCase()];
          if (field) {
            const remainMap: Record<string,string> = { casualUsed:'casualRemaining', annualUsed:'annualRemaining', medicalUsed:'medicalRemaining', maternityUsed:'maternityRemaining', paternityUsed:'paternityRemaining', compOffUsed:'compOffRemaining' };
            const remain = remainMap[field];
            await (db as any).employeeLeaveBalance.update({ where:{ employeeId: existing.employeeId }, data:{ [field]: { increment: Number(existing.days||existing.totalDays||0) }, ...(remain? { [remain]: { decrement: Number(existing.days||0) } }: {}) }}).catch(()=>{});
          }
        }
      }
    } catch {
      updated = await (db as any).employeeLeave.update({ where:{ id }, data:{ status: newStatus.toLowerCase(), approvedBy: auth.userId, approvedAt: new Date() }});
    }

    await logHrmAudit({ actor: auth, action:`LEAVE_${newStatus}`, entityType:'LeaveRequest', entityId: id, employeeId: existing.employeeId, oldValue: existing, newValue: updated });
    await createHrmNotification({ recipientId: existing.employeeId, title:`Leave ${newStatus.toLowerCase()}`, message:`Your ${existing.leaveType} leave ${existing.startDate} to ${existing.endDate} is ${newStatus}`, category:'LEAVE', actionUrl:'/crm/hrm/leave' });

    return NextResponse.json({ success:true, data: updated });
  })(req);
}
