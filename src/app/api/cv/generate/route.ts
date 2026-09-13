import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, template, data } = body;
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const student = await db.student.findUnique({ where: { id: studentId } }).catch(() => null) ||
                    await db.portalStudentProfile.findFirst({ where: { studentId } }).catch(() => null);

    if (!student) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });

    // Generate CV draft with originality tracking
    const cv = await db.cvDraft.create({
      data: {
        studentId,
        applicationId: (data as any)?.applicationId || '',
        content: JSON.stringify({ template: template || 'standard', ...(data || {}) }),
        status: 'draft',
        version: 1,
      },
    });

    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'CV_GENERATED',
        title: 'CV draft generated',
        description: `Template: ${template || 'standard'} by ${auth.name}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: cv });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });
    const drafts = await db.cvDraft.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
