import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const where: any = {};
    if (type) where.type = type;

    const agreements = await (db as any).employeeAgreement.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      agreements,
      types: ['appointment_letter','hr_policy','company_policy','leave_policy','salary_policy','notice_policy','provident_fund_policy','gratuity_policy','security_policy','confidentiality_policy','international_employment_agreement','bangladesh_employment_agreement'],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'HR/Admin/Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { title, type, content, fileUrl } = body;
    if (!title || !type) return NextResponse.json({ success: false, error: 'title and type required' }, { status: 400 });

    const agreement = await (db as any).employeeAgreement.create({
      data: {
        title,
        type,
        content: content || '',
        fileUrl: fileUrl || '',
        version: 1,
        status: 'active',
        createdBy: auth.userId,
      },
    });

    await logAuditAction(auth, 'HR_AGREEMENT_CREATED', 'EmployeeAgreement', agreement.id, { title, type });

    return NextResponse.json({ success: true, data: agreement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
