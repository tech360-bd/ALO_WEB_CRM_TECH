import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { writePortalAudit } from '@/lib/transactional-audit';

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.userType.toLowerCase() === 'super_admin' || auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

function canViewSecurityRecords(auth: AuthContext): boolean {
  return isSuperAdmin(auth) || auth.permissions.includes('employee.security.view_all') || auth.roles.some((role) => role.toLowerCase() === 'security_admin');
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('userId')?.trim() || auth.userId;
    const requestedEmployeeId = url.searchParams.get('employeeId')?.trim() || '';
    const canViewAll = canViewSecurityRecords(auth);
    const identityRoles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
    if (identityRoles.has('student') || identityRoles.has('partner')) return NextResponse.json({ success: false, error: 'Employee security records are not available to student or partner accounts.' }, { status: 403 });
    if (requestedUserId !== auth.userId && !canViewAll) return NextResponse.json({ success: false, error: 'Access denied to security logs.' }, { status: 403 });
    if (!isSuperAdmin(auth)) {
      const actorEmployee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } }).catch(() => null);
      if (!actorEmployee || actorEmployee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    }

    try {
      let targetUserId = requestedUserId;
      let targetEmployeeId = requestedEmployeeId;
      if (requestedEmployeeId) {
        if (!canViewAll) {
          const ownProfile = await db.employeeHR.findUnique({ where: { userId: auth.userId }, select: { employeeId: true } });
          if (!ownProfile || ownProfile.employeeId !== requestedEmployeeId) return NextResponse.json({ success: false, error: 'Access denied to security logs.' }, { status: 403 });
        }
        const profile = await db.employeeHR.findUnique({ where: { employeeId: requestedEmployeeId }, select: { userId: true, employeeId: true } });
        if (!profile) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
        targetUserId = profile.userId;
        targetEmployeeId = profile.employeeId;
      } else if (requestedUserId !== auth.userId && canViewAll) {
        const profile = await db.employeeHR.findUnique({ where: { userId: requestedUserId }, select: { userId: true, employeeId: true } });
        if (!profile) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
        targetEmployeeId = profile.employeeId;
      }
      if (targetUserId !== auth.userId && !canViewAll) return NextResponse.json({ success: false, error: 'Access denied to security logs.' }, { status: 403 });

      const [legacy, extended, sessions, failed] = await Promise.all([
        db.loginSecurity.findMany({ where: { userId: targetUserId }, orderBy: { loginTime: 'desc' }, take: 50, select: { id: true, ipAddress: true, browser: true, operatingSystem: true, location: true, loginTime: true, logoutTime: true, sessionStatus: true, failedAttempts: true } }),
        db.hrmLoginSecurityExtended.findMany({ where: { userId: targetUserId }, orderBy: { loginAt: 'desc' }, take: 50, select: { id: true, ipAddress: true, browser: true, operatingSystem: true, device: true, location: true, city: true, country: true, loginAt: true, logoutAt: true, success: true, failureReason: true } }),
        db.portalSession.findMany({ where: { userId: targetUserId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, deviceName: true, ipAddress: true, userAgent: true, expiresAt: true, revokedAt: true, createdAt: true } }),
        db.employeeLoginLog.findMany({ where: { userId: targetUserId }, orderBy: { loginAt: 'desc' }, take: 50, select: { id: true, ipAddress: true, browser: true, os: true, device: true, location: true, status: true, isSuccess: true, loginAt: true, logoutAt: true, failureReason: true, sessionId: true } }),
      ]);
      const logs = [
        ...extended.map((item) => ({ id: item.id, ipAddress: item.ipAddress, browser: item.browser, os: item.operatingSystem, device: item.device, location: [item.city, item.country].filter(Boolean).join(', ') || item.location, loginAt: item.loginAt, logoutAt: item.logoutAt, success: item.success, failureReason: item.failureReason, sessionId: item.sessionId })),
        ...legacy.map((item) => ({ id: item.id, ipAddress: item.ipAddress, browser: item.browser, os: item.operatingSystem, device: '', location: item.location, loginAt: item.loginTime, logoutAt: item.logoutTime, success: item.sessionStatus !== 'FAILED', failureReason: '', sessionId: item.id })),
        ...failed.map((item) => ({ id: item.id, ipAddress: item.ipAddress, browser: item.browser, os: item.os, device: item.device, location: item.location, loginAt: item.loginAt, logoutAt: item.logoutAt, success: item.isSuccess, failureReason: item.failureReason, sessionId: item.sessionId })),
      ].sort((a, b) => b.loginAt.getTime() - a.loginAt.getTime()).slice(0, 50);

      await db.$transaction(async (tx) => {
        await writePortalAudit(tx, auth, 'EMPLOYEE_LOGIN_SECURITY_VIEWED', 'EmployeeLoginSecurity', targetEmployeeId || targetUserId, { targetUserId, logCount: logs.length, sessionCount: sessions.length }, req);
      });
      return NextResponse.json({ success: true, data: { logs, sessions, extendedCount: extended.length, legacyCount: legacy.length } }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Security logs are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Client-submitted security events are disabled. Login and session events are recorded by authentication workflows.' }, { status: 405, headers: { Allow: 'GET' } });
}
