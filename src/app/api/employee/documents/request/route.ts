import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { studentId, documentType, message, priority } = body;
    if (!studentId || !documentType) return NextResponse.json({ success: false, error: 'studentId and documentType required' }, { status: 400 });

    const doc = await db.studentDocument.create({
      data: {
        studentId,
        category: documentType,
        fileName: '',
        fileUrl: '',
        status: 'not_uploaded',
      },
    }).catch(() => null);

    await db.counselorTask.create({
      data: {
        employeeId: auth.userId,
        studentId,
        title: `Document requested: ${documentType}`,
        description: message || `Please upload ${documentType}`,
        type: 'document_request',
        priority: priority || 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'DOCUMENT_REQUESTED',
        title: `Document requested: ${documentType}`,
        description: message || '',
      },
    }).catch(() => {});

    await logAuditAction(auth, 'DOCUMENT_REQUESTED', 'StudentDocument', doc?.id || '', {
      studentId,
      documentType,
    });

    return NextResponse.json({ success: true, data: doc, message: 'Document request sent to student portal' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
