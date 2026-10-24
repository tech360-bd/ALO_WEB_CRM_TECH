import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writePortalAudit } from '@/lib/transactional-audit';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    const { id } = params;

    const existing = await db.counselorTask.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    // RBAC: own only unless manager/super_admin
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (existing.employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Not authorized to update this task' }, { status: 403 });
    }

    const body = await req.json();
    const { status, priority, title, description, dueDate } = body;

    const updated = await db.counselorTask.update({
      where: { id },
      data: {
        ...(status && { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) }),
        ...(priority && { priority }),
        ...(title && { title }),
        ...(description && { description }),
        ...(dueDate && { dueDate }),
      },
    });

    await logAuditAction(auth, 'TASK_UPDATED', 'CounselorTask', id, {
      before: { status: existing.status },
      after: { status: status || existing.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;

    const task = await db.counselorTask.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (task.employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    const { id } = params;

    const existing = await db.counselorTask.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (existing.employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    await db.$transaction(async tx => {
      await tx.counselorTask.update({ where: { id }, data: { status: 'cancelled' } });
      await writePortalAudit(tx, auth, 'TASK_ARCHIVED', 'CounselorTask', id, { previousStatus: existing.status, status: 'cancelled' }, req);
    });

    return NextResponse.json({ success: true, message: 'Task archived; history retained' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
