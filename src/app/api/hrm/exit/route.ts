import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";
import { createHrmNotification } from "@/lib/hrms/notifications";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const status = url.searchParams.get("status") || "";

    let where:any={};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status.toUpperCase();
    if (!isHR(auth) && !isSuperAdmin(auth)) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      if (!hr) return NextResponse.json({ success:false, error:"Access denied" }, { status:403 });
      // employee sees own exit only
      where.employeeId = hr.employeeId;
    }

    const exits = await (db as any).hrmExit.findMany({ where, orderBy:{ exitDate:'desc' }, take:100 }).catch(async()=>{
      return await (db as any).exitManagement.findMany({ where, orderBy:{ exitDate:'desc' }, take:100 }).catch(()=>[]);
    });

    return NextResponse.json({ success:true, data: exits });
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR/Super Admin can manage exits" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { employeeId, exitType, exitDate, exitInterviewNotes, finalSettlement, experienceLetterPath, relievingLetterPath } = body;
    if (!employeeId || !exitType || !exitDate) return NextResponse.json({ success:false, error:"employeeId, exitType, exitDate required" }, { status:400 });

    const existing = await (db as any).hrmExit.findUnique({ where:{ employeeId }}).catch(()=>null);
    if (existing) return NextResponse.json({ success:false, error:"Exit already exists for employee" }, { status:400 });

    const exit = await (db as any).hrmExit.create({ data:{
      employeeId, exitType: String(exitType).toUpperCase(), exitDate, exitInterviewNotes: exitInterviewNotes||"", finalSettlement: Number(finalSettlement||0), experienceLetterPath: experienceLetterPath||"", relievingLetterPath: relievingLetterPath||"", status:'PENDING'
    }}).catch(async()=>{
      return await (db as any).exitManagement.create({ data:{ employeeId, exitType: String(exitType).toUpperCase(), exitDate, exitInterview: JSON.stringify({ notes: exitInterviewNotes||"" }), finalSettlement: Number(finalSettlement||0), status:'PENDING' }});
    });

    // Update EmployeeHR status
    await (db as any).employeeHR.update({ where:{ employeeId }, data:{ status: String(exitType).toUpperCase()==='RESIGNATION' ? 'RESIGNED' : 'TERMINATED', employmentStatus: String(exitType).toUpperCase() }}).catch(()=>{});

    await logHrmAudit({ actor: auth, action:'CREATE_EXIT', entityType:'HrmExit', entityId: exit.id, employeeId, newValue: exit });
    await createHrmNotification({ recipientId: employeeId, title:`Exit initiated: ${exitType}`, message:`Exit date ${exitDate} — clearance pending`, category:'EXIT', actionUrl:'/crm/hrm/exit' });

    return NextResponse.json({ success:true, data: exit });
  })(req);
}

export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, action, clearanceStatus, finalSettlement, experienceLetterPath, relievingLetterPath, exitInterviewNotes, exitInterviewConducted } = body;
    if (!id) return NextResponse.json({ success:false, error:"id required" }, { status:400 });
    const existing = await (db as any).hrmExit.findUnique({ where:{ id }}).catch(async()=> await (db as any).exitManagement.findUnique({ where:{ id }}).catch(()=>null));
    if (!existing) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });

    let data:any = {};
    if (clearanceStatus) data.clearanceStatus = clearanceStatus;
    if (finalSettlement!==undefined) data.finalSettlement = Number(finalSettlement);
    if (experienceLetterPath) data.experienceLetterPath = experienceLetterPath;
    if (relievingLetterPath) data.relievingLetterPath = relievingLetterPath;
    if (exitInterviewNotes) data.exitInterviewNotes = exitInterviewNotes;
    if (exitInterviewConducted!==undefined) data.exitInterviewConducted = !!exitInterviewConducted;
    if (action && ['complete','completed','clear','cleared'].includes(String(action).toLowerCase())) data.status = 'COMPLETED';
    if (action && ['clearance'].includes(String(action).toLowerCase())) data.clearanceStatus = 'CLEARED';

    let updated;
    try {
      updated = await (db as any).hrmExit.update({ where:{ id }, data });
    } catch {
      updated = await (db as any).exitManagement.update({ where:{ id }, data:{ clearanceStatus: data.clearanceStatus||existing.clearanceStatus, finalSettlement: data.finalSettlement??existing.finalSettlement, status: data.status||existing.status }});
    }
    await logHrmAudit({ actor: auth, action:`UPDATE_EXIT_${String(action||'EDIT').toUpperCase()}`, entityType:'HrmExit', entityId: id, employeeId: existing.employeeId, oldValue: existing, newValue: updated });
    return NextResponse.json({ success:true, data: updated });
  })(req);
}
