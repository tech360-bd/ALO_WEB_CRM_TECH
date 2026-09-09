import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE SALARY API
// GET — Returns EmployeeSalary, EmployeeCommission, EmployeeBonus,
//       EmployeeIncrement for the authenticated employee
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.employeeId || auth.userId;

      // Fetch salary records
      let salaryRecords: unknown[] = [];
      try {
        salaryRecords = await db.employeeSalary.findMany({
          where: { employeeId },
          orderBy: { effectiveFrom: 'desc' },
        });
      } catch {
        // Table may not exist
      }

      // Current salary (latest)
      const currentSalary = salaryRecords.length > 0 ? salaryRecords[0] : null;

      // Fetch commissions
      let commissions: unknown[] = [];
      try {
        commissions = await db.employeeCommission.findMany({
          where: { employeeId },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Table may not exist
      }

      // Commission summary
      const totalPendingCommission = (commissions as Array<{ amount: number; status: string }>)
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);
      const totalPaidCommission = (commissions as Array<{ amount: number; status: string }>)
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);

      // Fetch bonuses
      let bonuses: unknown[] = [];
      try {
        bonuses = await db.employeeBonus.findMany({
          where: { employeeId },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Table may not exist
      }

      // Fetch increments
      let increments: unknown[] = [];
      try {
        increments = await db.employeeIncrement.findMany({
          where: { employeeId },
          orderBy: { createdAt: 'desc' },
        });
      } catch {
        // Table may not exist
      }

      return NextResponse.json({
        success: true,
        data: {
          salary: {
            current: currentSalary,
            history: salaryRecords,
          },
          commissions: {
            records: commissions,
            summary: {
              totalPending: totalPendingCommission,
              totalPaid: totalPaidCommission,
              total: totalPendingCommission + totalPaidCommission,
              count: commissions.length,
            },
          },
          bonuses,
          increments,
          financialSummary: {
            currentNetSalary: (currentSalary as Record<string, number> | null)?.netSalary || 0,
            totalCommissionsEarned: totalPaidCommission,
            totalBonusesEarned: (bonuses as Array<{ amount: number; status: string }>)
              .filter(b => b.status === 'approved')
              .reduce((sum, b) => sum + b.amount, 0),
            lastIncrement: increments.length > 0 ? increments[0] : null,
          },
        },
      });
    } catch (error) {
      console.error('Employee salary GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: {
            salary: { current: null, history: [] },
            commissions: { records: [], summary: { totalPending: 0, totalPaid: 0, total: 0, count: 0 } },
            bonuses: [],
            increments: [],
            financialSummary: {
              currentNetSalary: 0,
              totalCommissionsEarned: 0,
              totalBonusesEarned: 0,
              lastIncrement: null,
            },
          },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load salary information' },
        { status: 500 }
      );
    }
  })(request);
}
