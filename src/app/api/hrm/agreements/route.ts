import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "";
    const employeeId = url.searchParams.get("employeeId") || "";

    let where: any = { status: 'active' };
    if (type) where.type = type;

    const agreements = await (db as any).employeeAgreement.findMany({ where, orderBy:{ updatedAt:'desc' }, include:{ acceptances:true } }).catch(()=> []);
    const policies = await (db as any).hrmHrPolicy.findMany({ where:{ status:'active' }, orderBy:{ updatedAt:'desc' } }).catch(()=>[]);

    // if employeeId, enrich with acceptance status
    let acceptances: any[] = [];
    if (employeeId) {
      acceptances = await (db as any).employeeAgreementAcceptance.findMany({ where:{ employeeId }, orderBy:{ acceptedAt:'desc' } }).catch(()=>[]);
    }

    return NextResponse.json({ success:true, data:{ agreements, policies, acceptances, categories:[
      'appointment_letter','hr_policy','company_policy','leave_policy','salary_policy','notice_policy','pf_policy','gratuity_policy','security_policy','confidentiality_policy','international_agreement','bangladesh_agreement'
    ]}});
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Only HR/Super Admin can create agreements/policies" }, { status:403 });
    const body = await request.json().catch(()=> ({}));
    const { title, type, content, fileUrl, category } = body;
    if (!title) return NextResponse.json({ success:false, error:"title required" }, { status:400 });

    // HR Agreement Center: also support HrmHrPolicy creation when category provided
    if (category && ['HR_POLICY','COMPANY_POLICY','LEAVE_POLICY','SALARY_POLICY','NOTICE_POLICY','PF_POLICY','GRATUITY_POLICY','SECURITY_POLICY','CONFIDENTIALITY_POLICY'].includes(String(category).toUpperCase())) {
      const policy = await (db as any).hrmHrPolicy.create({ data:{ title, category: category.toUpperCase(), content: content||"", fileUrl: fileUrl||"", version:1, createdBy: auth.userId }});
      await logHrmAudit({ actor: auth, action:'CREATE_POLICY', entityType:'HrmHrPolicy', entityId: policy.id, newValue: policy });
      return NextResponse.json({ success:true, data: policy });
    }

    const agreement = await (db as any).employeeAgreement.create({ data:{
      title, type: (type||'appointment_letter').toLowerCase(), content: content||"", fileUrl: fileUrl||"", version:1, createdBy: auth.userId, status:'active'
    }});
    await logHrmAudit({ actor: auth, action:'CREATE_AGREEMENT', entityType:'EmployeeAgreement', entityId: agreement.id, newValue: agreement });
    return NextResponse.json({ success:true, data: agreement });
  })(req);
}

export async function PUT(req: Request) {
  return withAuth(async (request, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success:false, error:"Forbidden" }, { status:403 });
    const body = await request.json().catch(()=>({}));
    const { id, title, content, fileUrl } = body;
    if (!id) return NextResponse.json({ success:false, error:"id required" }, { status:400 });
    const existing = await (db as any).employeeAgreement.findUnique({ where:{ id }}).catch(()=>null);
    if (!existing) {
      const pol = await (db as any).hrmHrPolicy.findUnique({ where:{ id }}).catch(()=>null);
      if (!pol) return NextResponse.json({ success:false, error:"Not found" }, { status:404 });
      const updatedPol = await (db as any).hrmHrPolicy.update({ where:{ id }, data:{ title: title||pol.title, content: content||pol.content, fileUrl: fileUrl||pol.fileUrl, version:{ increment:1 } }});
      await logHrmAudit({ actor: auth, action:'UPDATE_POLICY', entityType:'HrmHrPolicy', entityId: id, oldValue: pol, newValue: updatedPol });
      return NextResponse.json({ success:true, data: updatedPol });
    }
    const updated = await (db as any).employeeAgreement.update({ where:{ id }, data:{
      title: title||existing.title, content: content||existing.content, fileUrl: fileUrl||existing.fileUrl, version:{ increment:1 }
    }});
    // archive old version
    await (db as any).employeeDocumentVersion.create({ data:{ documentId: existing.id, agreementId: existing.id, version: existing.version, filePath: existing.fileUrl||"", fileName: existing.title, uploadedBy: existing.createdBy||auth.userId, status:'archived' }}).catch(()=>{});
    await logHrmAudit({ actor: auth, action:'UPDATE_AGREEMENT', entityType:'EmployeeAgreement', entityId: id, oldValue: existing, newValue: updated });
    return NextResponse.json({ success:true, data: updated });
  })(req);
}
