import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { sopId, studentId, message } = body;
    if (!sopId && !studentId) return NextResponse.json({ success: false, error: 'sopId or studentId required' }, { status: 400 });

    let sop;
    if (sopId) {
      sop = await db.sopDraft.findUnique({ where: { id: sopId } }).catch(() => null);
    } else if (studentId) {
      sop = await db.sopDraft.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' } }).catch(() => null);
    }

    if (!sop) return NextResponse.json({ success: false, error: 'SOP not found' }, { status: 404 });

    const updated = await db.sopDraft.update({
      where: { id: sop.id },
      data: { status: 'pending_review', reviewRequested: true, reviewerNote: message || '' },
    }).catch(() => sop);

    // Task for application team / counselor
    await db.counselorTask.create({
      data: {
        employeeId: auth.userId,
        studentId: (sop as any).studentId,
        title: `SOP Review Requested`,
        description: message || 'Student requested SOP review',
        type: 'sop_review',
        priority: 'high',
        status: 'pending',
      },
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId: (sop as any).studentId,
        stage: 'SOP_REVIEW_REQUESTED',
        title: 'SOP review requested',
        description: message || '',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const drafts = await db.sopDraft.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
