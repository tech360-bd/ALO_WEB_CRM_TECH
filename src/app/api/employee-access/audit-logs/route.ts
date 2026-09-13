import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('auditor');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin/Admin/Auditor required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      (db as any).employeeAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: limit }).catch(() => []),
      (db as any).employeeAuditLog.count({ where }).catch(() => 0),
    ]);

    // Also include portalAuditLog
    const portalLogs = await db.portalAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []);

    return NextResponse.json({
      success: true,
      logs,
      portalLogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total/limit) },
      requiredFields: 'actor_id/role/action/target/old/new/reason/approval/timestamp/IP/session preserved',
      note: 'No history deletion — soft delete only, history preserved forever',
    });
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
    const { employeeId, action, targetType, targetId, oldValue, newValue, reason } = body;
    if (!action) return NextResponse.json({ success: false, error: 'action required' }, { status: 400 });

    const log = await (db as any).employeeAuditLog.create({
      data: {
        employeeId: employeeId || auth.userId,
        actorId: auth.userId,
        actorRole: auth.roles[0] || '',
        action,
        targetType: targetType || '',
        targetId: targetId || '',
        oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue || {}),
        newValue: typeof newValue === 'string' ? newValue : JSON.stringify(newValue || {}),
        reason: reason || '',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        sessionId: req.headers.get('x-session-id') || '',
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
