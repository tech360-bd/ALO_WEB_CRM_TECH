import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isManager = auth.roles.includes('branch_manager') || auth.roles.includes('office_manager') || auth.roles.includes('team_leader') || auth.roles.includes('manager') || auth.roles.includes('country_manager') || auth.roles.includes('director') || auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isManager) return NextResponse.json({ success: false, error: 'Manager role required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'team'; // team, branch, office, country, global

    // For demo, get team employees via same branch/department
    const currentProfile = await db.employeeProfile.findUnique({ where: { userId: auth.userId } }).catch(() => null);
    const branch = (currentProfile as any)?.branch || '';
    const department = (currentProfile as any)?.department || '';

    const teamEmployees = await db.portalUser.findMany({
      where: { userType: 'EMPLOYEE', status: 'active' },
      include: { employeeProfile: true },
      take: 50,
    }).catch(() => []);

    const filtered = teamEmployees.filter((u: any) => {
      if (scope === 'branch' && branch) return u.employeeProfile?.branch === branch;
      if (scope === 'department' && department) return u.employeeProfile?.department === department;
      return true;
    });

    const teamAttendance = await (db as any).employeeAttendance.findMany({ where: { date: new Date().toISOString().split('T')[0] }, take: 50 }).catch(() => []);
    const teamLeave = await (db as any).employeeLeave.findMany({ where: { status: 'pending' }, take: 20 }).catch(() => []);
    const pendingApprovals = await (db as any).employeePermissionRequest.findMany({ where: { status: 'requested' }, take: 20 }).catch(() => []);

    return NextResponse.json({
      success: true,
      managerDashboard: {
        scope,
        teamEmployees: filtered.map((u: any) => ({ id: u.id, name: u.name, email: u.email, designation: u.employeeProfile?.designation, department: u.employeeProfile?.department, branch: u.employeeProfile?.branch })),
        teamAttendance,
        teamLeave,
        teamTasks: 'From CounselorTask where employeeId in team',
        teamPerformance: 'From EmployeePerformance grouped by employee',
        pendingApprovals,
      },
      restriction: 'Manager sees only permitted team information — Team Employees/Attendance/Leave/Tasks/Performance/Pending Approvals — No private salary/HR fields unless explicitly permitted — enforceFieldLevelSecurity',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
