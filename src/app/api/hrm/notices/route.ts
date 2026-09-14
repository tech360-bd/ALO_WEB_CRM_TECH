import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";
import { createHrmNotification } from "@/lib/hrms/notifications";

function calcRemaining(noticeDate:string, periodDays:number): number {
  const start = new Date(noticeDate);
  if (isNaN(start.getTime())) return periodDays;
  const end = new Date(start.getTime() + periodDays*86400000);
  const diff = Math.ceil((end.getTime() - Date.now())/86400000);
  return Math.max(0, diff);
}

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const status = url.searchParams.get("status") || "";

    let where:any={};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status.toUpperCase();
    // employee sees own only unless HR
    if (!isHR(auth) && !isSuperAdmin(auth)) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      where.employeeId = hr?.employeeId || where.employeeId;
      if (!where.employeeId) return NextResponse.json({ success:true, data:[]});
    }

    const notices = await (db as any).hrmNotice.findMany({ where, orderBy:{ noticeDate:'desc' }, take:100 }).catch(async()=>{
      return await (db as any).noticeManagement.findMany({ where, orderBy:{ noticeDate:'desc' }, take:100 }).catch(()=>[]);
    });

    // enrich with countdown
    const enriched = notices.map((n:any)=> ({
      ...n,
      remainingDays: n.remainingDays ?? calcRemaining(n.noticeDate, n.noticePeriodDays||90),
      countdown: calcRemaining(n.noticeDate, n.noticePeriodDays||90) <= 10 ? 'urgent' : calcRemaining(n.noticeDate, n.noticePeriodDays||90) <=30 ? 'warning' : 'normal'
    }));

    return NextResponse.json({ success:true, data: enriched });
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR/Super Admin can manage notices" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { employeeId, noticeType, noticeDate, noticePeriodDays, lastWorkingDay, reason, handoverChecklist } = body;
    if (!employeeId || !noticeType || !noticeDate) return NextResponse.json({ success:false, error:"employeeId, noticeType, noticeDate required" }, { status:400 });
    const period = Number(noticePeriodDays||90);
    const remaining = calcRemaining(noticeDate, period);
    const lwd = lastWorkingDay || new Date(new Date(noticeDate).getTime()+period*86400000).toISOString().slice(0,10);

    const notice = await (db as any).hrmNotice.create({ data:{
      employeeId, noticeType: String(noticeType).toUpperCase(), noticeDate, noticePeriodDays: period, lastWorkingDay: lwd, remainingDays: remaining, reason: reason||"", handoverChecklist: JSON.stringify(handoverChecklist||[]), status:'ACTIVE', createdBy: auth.userId
    }}).catch(async()=>{
      return await (db as any).noticeManagement.create({ data:{ employeeId, noticeType: String(noticeType).toUpperCase(), noticeDate, noticePeriodDays: period, remainingDays: remaining, lastWorkingDay: lwd, handoverChecklist: JSON.stringify(handoverChecklist||[]), status:'ACTIVE' }});
    });

    await logHrmAudit({ actor: auth, action:'CREATE_NOTICE', entityType:'HrmNotice', entityId: notice.id, employeeId, newValue: notice });
    await createHrmNotification({ recipientId: employeeId, title:`Notice issued: ${noticeType}`, message:`Notice period ${period} days from ${noticeDate}, last working day ${lwd} (${remaining} days remaining)`, category:'NOTICE', actionUrl:'/crm/hrm/notices' });

    return NextResponse.json({ success:true, data: notice });
  })(req);
}

export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, action, assetReturnStatus, clearanceStatus, finalSettlementStatus, handoverChecklist } = body;
    if (!id) return NextResponse.json({ success:false, error:"id required" }, { status:400 });
    const existing = await (db as any).hrmNotice.findUnique({ where:{ id }}).catch(async()=> await (db as any).noticeManagement.findUnique({ where:{ id }}).catch(()=>null));
    if (!existing) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });

    let updateData:any = {};
    if (handoverChecklist) updateData.handoverChecklist = JSON.stringify(handoverChecklist);
    if (assetReturnStatus) updateData.assetReturnStatus = assetReturnStatus;
    if (clearanceStatus) updateData.clearanceStatus = clearanceStatus;
    if (finalSettlementStatus) updateData.finalSettlementStatus = finalSettlementStatus;
    if (action && ['complete','completed'].includes(String(action).toLowerCase())) updateData.status = 'COMPLETED';
    if (action && ['cancel','cancelled'].includes(String(action).toLowerCase())) updateData.status = 'CANCELLED';
    // recalc remaining
    updateData.remainingDays = calcRemaining(existing.noticeDate, existing.noticePeriodDays||90);

    let updated;
    try {
      updated = await (db as any).hrmNotice.update({ where:{ id }, data: updateData });
    } catch {
      updated = await (db as any).noticeManagement.update({ where:{ id }, data: updateData });
    }
    await logHrmAudit({ actor: auth, action:`UPDATE_NOTICE_${action||'EDIT'}`, entityType:'HrmNotice', entityId: id, employeeId: existing.employeeId, oldValue: existing, newValue: updated });
    return NextResponse.json({ success:true, data: updated });
  })(req);
}
