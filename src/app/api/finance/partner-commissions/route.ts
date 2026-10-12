import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

class CommissionMutationError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const FINANCE_ROLES = new Set(['finance', 'finance_officer', 'accounting', 'ceo']);
function canManageCommissions(auth: AuthContext) {
  return ['admin', 'super_admin'].includes(auth.userType.toLowerCase()) ||
    auth.roles.some((role) => ['admin', 'super_admin', ...FINANCE_ROLES].includes(role.toLowerCase())) ||
    FINANCE_ROLES.has(auth.userType.toLowerCase());
}
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).origin === new URL(request.url).origin;
}

/** Finance and authorised management roles can view cross-tenant payout records. */
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!canManageCommissions(auth)) return NextResponse.json({ success: false, error: 'Finance role is required.' }, { status: 403 });
    const employee = await db.employee.findFirst({ where: { userId: auth.userId }, select: { status: true } });
    if (employee && employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Employee account is not active.' }, { status: 403 });
    try {
      const { searchParams } = new URL(req.url);
      const search = (searchParams.get('search') || '').trim().slice(0, 191);
      const status = (searchParams.get('status') || '').trim();
      const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10) || 50));
      const where: Record<string, unknown> = { commissionExpected: { gt: 0 } };
      if (status) {
        const statuses = [...new Set(status.split(',').map((value) => value.trim()).filter(Boolean).flatMap((value) => [value, value.toLowerCase(), value.toUpperCase()]))];
        where.commissionStatus = { in: statuses };
      }
      if (search) {
        where.OR = [
          { studentName: { contains: search } },
          { studentEmail: { contains: search } },
          { studentPhone: { contains: search } },
          { partnerName: { contains: search } },
          { partnerRef: { contains: search } },
          { studentId: { contains: search } },
        ];
      }

      const [leads, total, totals] = await Promise.all([
        db.partnerLead.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true, studentId: true, studentName: true, studentEmail: true, studentPhone: true,
            destinationCountry: true, studyLevel: true, intake: true, partnerId: true, partnerName: true,
            partnerRef: true, status: true, commissionExpected: true, commissionReceived: true,
            commissionStatus: true, createdAt: true, updatedAt: true,
          },
        }),
        db.partnerLead.count({ where }),
        db.partnerLead.aggregate({ where, _sum: { commissionExpected: true, commissionReceived: true } }),
      ]);
      const expected = Number(totals._sum.commissionExpected || 0);
      const received = Number(totals._sum.commissionReceived || 0);
      return NextResponse.json({
        success: true,
        data: leads,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { leadCount: total, expected, received, outstanding: Math.max(0, expected - received) },
      });
    } catch (error) {
      console.error('[FINANCE PARTNER COMMISSION GET] Error:', error);
      return NextResponse.json({ success: false, error: 'Partner commission records could not be loaded.' }, { status: 500 });
    }
  })(request);
}

/** Record a payout atomically; every change is retained in PortalAuditLog. */
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!canManageCommissions(auth)) return NextResponse.json({ success: false, error: 'Finance role is required.' }, { status: 403 });
    if (!sameOrigin(req)) return NextResponse.json({ success: false, error: 'Cross-origin commission mutation denied.' }, { status: 403 });

    const employee = await db.employee.findFirst({ where: { userId: auth.userId }, select: { status: true } });
    if (employee && employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'Employee account is not active.' }, { status: 403 });
    }

    try {
      const body = await req.json().catch(() => null);
      const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
      const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount);
      const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
      if (!leadId || leadId.length > 191) return NextResponse.json({ success: false, error: 'A valid leadId is required.' }, { status: 400 });
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return NextResponse.json({ success: false, error: 'Amount must be a positive finite number within the supported limit.' }, { status: 400 });
      if (notes.length > 1000) return NextResponse.json({ success: false, error: 'Payment notes may not exceed 1,000 characters.' }, { status: 400 });
      const roundedAmount = Math.round(amount * 100) / 100;

      const result = await db.$transaction(async (tx) => {
        const lead = await tx.partnerLead.findUnique({ where: { id: leadId } });
        if (!lead) throw new CommissionMutationError('Partner commission record not found.', 404);
        const expected = Math.round(Math.max(0, Number(lead.commissionExpected || 0)) * 100) / 100;
        const alreadyReceived = Math.round(Math.max(0, Number(lead.commissionReceived || 0)) * 100) / 100;
        const remaining = Math.max(0, expected - alreadyReceived);
        if (expected <= 0) throw new CommissionMutationError('A commission expectation must be recorded before payment.', 409);
        if (remaining <= 0) throw new CommissionMutationError('This commission has already been paid in full.', 409);
        if (roundedAmount > remaining) throw new CommissionMutationError('Payment exceeds the remaining commission balance.', 409);

        const received = Math.round((alreadyReceived + roundedAmount) * 100) / 100;
        const commissionStatus = received >= expected ? 'paid' : 'partial';
        const updated = await tx.partnerLead.updateMany({
          where: { id: lead.id, commissionReceived: lead.commissionReceived },
          data: { commissionReceived: received, commissionStatus },
        });
        if (updated.count !== 1) throw new CommissionMutationError('The commission changed concurrently. Reload and retry.', 409);

        const totals = await tx.partnerLead.aggregate({
          where: { partnerId: lead.partnerId },
          _sum: { commissionExpected: true, commissionReceived: true },
        });
        await tx.partnerProfile.updateMany({
          where: { partnerId: lead.partnerId },
          data: {
            commissionPending: Math.max(0, Number(totals._sum.commissionExpected || 0) - Number(totals._sum.commissionReceived || 0)),
            commissionPaid: Number(totals._sum.commissionReceived || 0),
          },
        });
        const updatedLead = await tx.partnerLead.findUnique({
          where: { id: lead.id },
          select: { id: true, partnerId: true, partnerName: true, studentName: true, commissionExpected: true, commissionReceived: true, commissionStatus: true },
        });
        await tx.portalAuditLog.create({
          data: {
            actorUserId: auth.userId,
            action: 'COMMISSION_PAYMENT_RECORDED',
            entityType: 'PartnerLead',
            entityId: lead.id,
            metadata: JSON.stringify({ partnerId: lead.partnerId, amount: roundedAmount, commissionStatus, beforeReceived: alreadyReceived, afterReceived: received, notes, actorRole: auth.userType, actorRoles: auth.roles }),
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
            userAgent: req.headers.get('user-agent') || '',
          },
        });
        return { lead: updatedLead, amount: roundedAmount, commissionStatus };
      });

      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (error) {
      if (error instanceof CommissionMutationError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
      console.error('[FINANCE PARTNER COMMISSION POST] Error:', error);
      return NextResponse.json({ success: false, error: 'Failed to record partner commission payment.' }, { status: 500 });
    }
  })(request);
}
