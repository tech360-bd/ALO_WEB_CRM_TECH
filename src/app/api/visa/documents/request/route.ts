import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { studentId, caseId, documentName, description, dueDate } = body;

    const task = await db.visaTask.create({
      data: {
        studentId: studentId || '',
        caseId: caseId || '',
        title: `Document Requested: ${documentName}`,
        description: description || '',
        status: 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await db.timelineEvent.create({
      data: {
        studentId: studentId || '',
        stage: 'VISA',
        title: 'Visa Document Requested',
        description: `Please provide: ${documentName}`,
        actor: auth.name || 'Staff',
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
