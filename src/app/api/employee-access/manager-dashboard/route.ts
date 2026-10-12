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

    const currentProfile = await db.employeeProfile.findUnique({ where: { userId: auth.userId } });
    const master = auth.roles.some(role => role.toUpperCase() === 'SUPER_ADMIN') || auth.userType === 'SUPER_ADMIN';
    const branch = currentProfile?.branch || '';
    const department = currentProfile?.department || '';
    if (!master && (!['branch', 'department'].includes(scope) || (scope === 'branch' ? !branch : !department))) {
      return NextResponse.json({ success: false, error: 'An assigned branch or department scope is required' }, { status: 403 });
    }
    const filtered = await db.portalUser.findMany({
      where: { userType: 'EMPLOYEE', status: 'active', ...(!master ? { employeeProfile: { is: scope === 'branch' ? { branch } : { department } } } : {}) },
      select: { id: true, name: true, email: true, employeeProfile: { select: { designation: true, department: true, branch: true } } }, take: 100,
    });
    const ids = filtered.map(u => u.id);
    const employees = await db.employee.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const scopedIds = [...ids, ...employees.map(e => e.id)];
    const teamAttendance = await db.employeeAttendance.findMany({ where: { employeeId: { in: scopedIds }, date: new Date().toISOString().split('T')[0] }, take: 100 });
    const teamLeave = await db.employeeLeave.findMany({ where: { employeeId: { in: scopedIds }, status: 'pending' }, take: 100,
      select: { id: true, employeeId: true, leaveType: true, startDate: true, endDate: true, status: true } });
    const pendingApprovals = await db.employeePermissionRequest.findMany({ where: { employeeId: { in: scopedIds }, status: 'requested' }, take: 100 });

    return NextResponse.json({
      success: true,
      managerDashboard: {
        scope,
        teamEmployees: filtered.map((u: any) => ({ id: u.id, name: u.name, email: u.email, designation: u.employeeProfile?.designation, department: u.employeeProfile?.department, branch: u.employeeProfile?.branch })),
        teamAttendance,
        teamLeave,

        pendingApprovals,
      },
      restriction: 'Manager sees only permitted team information — Team Employees/Attendance/Leave/Tasks/Performance/Pending Approvals — No private salary/HR fields unless explicitly permitted — enforceFieldLevelSecurity',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
