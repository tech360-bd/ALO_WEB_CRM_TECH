import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { canViewB2B, filterCommentsByVisibility } from '@/lib/application-manager/service';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  if (authRes.type === 'student' && app.studentId !== authRes.data.studentId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let where: any = { applicationId: params.id };

  let canViewB2BFlag = false;
  if (authRes.type === 'portal') {
    canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
  }

  // For students, only student_visible
  if (authRes.type === 'student') {
    where.visibility = { in: ['student_visible', 'public_safe'] };
  } else {
    const roles = authRes.data.roles || [];
    const isPartner = roles.includes('partner') || authRes.data.userType === 'partner';
    if (isPartner) {
      where.visibility = { in: ['partner_visible', 'student_visible', 'public_safe'] };
    }
  }

  const comments = await db.applicationComment.findMany({ where, orderBy: { createdAt: 'desc' } });

  const filtered = filterCommentsByVisibility(comments, canViewB2BFlag, authRes.type === 'portal' ? authRes.data.roles?.[0] : 'student');

  return NextResponse.json({ success: true, data: filtered, comments: filtered });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const body = await req.json();
  if (!body.commentText) return NextResponse.json({ success: false, error: 'commentText required' }, { status: 400 });

  const validChannels = ['STUDENT_VISIBLE', 'PARTNER_VISIBLE', 'COUNSELOR_VISIBLE', 'APPLICATION_TEAM_INTERNAL', 'B2B_CONFIDENTIAL', 'UNIVERSITY', 'FINANCE', 'VISA_HANDOVER', 'GENERAL'];
  const commentType = body.commentType || body.visibility || 'GENERAL';
  const visibilityMap: Record<string, string> = {
    STUDENT_VISIBLE: 'student_visible',
    PARTNER_VISIBLE: 'partner_visible',
    COUNSELOR_VISIBLE: 'counselor_visible',
    APPLICATION_TEAM_INTERNAL: 'internal',
    B2B_CONFIDENTIAL: 'B2B_CONFIDENTIAL',
    UNIVERSITY: 'university',
    FINANCE: 'finance',
    VISA_HANDOVER: 'visa_handover',
    GENERAL: 'internal',
  };

  const visibility = body.visibility || visibilityMap[commentType.toUpperCase()] || 'internal';

  // B2B confidential requires permission
  if (visibility === 'B2B_CONFIDENTIAL' || commentType === 'B2B_CONFIDENTIAL' || body.isB2bConfidential) {
    if (authRes.type !== 'portal') return NextResponse.json({ success: false, error: 'Forbidden: B2B confidential comments require portal auth' }, { status: 403 });
    if (!canViewB2B(authRes.data.roles, authRes.data.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden: B2B comment requires application.view_b2b permission' }, { status: 403 });
    }
  }

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const comment = await db.applicationComment.create({
    data: {
      applicationId: params.id,
      userId: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
      role: authRes.type === 'portal' ? (authRes.data.roles?.[0] || 'APPLICATION_TEAM') : 'STUDENT',
      commentType: commentType.toUpperCase(),
      visibility,
      commentText: body.commentText,
      attachmentPath: body.attachmentPath || '',
      isB2bConfidential: visibility === 'B2B_CONFIDENTIAL' || !!body.isB2bConfidential,
    },
  });

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'ADD_COMMENT', 'Application', params.id, { commentType, visibility });
    await db.auditLog.create({
      data: {
        userId: authRes.data.userId,
        action: 'ADD_COMMENT',
        resource: 'ApplicationComment',
        resourceId: comment.id,
        details: JSON.stringify({ applicationId: params.id, commentType, visibility }),
        actorRole: authRes.data.roles?.[0] || '',
        studentId: app.studentId,
      },
    });
  }

  return NextResponse.json({ success: true, data: comment, comment });
}
