import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RBAC: Only super_admin, admin, hr_manager, finance can access payroll
  const userRoles = auth.user.roles?.map((r: { name: string }) => r.name) ?? [];
  const canAccessPayroll = userRoles.includes('super_admin') || userRoles.includes('admin') || userRoles.includes('hr_manager') || userRoles.includes('finance');
  if (!canAccessPayroll) {
    return NextResponse.json({ error: 'Forbidden — payroll access requires finance or HR role' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || '';
    const month = searchParams.get('month') || '';
    const year = searchParams.get('year') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const [payslips, total] = await Promise.all([
      db.payslip.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          employee: {
            select: { id: true, employeeId: true, firstName: true, lastName: true, profilePhoto: true }
          }
        }
      }),
      db.payslip.count({ where })
    ]);

    // Summary
    const totalNetSalary = await db.payslip.aggregate({
      _sum: { netSalary: true, basicSalary: true, totalAllowance: true, totalDeduction: true },
      where,
    });

    return NextResponse.json({
      payslips,
      summary: {
        totalNetSalary: totalNetSalary._sum.netSalary || 0,
        totalBasicSalary: totalNetSalary._sum.basicSalary || 0,
        totalAllowance: totalNetSalary._sum.totalAllowance || 0,
        totalDeduction: totalNetSalary._sum.totalDeduction || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Payroll GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { employeeId, month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // If employeeId is provided, generate for single employee; otherwise for all active employees
    const employees = employeeId
      ? await db.employee.findMany({ where: { id: employeeId, status: 'active' } })
      : await db.employee.findMany({ where: { status: 'active' } });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found' },
        { status: 404 }
      );
    }

    const payslips = [];

    for (const emp of employees) {
      // Check if payslip already exists for this month/year
      const existing = await db.payslip.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } }
      });

      if (existing) continue; // Skip if already exists

      // Get salary structure
      const salaryStructure = await db.salaryStructure.findUnique({
        where: { employeeId: emp.id }
      });

      const basicSalary = salaryStructure?.basicSalary || emp.salary * 0.6;
      const houseRent = salaryStructure?.houseRent || emp.salary * 0.2;
      const medical = salaryStructure?.medical || emp.salary * 0.05;
      const transport = salaryStructure?.transport || emp.salary * 0.05;
      const food = salaryStructure?.food || emp.salary * 0.05;
      const otherAllowance = salaryStructure?.otherAllowance || emp.salary * 0.05;

      const totalAllowance = houseRent + medical + transport + food + otherAllowance;
      const totalDeduction = (salaryStructure?.taxDeduction || 0) + (salaryStructure?.providentFund || 0);
      const netSalary = basicSalary + totalAllowance - totalDeduction;

      const payslip = await db.payslip.create({
        data: {
          employeeId: emp.id,
          month,
          year,
          basicSalary,
          totalAllowance,
          totalDeduction,
          netSalary,
          status: 'draft',
        },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      });

      payslips.push(payslip);
    }

    return NextResponse.json({
      message: `Generated ${payslips.length} payslips`,
      payslips,
    }, { status: 201 });
  } catch (error) {
    console.error('Payroll POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
