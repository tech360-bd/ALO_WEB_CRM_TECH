import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { logHrmAudit } from "@/lib/hrms/audit";

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    const body = await request.json().catch(()=>({}));
    const { agreementId, policyId, signatureType } = body;
    const id = agreementId || policyId;
    if (!id) return NextResponse.json({ success:false, error:"agreementId required" }, { status:400 });

    // resolve employeeId from auth
    const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const employeeId = hr?.employeeId || auth.userId;

    const agreement = await (db as any).employeeAgreement.findUnique({ where:{ id }}).catch(()=>null);
    const policy = !agreement ? await (db as any).hrmHrPolicy.findUnique({ where:{ id }}).catch(()=>null) : null;
    const target = agreement || policy;
    if (!target) return NextResponse.json({ success:false, error:"Agreement/Policy not found" }, { status:404 });

    const version = target.version || 1;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
    const ua = request.headers.get('user-agent') || '';

    // prevent duplicate acceptance same version
    const existing = await (db as any).employeeAgreementAcceptance.findFirst({ where:{ agreementId: id, employeeId, version } }).catch(()=>null);
    if (existing) return NextResponse.json({ success:true, data: existing, message:"Already accepted" });

    let acceptance;
    if (agreement) {
      acceptance = await (db as any).employeeAgreementAcceptance.create({ data:{
        agreementId: id,
        employeeId,
        version,
        ipAddress: ip,
        userAgent: ua,
        signatureType: signatureType || 'digital_acceptance',
      }});
    } else {
      // For HrmHrPolicy, store as EmployeeAgreementAcceptance with agreementId = policyId (unified)
      acceptance = await (db as any).employeeAgreementAcceptance.create({ data:{
        agreementId: id,
        employeeId,
        version,
        ipAddress: ip,
        userAgent: ua,
        signatureType: signatureType || 'digital_acceptance',
      }}).catch(async()=>{
        // fallback create audit only
        return { id, employeeId, version, acceptedAt: new Date(), ipAddress: ip };
      });
    }

    await logHrmAudit({ actor: auth, action:'ACCEPT_AGREEMENT', entityType:'EmployeeAgreement', entityId: id, employeeId, newValue: { version, ip, ua }});

    return NextResponse.json({ success:true, data: acceptance });
  })(req);
}
