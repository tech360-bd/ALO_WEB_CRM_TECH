import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('security');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin/Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const severity = searchParams.get('severity');
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (severity) where.severity = severity;

    const events = await (db as any).employeeSecurityEvent.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { employeeId, eventType, severity, description, ipAddress } = body;
    if (!eventType || !description) return NextResponse.json({ success: false, error: 'eventType and description required' }, { status: 400 });

    const event = await (db as any).employeeSecurityEvent.create({
      data: {
        employeeId: employeeId || auth.userId,
        eventType,
        severity: severity || 'low',
        description,
        ipAddress: ipAddress || req.headers.get('x-forwarded-for') || '',
        userAgent: req.headers.get('user-agent') || '',
        isResolved: false,
      },
    });

    await logAuditAction(auth, 'SECURITY_EVENT_LOGGED', 'EmployeeSecurityEvent', event.id, { eventType, severity });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
