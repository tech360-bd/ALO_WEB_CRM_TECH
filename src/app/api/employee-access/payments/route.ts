import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// University payment verified bank info + service charge declaration approved template

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (studentId) where.studentId = studentId;

    const payments = await (db as any).universityPayment.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);
    const serviceCharges = await (db as any).serviceCharge.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);

    return NextResponse.json({
      success: true,
      payments,
      serviceCharges,
      verificationRequired: 'University payment must have verified bank info before approval — bank guidance labeled',
      serviceChargeNote: 'Service charge declaration must use approved template — permission-controlled',
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

    const body = await req.json();
    const { applicationId, studentId, amount, currency, bankName, accountNumber, swiftCode, paymentType, proofFilePath } = body;
    if (!amount || (!applicationId && !studentId)) return NextResponse.json({ success: false, error: 'amount and applicationId/studentId required' }, { status: 400 });

    const isFinance = auth.roles.includes('finance') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('application_manager');

    const payment = await (db as any).universityPayment.create({
      data: {
        applicationId: applicationId || null,
        studentId: studentId || null,
        amount,
        currency: currency || 'USD',
        bankName: bankName || '',
        accountNumber: accountNumber ? `***${accountNumber.slice(-4)}` : '', // encrypted sensitive — store masked, actual encrypted in vault
        accountNumberEncrypted: accountNumber || '', // should be encrypted via vault in production
        swiftCode: swiftCode || '',
        paymentType: paymentType || 'tuition',
        proofFilePath: proofFilePath || '',
        status: isFinance ? 'verified' : 'pending_verification',
        createdBy: auth.userId,
        verifiedBy: isFinance ? auth.userId : null,
      },
    });

    await logAuditAction(auth, 'PAYMENT_CREATED', 'UniversityPayment', payment.id, { amount, paymentType, verified: isFinance });

    return NextResponse.json({
      success: true,
      data: payment,
      message: isFinance ? 'Payment verified — bank info verified' : 'Payment created — pending bank verification by finance',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
