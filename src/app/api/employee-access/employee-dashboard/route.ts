import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

const PRIVATE_SELF_SERVICE_CATEGORIES = [
  'profile', 'documents', 'agreements', 'attendance', 'leave', 'payroll', 'devices', 'permission-requests', 'security-sessions',
] as const;

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    // This is an employee self-service API, not a general authenticated-user API.
    // Resolve the employee record server-side before reading any HR data.
    const employee = await db.employee.findUnique({
      where: { userId: auth.userId },
      select: { id: true, userId: true, employeeId: true, status: true },
    });
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
    }

    // Older employee records are keyed inconsistently by portal user ID, Employee.id,
    // or the immutable employee code. Resolve all three only from the authenticated
    // account's own Employee record, then use that set for every employee-owned row.
    const employeeIds = uniqueIds([employee.id, employee.userId, employee.employeeId]);
    const profile = await db.employeeProfile.findUnique({ where: { userId: employee.userId } }).catch(() => null);
    const documents = await db.employeeDocument.findMany({
      where: { employeeId: { in: employeeIds } },
      select: {
        id: true, employeeId: true, documentType: true, title: true, fileName: true,
        fileSize: true, mimeType: true, isMandatory: true, isVerified: true,
        status: true, version: true, expiryDate: true, createdAt: true, updatedAt: true,
      },
    }).catch(() => []);
    const attendance = await (db as any).employeeAttendance.findMany({ where: { employeeId: { in: employeeIds } }, orderBy: { date: 'desc' }, take: 30 }).catch(() => []);
    const leave = await (db as any).employeeLeave.findMany({ where: { employeeId: { in: employeeIds } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const payroll = await (db as any).employeePayroll.findMany({ where: { employeeId: { in: employeeIds } }, orderBy: { period: 'desc' }, take: 12 }).catch(() => []);
    const devices = await (db as any).employeeDevice.findMany({ where: { employeeId: { in: employeeIds } } }).catch(() => []);
    // Agreements are shared policy/contract templates. Return active agreement
    // metadata only, and expose acceptance rows only for this employee's ID aliases.
    const agreements = await (db as any).employeeAgreement.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, title: true, type: true, version: true, status: true, createdAt: true, updatedAt: true,
        acceptances: {
          where: { employeeId: { in: employeeIds } },
          select: { id: true, employeeId: true, version: true, acceptedAt: true, signatureType: true },
        },
      },
    }).catch(() => []);
    const acceptances = await (db as any).employeeAgreementAcceptance.findMany({ where: { employeeId: { in: employeeIds } } }).catch(() => []);
    const notifications = await db.portalNotification.findMany({ where: { userId: employee.userId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const permissionRequests = await (db as any).employeePermissionRequest.findMany({ where: { employeeId: { in: employeeIds } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);
    const loginHistory = await (db as any).employeeLoginLog.findMany({
      where: { OR: [{ employeeId: { in: employeeIds } }, { userId: employee.userId }] },
      orderBy: { loginAt: 'desc' }, take: 20,
    }).catch(() => []);

    await logAuditAction(auth, 'EMPLOYEE_PRIVATE_SELF_SERVICE_VIEWED', 'Employee', employee.id, {
      categories: PRIVATE_SELF_SERVICE_CATEGORIES,
      selfService: true,
    });

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
      restriction: 'An active employee record is required; employee-owned rows are scoped to the authenticated Employee record and its ID aliases.',
      note: 'Employee sees their own profile, documents, agreements, attendance, leave, salary slips, devices, notifications, permission requests, and security sessions.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
