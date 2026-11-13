import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, filterCommentsByVisibility } from '@/lib/application-manager/service';

function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

function canReadComments(auth: { roles: string[]; permissions: string[] }): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'counselor', 'application_officer', 'document_officer'].includes(role)) ||
    auth.permissions.includes('application.view') || auth.permissions.includes('application.view_all') || auth.permissions.includes('application.view_assigned');
}

const commentSchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  commentType: z.enum(['STUDENT_VISIBLE', 'PARTNER_VISIBLE', 'COUNSELOR_VISIBLE', 'APPLICATION_TEAM_INTERNAL', 'B2B_CONFIDENTIAL', 'UNIVERSITY', 'FINANCE', 'VISA_HANDOVER', 'GENERAL']).optional(),
  visibility: z.enum(['student_visible', 'partner_visible', 'counselor_visible', 'internal', 'B2B_CONFIDENTIAL', 'university', 'finance', 'visa_handover', 'public_safe']).optional(),
  commentText: z.string().trim().min(1).max(10000),
  isB2bConfidential: z.boolean().optional(),
}).strict();

function publicComment(comment: any) {
  const { attachmentPath: _attachmentPath, ...safe } = comment;
  return safe;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (isPartner(auth) || !canReadComments(auth)) return NextResponse.json({ success: false, error: 'Forbidden: application comment view permission required.' }, { status: 403 });

  const applicationId = req.nextUrl.searchParams.get('applicationId');
  if (!applicationId || applicationId.length > 191) return NextResponse.json({ success: false, error: 'Valid applicationId required.' }, { status: 400 });
  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  const roles = auth.roles.map((role) => role.toLowerCase());
  const globalAccess = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.view_all') || auth.permissions.includes('application.view');
  if (!globalAccess && ![app.counselorId, app.applicationOfficer, app.appTeamOfficerId, app.visaOfficerId].includes(auth.userId)) {
    return NextResponse.json({ success: false, error: 'Application is not within your assigned comment-view scope.' }, { status: 403 });
  }

  const allComments = await db.applicationComment.findMany({ where: { applicationId }, orderBy: { createdAt: 'desc' }, take: 500 });
  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  const comments = filterCommentsByVisibility(allComments, canViewB2BFlag, auth.roles[0] || '').map(publicComment);
  if (canViewB2BFlag) await logAuditAction(auth, 'VIEW_B2B_APPLICATION_COMMENTS', 'Application', applicationId, { count: comments.length });
  return NextResponse.json({ success: true, comments, data: comments, total: comments.length, canViewB2B: canViewB2BFlag });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (isPartner(auth)) return NextResponse.json({ success: false, error: 'Partner comments must use the partner-scoped workflow.' }, { status: 403 });

  const roles = auth.roles.map((role) => role.toLowerCase());
  const canWrite = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.add_comment');
  if (!canWrite) return NextResponse.json({ success: false, error: 'Forbidden: application comment write permission required.' }, { status: 403 });
  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application comment.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const visibility = body.visibility || (body.commentType === 'B2B_CONFIDENTIAL' ? 'B2B_CONFIDENTIAL' : 'internal');
  const isConfidential = visibility.toLowerCase() === 'b2b_confidential' || body.isB2bConfidential === true || body.commentType === 'B2B_CONFIDENTIAL';
  if (isConfidential && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B comment requires explicit permission.' }, { status: 403 });
  }
  const app = await db.application.findUnique({ where: { id: body.applicationId } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  if (!roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) &&
      ![app.counselorId, app.applicationOfficer, app.appTeamOfficerId].includes(auth.userId)) {
    return NextResponse.json({ success: false, error: 'Application is not within your assigned comment-write scope.' }, { status: 403 });
  }
  const appIsB2b = app.isB2b === true || app.isB2bConfidential === true || Boolean(app.b2bProviderId) ||
    String(app.applicationSource || '').toUpperCase().startsWith('B2B_') || String(app.stage || '').toUpperCase().includes('B2B');
  if (appIsB2b && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: confidential application comments require explicit B2B permission.' }, { status: 403 });
  }

  const comment = await db.applicationComment.create({
    data: {
      applicationId: body.applicationId,
      userId: auth.userId,
      role: auth.roles[0] || 'APPLICATION_TEAM',
      commentType: body.commentType || (isConfidential ? 'B2B_CONFIDENTIAL' : 'GENERAL'),
      visibility,
      commentText: body.commentText,
      isB2bConfidential: isConfidential,
    },
  });
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'ADD_COMMENT',
      resource: 'ApplicationComment',
      resourceId: comment.id,
      details: JSON.stringify({ applicationId: body.applicationId, visibility, isB2bConfidential: isConfidential }),
      actorRole: auth.roles[0] || '',
      studentId: app.studentId,
    },
  });
  return NextResponse.json({ comment: publicComment(comment), message: 'Comment added.', success: true, data: publicComment(comment) }, { status: 201 });
}
