import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }

    const tasks = await db.counselorTask.findMany({
      where: {
        employeeId: auth.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      followups: tasks,
      total: tasks.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch follow-ups', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { studentId, title, description, priority, dueDate } = body;

    const task = await db.counselorTask.create({
      data: {
        employeeId: auth.userId,
        studentId: studentId || '',
        title: title || 'Follow up with student',
        description: description || '',
        priority: priority || 'medium',
        status: 'pending',
        dueDate: dueDate ? String(dueDate) : new Date(Date.now() + 86400000).toISOString().split('T')[0],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Follow-up task created',
      task,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create follow-up', details: error.message }, { status: 500 });
  }
}
