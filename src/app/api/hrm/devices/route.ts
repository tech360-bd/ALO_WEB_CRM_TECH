import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { isHR, isSuperAdmin, canManageDevices } from "@/lib/hrms/rbac";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const status = url.searchParams.get("status") || "";

    let where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    // employee sees own only unless HR/IT
    if (!isHR(auth) && !isSuperAdmin(auth) && !canManageDevices(auth)) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
      where.employeeId = hr?.employeeId || auth.userId;
    }

    const devices = await (db as any).employeeDevice.findMany({ where, orderBy:{ assignedDate:'desc' } }).catch(async()=>{
      return await (db as any).employeeDevice.findMany({ where, orderBy:{ createdAt:'desc' }}).catch(()=>[]);
    });
    const logs = await (db as any).hrmDeviceLog.findMany({ orderBy:{ createdAt:'desc' }, take:50 }).catch(()=>[]);

    return NextResponse.json({ success:true, data:{ devices, logs }});
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    if (!canManageDevices(auth) && !isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR/IT/Super Admin can register devices" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { employeeId, deviceName, deviceType, serialNumber, assetTag, warranty, condition } = body;
    if (!employeeId || !deviceName || !serialNumber) return NextResponse.json({ success:false, error:"employeeId, deviceName, serialNumber required" }, { status:400 });

    const device = await (db as any).employeeDevice.create({ data:{
      employeeId,
      deviceName,
      deviceType: (deviceType||'laptop').toLowerCase(),
      deviceId: assetTag||`AST-${Date.now()}`,
      serialNumber,
      assetTag: assetTag||serialNumber,
      assignedDate: new Date().toISOString().slice(0,10),
      warranty: warranty||"",
      status:'assigned',
      condition: condition||"good",
    }});

    await (db as any).hrmDeviceLog.create({ data:{ deviceId: device.id, employeeId, action:'assigned', condition: condition||'good', actedBy: auth.userId, note: `Assigned ${deviceName}` }}).catch(()=>{});
    await logHrmAudit({ actor: auth, action:'ASSIGN_DEVICE', entityType:'EmployeeDevice', entityId: device.id, employeeId, newValue: device });

    return NextResponse.json({ success:true, data: device });
  })(req);
}

export async function PATCH(req: Request) {
  return withAuth(async (request, auth) => {
    if (!canManageDevices(auth) && !isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, action, condition, note } = body; // return, lost, damaged, repaired
    if (!id || !action) return NextResponse.json({ success:false, error:"id and action required" }, { status:400 });
    const dev = await (db as any).employeeDevice.findUnique({ where:{ id }}).catch(()=>null);
    if (!dev) return NextResponse.json({ success:false, error:"Device not found" }, { status:404 });

    const statusMap: Record<string,string> = { return:'returned', returned:'returned', lost:'lost', damaged:'damaged', repaired:'assigned', assign:'assigned' };
    const newStatus = statusMap[String(action).toLowerCase()] || 'assigned';
    const updated = await (db as any).employeeDevice.update({ where:{ id }, data:{
      status: newStatus,
      condition: condition||dev.condition,
      returnedDate: newStatus==='returned' ? new Date().toISOString().slice(0,10) : dev.returnedDate,
    }});

    await (db as any).hrmDeviceLog.create({ data:{ deviceId: id, employeeId: dev.employeeId, action: String(action).toLowerCase(), condition: condition||dev.condition, actedBy: auth.userId, note: note||"" }}).catch(()=>{});
    await logHrmAudit({ actor: auth, action:`DEVICE_${String(action).toUpperCase()}`, entityType:'EmployeeDevice', entityId: id, employeeId: dev.employeeId, oldValue: dev, newValue: updated });

    return NextResponse.json({ success:true, data: updated });
  })(req);
}
