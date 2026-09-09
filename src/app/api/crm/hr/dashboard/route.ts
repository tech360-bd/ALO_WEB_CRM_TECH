import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // First try to fetch actual Employee models
      let employees = await db.employee.findMany({
        take: 50,
      });

      // If empty, fetch Users as fallback for a basic directory
      if (employees.length === 0) {
        const users = await db.user.findMany({ take: 50 });
        employees = users.map((u: any) => ({
          id: u.id,
          userId: u.id,
          department: u.role || 'General',
          position: u.role || 'Staff',
          status: 'Active',
          branchId: 'default',
          joiningDate: u.createdAt
        })) as any;
      }

      const totalEmployees = await db.employee.count();
      const userCount = await db.user.count();
      const headcount = totalEmployees || userCount;

      return NextResponse.json({
        success: true,
        data: {
          employeeDirectory: employees.map((e: any) => ({
            name: e.userId ? 'Employee' : 'User', // In real system, join with User
            role: e.position,
            dept: e.department,
            branch: e.branchId || 'HQ',
            status: e.status === 'Active' ? 'present' : 'leave',
            phone: 'N/A'
          })),
          kpis: [
            { label: 'Total Employees', value: headcount.toString(), change: '+0', up: true, icon: 'Users', sub: 'Across all branches' },
            { label: 'Present Today', value: headcount.toString(), change: '100%', up: true, icon: 'UserCheck', sub: 'Attendance rate' },
            { label: 'On Leave', value: '0', change: '0', up: false, icon: 'Clock', sub: 'Approved leave' },
            { label: 'Leave Requests', value: '0', change: '0', up: false, icon: 'Calendar', sub: 'Pending approval' },
            { label: 'Salary Pending', value: '0', change: '0', up: true, icon: 'DollarSign', sub: 'Processing' },
            { label: 'Suspended/Resigned', value: '0', change: '0', up: true, icon: 'ShieldAlert', sub: 'Active cases' },
          ],
          leaveRequests: [],
          departments: [
            { name: 'Counseling', headcount: Math.floor(headcount / 3), present: Math.floor(headcount / 3), onLeave: 0 },
            { name: 'Marketing', headcount: Math.floor(headcount / 3), present: Math.floor(headcount / 3), onLeave: 0 },
            { name: 'Operations', headcount: Math.ceil(headcount / 3), present: Math.ceil(headcount / 3), onLeave: 0 }
          ],
          salaryStatus: [
            { month: 'Current Month', status: 'processing', amount: '৳...' }
          ]
        }
      });
    } catch (error) {
      console.error('CRM HR Dashboard error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load HR data' },
        { status: 500 }
      );
    }
  })(request);
}
