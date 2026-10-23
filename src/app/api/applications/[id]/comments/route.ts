import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { canViewB2B, filterCommentsByVisibility } from '@/lib/application-manager/service';
import { logAuditAction } from '@/lib/auth-middleware';

const commentSchema = z.object({
  commentText: z.string().trim().min(1).max(10000),
  commentType: z.enum(['STUDENT_VISIBLE', 'PARTNER_VISIBLE', 'COUNSELOR_VISIBLE', 'APPLICATION_TEAM_INTERNAL', 'B2B_CONFIDENTIAL', 'UNIVERSITY', 'FINANCE', 'VISA_HANDOVER', 'GENERAL']).optional(),
  visibility: z.enum(['student_visible', 'partner_visible', 'counselor_visible', 'internal', 'B2B_CONFIDENTIAL', 'university', 'finance', 'visa_handover', 'public_safe']).optional(),
  isB2bConfidential: z.boolean().optional(),
}).strict();

function isStudent(userType: string, roles: string[]): boolean {
  const normalized = roles.map((role) => role.toLowerCase());
  return userType.toLowerCase() === 'student' || normalized.includes('student');
}
function isPartner(userType: string, roles: string[], partnerId?: string): boolean {
  const normalized = roles.map((role) => role.toLowerCase());
  return Boolean(partnerId || userType.toLowerCase() === 'partner' || normalized.some((role) => role.startsWith('partner')));
}
function publicComment(comment: any, portalActor: boolean) {
  if (!portalActor) return { id: comment.id, commentText: comment.commentText, createdAt: comment.createdAt, visibility: comment.visibility };
  const { attachmentPath: _attachmentPath, ...safe } = comment;
  return safe;
}

async function resolveOwnStudentId(userId: string): Promise<string | null> {
  const [student, profile] = await Promise.all([
    db.student.findFirst({ where: { userId }, select: { id: true } }),
    db.portalStudentProfile.findFirst({ where: { userId }, select: { studentId: true } }),
  ]);
  return student?.id || profile?.studentId || null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const portal = authRes.type === 'portal' ? authRes.data : null;
  const roles = portal?.roles || [];
  const partnerActor = Boolean(portal && isPartner(portal.userType, roles, portal.partnerId));
  const studentActor = authRes.type === 'student' || Boolean(portal && isStudent(portal.userType, roles));
  if (partnerActor && studentActor) return NextResponse.json({ success: false, error: 'Account has conflicting student and partner identities.' }, { status: 403 });
  if (partnerActor && !portal?.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });

  const ownStudentId = authRes.type === 'student'
    ? authRes.data.studentId
    : studentActor && portal ? await resolveOwnStudentId(portal.userId) : null;
  if (studentActor && !ownStudentId) return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });

  const app = await db.application.findFirst({
    where: {
      id: params.id,
      ...(studentActor ? { studentId: ownStudentId! } : {}),
      ...(partnerActor ? { partnerId: portal!.partnerId } : {}),
    },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });

  if (portal && !studentActor && !partnerActor) {
    const normalized = portal.roles.map((role) => role.toLowerCase());
    const globalAccess = normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) ||
      portal.permissions.includes('application.view_all') || portal.permissions.includes('application.view');
    const assigned = [app.counselorId, app.applicationOfficer, app.appTeamOfficerId, app.visaOfficerId].includes(portal.userId);
    const assignedRole = normalized.some((role) => ['counselor', 'application_officer', 'document_officer', 'visa_officer'].includes(role));
    const hasScopedAccess = assigned && (assignedRole || portal.permissions.includes('application.view_assigned'));
    if (!globalAccess && !hasScopedAccess) {
      return NextResponse.json({ success: false, error: 'Application is not within your assigned comment-view scope.' }, { status: 403 });
    }
  }

  const comments = await db.applicationComment.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' }, take: 500 });
  const canViewB2BFlag = portal && !studentActor ? canViewB2B(portal.roles, portal.permissions) : false;
  const viewerRole = studentActor ? 'student' : partnerActor ? 'partner' : portal?.roles[0] || 'public';
  const filtered = filterCommentsByVisibility(comments, canViewB2BFlag, viewerRole)
    .map((comment: any) => publicComment(comment, !studentActor && !partnerActor));
  if (portal && canViewB2BFlag) await logAuditAction(portal, 'VIEW_B2B_APPLICATION_COMMENTS', 'Application', params.id, { count: filtered.length });
  return NextResponse.json({ success: true, data: filtered, comments: filtered, total: filtered.length });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application comment.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const portal = authRes.type === 'portal' ? authRes.data : null;
  const roles = portal?.roles || [];
  const partnerActor = Boolean(portal && isPartner(portal.userType, roles, portal.partnerId));
  const studentActor = authRes.type === 'student' || Boolean(portal && isStudent(portal.userType, roles));
  if (partnerActor && studentActor) return NextResponse.json({ success: false, error: 'Account has conflicting student and partner identities.' }, { status: 403 });
  if (partnerActor && !portal?.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });

  const ownStudentId = authRes.type === 'student'
    ? authRes.data.studentId
    : studentActor && portal ? await resolveOwnStudentId(portal.userId) : null;
  if (studentActor && !ownStudentId) return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });

  const app = await db.application.findFirst({
    where: {
      id: params.id,
      ...(studentActor ? { studentId: ownStudentId! } : {}),
      ...(partnerActor ? { partnerId: portal!.partnerId } : {}),
    },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });

  let visibility: string = body.visibility || 'internal';
  const commentType = body.commentType || 'GENERAL';
  if (!body.visibility) {
    const visibilityByType: Record<string, string> = {
      STUDENT_VISIBLE: 'student_visible', PARTNER_VISIBLE: 'partner_visible', COUNSELOR_VISIBLE: 'counselor_visible',
      APPLICATION_TEAM_INTERNAL: 'internal', B2B_CONFIDENTIAL: 'B2B_CONFIDENTIAL', UNIVERSITY: 'university',
      FINANCE: 'finance', VISA_HANDOVER: 'visa_handover', GENERAL: 'internal',
    };
    visibility = visibilityByType[commentType] || 'internal';
  }
  if (studentActor) visibility = 'student_visible';
  if (partnerActor) visibility = 'partner_visible';

  const isConfidential = visibility.toLowerCase() === 'b2b_confidential' || commentType === 'B2B_CONFIDENTIAL' || body.isB2bConfidential === true;
  const canViewB2BFlag = Boolean(portal && canViewB2B(portal.roles, portal.permissions));
  if (isConfidential && (!portal || partnerActor || studentActor || !canViewB2BFlag)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B comments require an authorized ALO-side B2B permission.' }, { status: 403 });
  }

  if (portal && !studentActor && !partnerActor) {
    const normalized = portal.roles.map((role) => role.toLowerCase());
    const canWrite = normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || portal.permissions.includes('application.add_comment');
    if (!canWrite) return NextResponse.json({ success: false, error: 'Forbidden: application.add_comment permission required.' }, { status: 403 });
    const globalAccess = normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || portal.permissions.includes('application.view_all');
    if (!globalAccess && ![app.counselorId, app.applicationOfficer, app.appTeamOfficerId].includes(portal.userId)) {
      return NextResponse.json({ success: false, error: 'Application is not within your assigned comment-write scope.' }, { status: 403 });
    }
    if ((app.isB2b || app.isB2bConfidential || String(app.applicationSource || '').toUpperCase().startsWith('B2B_')) && !canViewB2BFlag) {
      // Ordinary comments remain possible for a student or partner, but an
      // unprivileged ALO actor cannot interact with a confidential record.
      return NextResponse.json({ success: false, error: 'Forbidden: confidential application comments require explicit B2B permission.' }, { status: 403 });
    }
  }

  const actorId = authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId;
  const comment = await db.applicationComment.create({
    data: {
      applicationId: params.id,
      userId: actorId,
      role: studentActor ? 'STUDENT' : partnerActor ? 'PARTNER' : portal?.roles[0] || 'APPLICATION_TEAM',
      commentType: isConfidential ? 'B2B_CONFIDENTIAL' : studentActor ? 'STUDENT_VISIBLE' : partnerActor ? 'PARTNER_VISIBLE' : commentType,
      visibility: isConfidential ? 'B2B_CONFIDENTIAL' : visibility,
      commentText: body.commentText,
      attachmentPath: '',
      isB2bConfidential: isConfidential,
    },
  });

  if (portal) {
    await logAuditAction(portal, 'ADD_COMMENT', 'Application', params.id, { commentType: isConfidential ? 'B2B_CONFIDENTIAL' : commentType, visibility: isConfidential ? 'B2B_CONFIDENTIAL' : visibility });
    await db.auditLog.create({
      data: { userId: portal.userId, action: 'ADD_COMMENT', resource: 'ApplicationComment', resourceId: comment.id, details: JSON.stringify({ applicationId: params.id, visibility: isConfidential ? 'B2B_CONFIDENTIAL' : visibility, isB2bConfidential: isConfidential }), actorRole: portal.roles[0] || '', studentId: app.studentId },
    });
  }
  return NextResponse.json({ success: true, data: publicComment(comment, !studentActor && !partnerActor), comment: publicComment(comment, !studentActor && !partnerActor) }, { status: 201 });
}
