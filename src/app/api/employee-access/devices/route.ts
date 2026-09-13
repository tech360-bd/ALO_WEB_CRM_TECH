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
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager') || auth.roles.includes('admin');

    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const devices = await (db as any).employeeDevice.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }).catch(() => []);
    const loginLogs = await (db as any).employeeLoginLog.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []);

    return NextResponse.json({ success: true, devices, loginLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('hr_manager') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'HR/Admin required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, deviceType, deviceId, ipAddress, browser, os, fingerprint } = body;
    if (!employeeId || !deviceType) return NextResponse.json({ success: false, error: 'employeeId and deviceType required' }, { status: 400 });

    const device = await (db as any).employeeDevice.create({
      data: {
        employeeId,
        deviceType,
        deviceId: deviceId || '',
        ipAddress: ipAddress || '',
        browser: browser || '',
        os: os || '',
        fingerprint: fingerprint || '',
        isTrusted: false,
        status: 'active',
      },
    });

    await logAuditAction(auth, 'DEVICE_REGISTERED', 'EmployeeDevice', device.id, { employeeId, deviceType });

    return NextResponse.json({ success: true, data: device });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
