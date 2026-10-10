import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

const FINANCE_ROLES = new Set(['finance', 'finance_officer', 'accounting', 'ceo']);
function canReadFinance(auth: AuthContext) {
  return ['admin', 'super_admin'].includes(auth.userType.toLowerCase()) ||
    auth.roles.some((role) => ['admin', 'super_admin', ...FINANCE_ROLES].includes(role.toLowerCase())) ||
    FINANCE_ROLES.has(auth.userType.toLowerCase());
}

export async function GET(request: Request) {
  return withAuth(async (_req, auth) => {
    if (!canReadFinance(auth)) return NextResponse.json({ success: false, error: 'Finance role is required.' }, { status: 403 });
    try {
      const [payments, employeeCommissions, partnerLeadTotals] = await Promise.all([
        db.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
        db.employeeCommission.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }),
        db.partnerLead.aggregate({ _sum: { commissionExpected: true, commissionReceived: true } }),
      ]);

      const revenue = payments.filter((payment) => payment.status.toUpperCase() === 'PAID').reduce((sum, payment) => sum + payment.amount, 0);
      const pendingPayments = payments.filter((payment) => payment.status.toUpperCase() === 'PENDING');
      const paymentCommissions = payments.filter((payment) => payment.type.toUpperCase() === 'COMMISSION');
      const leadExpected = Number(partnerLeadTotals._sum.commissionExpected || 0);
      const leadReceived = Number(partnerLeadTotals._sum.commissionReceived || 0);
      const byType: Record<string, number> = {};
      for (const payment of payments) byType[payment.type] = (byType[payment.type] || 0) + (payment.status.toUpperCase() === 'PAID' ? payment.amount : 0);

      return NextResponse.json({
        success: true,
        metrics: {
          totalRevenue: revenue,
          pendingPayments: pendingPayments.length,
          partnerCommissionPending: Math.max(0, leadExpected - leadReceived),
          partnerCommissionPaid: leadReceived,
          paymentCommissionPending: paymentCommissions.filter((payment) => payment.commissionStatus?.toUpperCase() === 'PENDING').reduce((sum, payment) => sum + (payment.commissionAmount || 0), 0),
          paymentCommissionPaid: paymentCommissions.filter((payment) => payment.commissionStatus?.toUpperCase() === 'PAID').reduce((sum, payment) => sum + (payment.commissionAmount || 0), 0),
          employeeCommissionPending: employeeCommissions.filter((commission) => commission.status.toUpperCase() === 'PENDING').reduce((sum, commission) => sum + commission.amount, 0),
          employeeCommissionPaid: employeeCommissions.filter((commission) => commission.status.toUpperCase() === 'PAID').reduce((sum, commission) => sum + commission.amount, 0),
        },
        revenueByType: byType,
        recentPayments: payments.slice(0, 15),
        partnerCommissions: paymentCommissions.slice(0, 10),
        employeeCommissions: employeeCommissions.slice(0, 10),
      });
    } catch (error) {
      console.error('[FINANCE DASHBOARD] GET error:', error);
      return NextResponse.json({ success: false, error: 'Finance dashboard data could not be loaded.' }, { status: 500 });
    }
  })(request);
}
