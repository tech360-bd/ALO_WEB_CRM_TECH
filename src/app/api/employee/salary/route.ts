import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// Own-salary endpoint. HR/payroll administration uses separate, explicitly gated APIs.
export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    const roles = [auth.userType, ...(auth.roles || [])].map((role: string) => role.trim().toUpperCase());
    if (roles.some((role: string) => ['STUDENT', 'PARTNER'].includes(role))) {
      return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
    }
    const employee = await db.employee.findUnique({
      where: { userId: auth.userId },
      select: { id: true, userId: true, employeeId: true, status: true },
    });
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
    }
    if (!auth.permissions.includes('h6')) {
      return NextResponse.json({ success: false, error: 'Own-salary permission is required.' }, { status: 403 });
    }

    try {
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
        select: { employeeId: true },
      });
      const employeeIds = [...new Set([employee.id, employee.userId, employee.employeeId, profile?.employeeId].filter((value): value is string => Boolean(value)))];
      const [salaryRecords, commissions, bonuses, increments] = await Promise.all([
        db.employeeSalary.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { effectiveFrom: 'desc' },
          select: { id: true, basicSalary: true, housingAllow: true, transportAllow: true, medicalAllow: true, otherAllow: true, grossSalary: true, taxDeduction: true, pfDeduction: true, netSalary: true, currency: true, effectiveFrom: true, createdAt: true },
        }),
        db.employeeCommission.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, currency: true, status: true, period: true, paidAt: true, createdAt: true },
        }),
        db.employeeBonus.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, currency: true, period: true, status: true, paidAt: true, createdAt: true },
        }),
        db.employeeIncrement.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, previousAmount: true, newAmount: true, incrementType: true, effectiveFrom: true, createdAt: true },
        }),
      ]);
      const currentSalary = salaryRecords[0] || null;
      const totalPendingCommission = commissions.filter((commission) => commission.status === 'pending').reduce((sum, commission) => sum + commission.amount, 0);
      const totalPaidCommission = commissions.filter((commission) => commission.status === 'paid').reduce((sum, commission) => sum + commission.amount, 0);
      const totalPaidBonus = bonuses.filter((bonus) => bonus.status === 'approved').reduce((sum, bonus) => sum + bonus.amount, 0);

      // Salary values are sensitive; do not return them if the access record cannot be persisted.
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'EMPLOYEE_OWN_SALARY_VIEWED',
          entityType: 'EmployeeSalary',
          entityId: employee.id,
          metadata: JSON.stringify({ effectiveUserId: auth.userId, recordCounts: { salary: salaryRecords.length, commissions: commissions.length, bonuses: bonuses.length, increments: increments.length }, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          salary: { current: currentSalary, history: salaryRecords },
          commissions: { records: commissions, summary: { totalPending: totalPendingCommission, totalPaid: totalPaidCommission, total: totalPendingCommission + totalPaidCommission, count: commissions.length } },
          bonuses,
          increments,
          financialSummary: {
            currentNetSalary: currentSalary?.netSalary || 0,
            totalCommissionsEarned: totalPaidCommission,
            totalBonusesEarned: totalPaidBonus,
            lastIncrement: increments[0] || null,
          },
        },
      }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch (error) {
      console.error('Employee salary GET error:', error);
      return NextResponse.json({ success: false, error: 'Salary information is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}
