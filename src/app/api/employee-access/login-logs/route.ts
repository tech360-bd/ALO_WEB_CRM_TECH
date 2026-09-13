import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');

    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const logs = await (db as any).employeeLoginLog.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    // Detect suspicious
    const failedAttempts = logs.filter((l: any) => !l.isSuccess).length;
    const uniqueIPs = new Set(logs.map((l: any) => l.ipAddress)).size;
    const suspicious = failedAttempts > 5 || uniqueIPs > 3;

    return NextResponse.json({
      success: true,
      logs,
      security: {
        failedAttempts,
        uniqueIPs,
        suspicious,
        rateLimit: 'Enforced via login endpoint — 5 attempts / 15 min / IP',
        mfa: 'Configurable per role',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, ipAddress, browser, os, fingerprint, location, status, isSuccess, failureReason, sessionId } = body;
    if (!employeeId) return NextResponse.json({ success: false, error: 'employeeId required' }, { status: 400 });

    const log = await (db as any).employeeLoginLog.create({
      data: {
        employeeId,
        ipAddress: ipAddress || '',
        browser: browser || '',
        os: os || '',
        fingerprint: fingerprint || '',
        location: location || '',
        status: status || (isSuccess ? 'success' : 'failed'),
        isSuccess: isSuccess ?? false,
        failureReason: failureReason || '',
        sessionId: sessionId || '',
      },
    }).catch(() => null);

    // Security event if failed
    if (!isSuccess) {
      await (db as any).employeeSecurityEvent.create({
        data: {
          employeeId,
          eventType: 'failed_login',
          severity: 'medium',
          description: `Failed login from ${ipAddress} — ${failureReason}`,
          ipAddress: ipAddress || '',
          userAgent: browser || '',
          isResolved: false,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
