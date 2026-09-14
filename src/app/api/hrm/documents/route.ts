import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { canViewEmployeeProfile, isHR, isSuperAdmin } from "@/lib/hrms/rbac";

const MANDATORY_TYPES = [
  'passport','nid','photo','cv','certificates','experience_letter','appointment_letter','confirmation_letter',
  'increment_letter','promotion_letter','transfer_letter','warning_letter','termination_letter','employment_agreement',
  'nda','confidentiality_agreement','device_agreement','it_policy','data_privacy_agreement','international_agreement','bangladesh_agreement','exit_clearance'
];

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || "";
    const targetUserId = url.searchParams.get("userId") || auth.userId;
    if (auth.roles.includes("student")) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });

    // resolve employeeId from userId if not provided
    let eid = employeeId;
    if (!eid) {
      const hr = await (db as any).employeeHR.findUnique({ where:{ userId: targetUserId }}).catch(()=>null);
      eid = hr?.employeeId || "";
    }
    if (!eid) return NextResponse.json({ success:true, data:[], mandatory: MANDATORY_TYPES });

    // private doc center: only own, HR, SuperAdmin
    const canView = canViewEmployeeProfile(auth, targetUserId, eid);
    if (!canView) return NextResponse.json({ success:false, error:"Access denied to document center" }, { status:403 });

    const docs = await (db as any).employeeDocument.findMany({ where:{ employeeId: eid, isDeleted:false }, orderBy:{ updatedAt:'desc' }, include:{ versions:true } }).catch(async()=>{
      return await (db as any).employeeDocument.findMany({ where:{ employeeId: eid }, orderBy:{ updatedAt:'desc' } }).catch(()=>[]);
    });

    const missing = MANDATORY_TYPES.filter(t=> !docs.some((d:any)=> (d.documentType||'').toLowerCase()===t));
    const withHistory = await Promise.all(docs.map(async(d:any)=>{
      const versions = await (db as any).employeeDocumentVersion.findMany({ where:{ documentId: d.id }, orderBy:{ version:'desc' } }).catch(()=>[]);
      return { ...d, versions, isDeletable: false }; // no mandatory doc can be deleted
    }));

    return NextResponse.json({ success:true, data: withHistory, mandatory: MANDATORY_TYPES, missing, canUpload: true });
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    const body = await request.json().catch(()=>({}));
    const { employeeId, documentType, filePath, fileName, fileSize, mimeType, expiryDate, title, isMandatory } = body;
    if (!employeeId || !documentType || !filePath) return NextResponse.json({ success:false, error:"employeeId, documentType, filePath required" }, { status:400 });
    if (!MANDATORY_TYPES.includes(String(documentType).toLowerCase()) && !['other'].includes(String(documentType).toLowerCase())) {
      // allow any but track mandatory
    }
    // check target employee HR exists
    const targetHr = await (db as any).employeeHR.findUnique({ where:{ employeeId } }).catch(()=>null);
    const targetUserId = targetHr?.userId || "";
    // Only own or HR can upload? Per spec: every employee must upload mandatory documents — employee uploads own, HR can upload on behalf
    const isOwner = auth.userId === targetUserId;
    if (!isOwner && !isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Cannot upload for other employee" }, { status:403 });

    // Find existing doc of same type
    const existing = await (db as any).employeeDocument.findFirst({ where:{ employeeId, documentType } }).catch(()=>null);
    let doc;
    if (existing) {
      // create version history, update to new version, soft archive old version
      const newVersion = (existing.version||1)+1;
      await (db as any).employeeDocumentVersion.create({ data:{
        documentId: existing.id,
        employeeDocumentId: existing.id,
        version: existing.version||1,
        filePath: existing.filePath,
        fileName: existing.fileName,
        uploadedBy: existing.uploadedBy || targetUserId,
        status: 'superseded',
        fileHash: (existing as any).fileHash || "",
      }}).catch(()=>{});
      doc = await (db as any).employeeDocument.update({ where:{ id: existing.id }, data:{
        filePath, fileName: fileName||existing.fileName, fileSize: fileSize||0, mimeType: mimeType||"", expiryDate: expiryDate||"", title: title||"", version: newVersion, status:'pending', uploadedBy: auth.userId, isMandatory: isMandatory ?? MANDATORY_TYPES.includes(String(documentType).toLowerCase())
      }});
      await logHrmAudit({ actor: auth, action:'UPDATE_DOCUMENT', entityType:'EmployeeDocument', entityId: doc.id, employeeId, oldValue: existing, newValue: doc });
    } else {
      doc = await (db as any).employeeDocument.create({ data:{
        employeeId, documentType, title: title||"", filePath, fileName: fileName||"", fileSize: fileSize||0, mimeType: mimeType||"", expiryDate: expiryDate||"", status:'pending', uploadedBy: auth.userId, version:1, isMandatory: isMandatory ?? MANDATORY_TYPES.includes(String(documentType).toLowerCase())
      }});
      await logHrmAudit({ actor: auth, action:'CREATE_DOCUMENT', entityType:'EmployeeDocument', entityId: doc.id, employeeId, newValue: doc });
    }

    return NextResponse.json({ success:true, data: doc });
  })(req);
}

// DELETE is soft-delete only, and mandatory docs cannot be deleted
export async function DELETE(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ success:false, error:"id required" }, { status:400 });
    const doc = await (db as any).employeeDocument.findUnique({ where:{ id }}).catch(()=>null);
    if (!doc) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });
    if (MANDATORY_TYPES.includes(String(doc.documentType).toLowerCase())) {
      return NextResponse.json({ success:false, error:"Mandatory document cannot be deleted — only version update allowed" }, { status:400 });
    }
    if (!isHR(auth) && !isSuperAdmin(auth) && auth.userId !== doc.uploadedBy) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const updated = await (db as any).employeeDocument.update({ where:{ id }, data:{ isDeleted:true, deletedAt: new Date(), deletedBy: auth.userId }});
    await logHrmAudit({ actor: auth, action:'SOFT_DELETE_DOCUMENT', entityType:'EmployeeDocument', entityId: id, employeeId: doc.employeeId, oldValue: doc, newValue: updated });
    return NextResponse.json({ success:true, data: updated });
  })(req);
}
