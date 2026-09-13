import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const applicationId = searchParams.get('applicationId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const where: any = { studentId };
    if (applicationId) where.applicationId = applicationId;

    // Two-layer: student_visible vs internal_only visibility filtering per role
    const isStudent = auth.roles.includes('student');
    const canSeeInternal = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('visa_officer');

    const internalComments = canSeeInternal ? await db.internalComment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }) : [];
    const studentVisible = await db.studentVisibleComment.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });

    // Filter internal by visibility per role if not super_admin
    let filteredInternal = internalComments;
    if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
      filteredInternal = internalComments.filter(c => {
        if (c.visibility === 'internal_only') return true;
        if (c.visibility === 'application_team_only' && (auth.roles.includes('application_team') || auth.roles.includes('counselor'))) return true;
        if (c.visibility === 'visa_team_only' && auth.roles.includes('visa_officer')) return true;
        if (c.visibility === 'counselor_visible' && auth.roles.includes('counselor')) return true;
        if (c.visibility === 'super_admin_only' && auth.roles.includes('super_admin')) return true;
        return c.visibility === 'internal_only';
      });
    }

    return NextResponse.json({
      success: true,
      internalComments: filteredInternal,
      studentVisibleComments: studentVisible,
      canSeeInternal,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, applicationId, content, visibility, commentType } = body;
    if (!studentId || !content) return NextResponse.json({ success: false, error: 'studentId and content required' }, { status: 400 });

    // Visibility check: student_visible vs internal_only etc
    const allowedVisibilities = ['student_visible', 'internal_only', 'application_team_only', 'visa_team_only', 'finance_only', 'super_admin_only', 'partner_visible', 'counselor_visible'];
    const vis = visibility || 'internal_only';
    if (!allowedVisibilities.includes(vis)) return NextResponse.json({ success: false, error: 'Invalid visibility' }, { status: 400 });

    // Student cannot create internal comments
    if (auth.roles.includes('student') && vis !== 'student_visible') {
      return NextResponse.json({ success: false, error: 'Student can only create student_visible comments' }, { status: 403 });
    }

    let comment;
    if (vis === 'student_visible' || vis === 'partner_visible') {
      comment = await db.studentVisibleComment.create({
        data: {
          studentId,
          applicationId: applicationId || '',
          authorId: auth.userId,
          authorName: auth.name || '',
          authorRole: auth.roles[0] || '',
          content,
          isAiGenerated: false,
        },
      });
    } else {
      comment = await db.internalComment.create({
        data: {
          studentId,
          applicationId: applicationId || '',
          authorId: auth.userId,
          authorName: auth.name || '',
          authorRole: auth.roles[0] || 'counselor',
          commentType: commentType || 'counselor_note',
          content,
          visibility: vis,
        },
      });
    }

    await db.aloAuditLog.create({
      data: {
        studentId,
        actorType: auth.roles[0] || 'counselor',
        actorName: auth.name || auth.userId,
        action: 'COMMENT_CREATED',
        resource: vis === 'student_visible' ? 'StudentVisibleComment' : 'InternalComment',
        resourceId: comment.id,
        details: JSON.stringify({ visibility: vis, content: content.slice(0,100) }),
      },
    }).catch(() => {});

    // Timeline
    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'COMMENT_ADDED',
        title: `${vis === 'student_visible' ? 'Student-visible' : 'Internal'} comment by ${auth.name}`,
        description: content.slice(0,200),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
