import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { checkSeparationOfDuties } from '@/lib/employee-access-engine';

// ============================================================================
// /api/employee-access/payments
//
// UNIVERSITY PAYMENT SYSTEM (spec): counselor/application/finance PREPARES
// payment instructions (university, type, amount, currency, deadline, bank
// info, account name/number, SWIFT, IBAN, reference, invoice, link, method,
// required documents). A finance-authorized user VERIFIES. The maker can
// never verify their own payment (Separation of Duties). Account numbers are
// stored masked only. Persists on the REAL model ApplicationPaymentInstruction.
// ============================================================================

const PREPARER_ROLES = ['finance', 'finance_officer', 'application_manager', 'application_team', 'counselor', 'senior_counselor', 'super_admin'];
const VERIFIER_ROLES = ['finance', 'finance_officer', 'super_admin'];

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const where: any = {};
    if (searchParams.get('applicationId')) where.applicationId = searchParams.get('applicationId');
    if (searchParams.get('status')) where.status = searchParams.get('status');

    const payments = await db.applicationPaymentInstruction.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []);
    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles.map((r) => r.toLowerCase());
    if (!roles.some((r) => PREPARER_ROLES.includes(r))) {
      return NextResponse.json({ success: false, error: 'Forbidden: payment preparation requires an authorized role' }, { status: 403 });
    }

    const body = await req.json();
    const {
      applicationId, studentId, paymentType, amount, currency, deadline,
      universityName, bankName, accountName, accountNumber, swiftCode, iban,
      paymentReference, invoiceUrl, paymentLink, paymentMethod, requiredDocuments, instruction,
    } = body;
    if (!amount || (!applicationId && !studentId)) {
      return NextResponse.json({ success: false, error: 'amount and applicationId/studentId required' }, { status: 400 });
    }

    const payment = await db.applicationPaymentInstruction.create({
      data: {
        applicationId: applicationId || '',
        studentId: studentId || '',
        paymentType: paymentType || 'tuition',
        amount,
        currency: currency || 'USD',
        deadline: deadline || '',
        universityName: universityName || '',
        bankName: bankName || '',
        accountName: accountName || '',
        // Spec: sensitive bank data is never stored raw in the record.
        accountNumberMasked: accountNumber ? `***${String(accountNumber).slice(-4)}` : '',
        swiftCode: swiftCode || '',
        iban: iban || '',
        paymentReference: paymentReference || '',
        invoiceUrl: invoiceUrl || '',
        paymentLink: paymentLink || '',
        paymentMethod: paymentMethod || '',
        requiredDocuments: requiredDocuments || '',
        instruction: instruction || '',
        preparedBy: auth.userId,
        status: 'PREPARED',
      },
    });

    await logAuditAction(auth, 'PAYMENT_PREPARED', 'ApplicationPaymentInstruction', payment.id, {
      amount, currency: payment.currency, paymentType: payment.paymentType, preparedBy: auth.userId,
    });

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment instruction PREPARED — pending finance verification before it may be sent to the student',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles.map((r) => r.toLowerCase());
    if (!roles.some((r) => VERIFIER_ROLES.includes(r))) {
      return NextResponse.json({ success: false, error: 'Forbidden: payment verification requires finance authority' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, note } = body;
    if (!id || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'id and action (verify|reject) required' }, { status: 400 });
    }

    const existing = await db.applicationPaymentInstruction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Payment instruction not found' }, { status: 404 });

    // Separation of Duties: the preparer can NEVER verify their own payment.
    const sod = await checkSeparationOfDuties(existing.preparedBy, auth.userId, 'FINANCE_VERIFY');
    if (!sod.allowed && existing.preparedBy === auth.userId) {
      return NextResponse.json({ success: false, error: 'Separation of Duties: you cannot verify a payment you prepared (MAKER → REVIEWER → APPROVER)' }, { status: 403 });
    }

    const updated = await db.applicationPaymentInstruction.update({
      where: { id },
      data: {
        status: action === 'verify' ? 'VERIFIED' : 'REJECTED',
        verifiedBy: auth.userId,
        verifiedAt: new Date(),
        instruction: note || existing.instruction,
      },
    });

    await logAuditAction(auth, action === 'verify' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED', 'ApplicationPaymentInstruction', id, {
      preparedBy: existing.preparedBy, verifiedBy: auth.userId, note: note || '',
    });

    return NextResponse.json({ success: true, data: updated, message: `Payment instruction ${action === 'verify' ? 'VERIFIED — safe to communicate to the student via approved templates' : 'REJECTED'}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
