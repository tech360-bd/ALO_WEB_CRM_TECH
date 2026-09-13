import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { cvId, studentId, message } = body;
    if (!cvId && !studentId) return NextResponse.json({ success: false, error: 'cvId or studentId required' }, { status: 400 });

    let cv;
    if (cvId) cv = await db.cvDraft.findUnique({ where: { id: cvId } }).catch(() => null);
    else cv = await db.cvDraft.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' } }).catch(() => null);

    if (!cv) return NextResponse.json({ success: false, error: 'CV not found' }, { status: 404 });

    const updated = await db.cvDraft.update({
      where: { id: cv.id },
      data: { status: 'pending_review' },
    }).catch(() => cv);

    await db.counselorTask.create({
      data: {
        employeeId: auth.userId,
        studentId: (cv as any).studentId,
        title: 'CV Review Requested',
        description: message || 'CV review requested',
        type: 'cv_review',
        priority: 'medium',
        status: 'pending',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
