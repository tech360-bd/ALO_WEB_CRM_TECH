import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const agreementId = searchParams.get('agreementId');
    const employeeId = searchParams.get('employeeId') || auth.userId;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager');
    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const where: any = { employeeId };
    if (agreementId) where.agreementId = agreementId;

    const acceptances = await (db as any).employeeAgreementAcceptance.findMany({ where, orderBy: { acceptedAt: 'desc' } }).catch(() => []);

    return NextResponse.json({ success: true, acceptances, note: 'Acceptance history cannot be overwritten — immutable' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { agreementId, version, signatureType } = body;
    if (!agreementId) return NextResponse.json({ success: false, error: 'agreementId required' }, { status: 400 });

    const agreement = await (db as any).employeeAgreement.findUnique({ where: { id: agreementId } }).catch(() => null);
    if (!agreement) return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 });

    const acceptance = await (db as any).employeeAgreementAcceptance.create({
      data: {
        agreementId,
        employeeId: auth.userId,
        version: version || agreement.version || 1,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        device: req.headers.get('user-agent') || '',
        userAgent: req.headers.get('user-agent') || '',
        signatureType: signatureType || 'digital_acceptance',
      },
    });

    await logAuditAction(auth, 'AGREEMENT_ACCEPTED', 'EmployeeAgreement', agreementId, {
      version: acceptance.version,
      signatureType,
      ip: acceptance.ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: acceptance,
      message: 'Digital acceptance recorded with timestamp, IP, device — history immutable, not checkbox as legally valid unless configured',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
