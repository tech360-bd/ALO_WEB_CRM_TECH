import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, documentType, message, priority } = body;
    if (!studentId || !documentType) return NextResponse.json({ success: false, error: 'studentId and documentType required' }, { status: 400 });

    // Create document request as pending document
    const doc = await db.studentDocument.create({
      data: {
        studentId,
        category: documentType,
        fileName: '',
        fileUrl: '',
        status: 'not_uploaded',
      },
    }).catch(() => null);

    // Create task for student
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

    // Timeline
    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'DOCUMENT_REQUESTED',
        title: `Document requested: ${documentType}`,
        description: message || '',
      },
    }).catch(() => {});

    await db.aloAuditLog.create({
      data: {
        studentId,
        actorType: auth.roles[0] || 'counselor',
        actorName: auth.name || auth.userId,
        action: 'DOCUMENT_REQUESTED',
        resource: 'StudentDocument',
        resourceId: doc?.id || '',
        details: JSON.stringify({ documentType, message }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: doc, message: 'Document request sent to student portal' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
