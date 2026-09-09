import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const tasks = await db.visaTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { caseId, studentId, taskType, title, description, assignedTo, dueDate } = body;

    const task = await db.visaTask.create({
      data: {
        caseId: caseId || '',
        studentId: studentId || '',
        taskType: taskType || 'document_request',
        title: title || '',
        description: description || '',
        assignedTo: assignedTo || 'student',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
