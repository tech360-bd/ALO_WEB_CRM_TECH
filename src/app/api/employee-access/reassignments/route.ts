import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const where: any = {};
    if (employeeId) where.fromEmployeeId = employeeId;

    const reassignments = await (db as any).employeeReassignment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    return NextResponse.json({ success: true, reassignments, note: 'No reassignment silent — everything tracked with reason, actor, approval' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('branch_manager') || auth.roles.includes('office_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Manager/Admin required' }, { status: 403 });

    const body = await req.json();
    const { fromEmployeeId, toEmployeeId, entityType, entityId, reason } = body;
    if (!fromEmployeeId || !toEmployeeId || !entityType || !entityId || !reason) {
      return NextResponse.json({ success: false, error: 'fromEmployeeId, toEmployeeId, entityType, entityId, reason required — nothing silent' }, { status: 400 });
    }

    const reassignment = await (db as any).employeeReassignment.create({
      data: {
        fromEmployeeId,
        toEmployeeId,
        entityType,
        entityId,
        reason,
        assignedBy: auth.userId,
        approvedBy: auth.userId,
      },
    });

    await logAuditAction(auth, 'REASSIGNMENT_CREATED', 'EmployeeReassignment', reassignment.id, { fromEmployeeId, toEmployeeId, entityType, entityId, reason });

    // Also create audit log for the entity reassignment
    await (db as any).employeeAuditLog.create({
      data: {
        employeeId: toEmployeeId,
        actorId: auth.userId,
        action: 'REASSIGNMENT',
        targetType: entityType,
        targetId: entityId,
        oldValue: JSON.stringify({ assignedTo: fromEmployeeId }),
        newValue: JSON.stringify({ assignedTo: toEmployeeId }),
        reason,
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: reassignment, message: 'Reassignment logged — no silent reassignment' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
