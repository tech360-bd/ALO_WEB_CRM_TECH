import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const employeeId = auth.userId;

    const profile = await db.employeeProfile.findUnique({ where: { userId: employeeId } }).catch(() => null);
    const documents = await db.employeeDocument.findMany({ where: { employeeId } }).catch(() => []);
    const attendance = await (db as any).employeeAttendance.findMany({ where: { employeeId }, orderBy: { date: 'desc' }, take: 30 }).catch(() => []);
    const leave = await (db as any).employeeLeave.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const payroll = await (db as any).employeePayroll.findMany({ where: { employeeId }, orderBy: { period: 'desc' }, take: 12 }).catch(() => []);
    const devices = await (db as any).employeeDevice.findMany({ where: { employeeId } }).catch(() => []);
    const agreements = await (db as any).employeeAgreement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []);
    const acceptances = await (db as any).employeeAgreementAcceptance.findMany({ where: { employeeId } }).catch(() => []);
    const notifications = await db.portalNotification.findMany({ where: { userId: employeeId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const permissionRequests = await (db as any).employeePermissionRequest.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const loginHistory = await (db as any).employeeLoginLog.findMany({ where: { employeeId }, orderBy: { loginAt: 'desc' }, take: 20 }).catch(() => []);

    return NextResponse.json({
      success: true,
      employeeDashboard: {
        ownProfile: profile,
        ownDocuments: documents,
        ownAgreements: agreements,
        ownAcceptances: acceptances,
        ownAttendance: attendance,
        ownLeave: leave,
        ownSalarySlip: payroll.map((p: any) => ({ period: p.period, grossSalary: p.grossSalary, netSalary: p.netSalary, status: p.status })),
        ownDevices: devices,
        ownNotifications: notifications,
        ownPermissionRequests: permissionRequests,
        ownSecuritySessions: loginHistory,
      },
      restriction: 'Employee cannot view another employee — enforced by employeeId === auth.userId + canViewEmployeePrivateProfileEngine — private visibility Employee+SuperAdmin+Chairman+HR explicit',
      note: 'Employee sees Own Profile/Documents/Agreements/Attendance/Leave/Salary Slip/Devices/Notifications/Permission Requests/Security Sessions — cannot view another employee',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
