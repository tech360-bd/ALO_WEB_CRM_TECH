import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    const body = await req.json();
    const { status, note } = body;

    const existing = await db.counselorTask.findUnique({ where: { id } }).catch(() => null);
    if (!existing) return NextResponse.json({ success: false, error: 'Followup not found' }, { status: 404 });

    if (existing.employeeId !== auth.userId && !auth.roles.includes('super_admin')) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const updated = await db.counselorTask.update({
      where: { id },
      data: { status: status || existing.status, description: note ? `${existing.description}\n${note}` : existing.description },
    });

    await logAuditAction(auth, 'FOLLOWUP_UPDATED', 'CounselorTask', id, { status });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { id } = params;
    const task = await db.counselorTask.findUnique({ where: { id } }).catch(() => null);
    if (!task) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
