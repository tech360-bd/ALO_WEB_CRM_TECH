import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, anonymizeTimelineEvent } from '@/lib/application-manager/service';

const timelineBodySchema = z.object({
  note: z.string().trim().min(1).max(1000),
  visibility: z.enum(['public_safe', 'internal', 'counselor_visible', 'visa_handover', 'B2B_CONFIDENTIAL']).default('internal'),
}).strict();

function isStudent(userType: string, roles: string[]): boolean {
  return userType.toLowerCase() === 'student' || roles.some((role) => role.toLowerCase() === 'student');
}
function isPartner(userType: string, roles: string[], partnerId?: string): boolean {
  return Boolean(partnerId || userType.toLowerCase() === 'partner' || roles.some((role) => role.toLowerCase().startsWith('partner')));
}
function filterTimelineByRole(events: any[], role: string, canViewB2BFlag: boolean): any[] {
  if (canViewB2BFlag) return events;
  const normalized = role.toLowerCase();
  return events.filter((event) => {
    const visibility = String(event.visibility || '').toLowerCase();
    if (['student', 'partner'].includes(normalized)) return visibility === 'public_safe' || visibility === 'student_visible' || visibility === 'partner_visible';
    if (normalized.includes('counselor')) return ['public_safe', 'student_visible', 'partner_visible', 'counselor_visible', 'internal'].includes(visibility);
    if (normalized === 'visa_officer') return ['public_safe', 'visa_handover'].includes(visibility);
    if (['super_admin', 'admin', 'application_manager', 'application_team'].includes(normalized)) return visibility !== 'b2b_confidential' && visibility !== 'b2b_internal';
    return visibility === 'public_safe';
  });
}
async function ownStudentId(userId: string): Promise<string | null> {
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
  const studentActor = authRes.type === 'student' || Boolean(portal && isStudent(portal.userType, roles));
  const partnerActor = Boolean(portal && isPartner(portal.userType, roles, portal.partnerId));
  if (studentActor && partnerActor) return NextResponse.json({ success: false, error: 'Account has conflicting student and partner identities.' }, { status: 403 });
  if (partnerActor && !portal?.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });

  const studentId = authRes.type === 'student' ? authRes.data.studentId : studentActor && portal ? await ownStudentId(portal.userId) : null;
  if (studentActor && !studentId) return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });
  const app = await db.application.findFirst({ where: {
    id: params.id,
    ...(studentActor ? { studentId: studentId! } : {}),
    ...(partnerActor ? { partnerId: portal!.partnerId } : {}),
  } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });

  if (portal && !studentActor && !partnerActor) {
    const normalized = portal.roles.map((role) => role.toLowerCase());
    const globalAccess = normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) ||
      portal.permissions.includes('application.view_all') || portal.permissions.includes('application.view');
    const assigned = [app.counselorId, app.applicationOfficer, app.appTeamOfficerId, app.visaOfficerId].includes(portal.userId);
    const assignedRole = normalized.some((role) => ['counselor', 'application_officer', 'document_officer', 'visa_officer'].includes(role));
    if (!globalAccess && !(assigned && (assignedRole || portal.permissions.includes('application.view_assigned')))) {
      return NextResponse.json({ success: false, error: 'Application is not within your assigned timeline-view scope.' }, { status: 403 });
    }
  }

  const canViewB2BFlag = Boolean(portal && !studentActor && canViewB2B(portal.roles, portal.permissions));
  const [statusLogs] = await Promise.all([
    db.applicationStatusLog.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  const anonymized = statusLogs.map((log: any) => anonymizeTimelineEvent(log, canViewB2BFlag));
  const viewerRole = studentActor ? 'student' : partnerActor ? 'partner' : portal?.roles[0] || 'public';
  const timeline = filterTimelineByRole(anonymized, viewerRole, canViewB2BFlag);
  if (portal && canViewB2BFlag) await logAuditAction(portal, 'VIEW_B2B_APPLICATION_TIMELINE', 'Application', params.id, { eventCount: timeline.length });
  // Legacy student-wide timeline rows have no application foreign key; they are
  // intentionally not joined here because they can include unrelated/private events.
  return NextResponse.json({ success: true, data: timeline, timeline, oldTimeline: [] });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type !== 'portal') return NextResponse.json({ success: false, error: 'Students cannot create application timeline events.' }, { status: 403 });
  const roles = authRes.data.roles.map((role) => role.toLowerCase());
  const partnerActor = isPartner(authRes.data.userType, authRes.data.roles, authRes.data.partnerId);
  const canWrite = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || authRes.data.permissions.includes('application.update') || authRes.data.permissions.includes('application.add_timeline_event');
  if (partnerActor || !canWrite) return NextResponse.json({ success: false, error: 'Forbidden: application timeline write permission required.' }, { status: 403 });

  const parsed = timelineBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application timeline event.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  const isB2b = app.isB2b === true || app.isB2bConfidential === true || String(app.applicationSource || '').toUpperCase().startsWith('B2B_');
  const canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
  if ((isB2b || body.visibility === 'B2B_CONFIDENTIAL') && !canViewB2BFlag) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B timeline events require explicit permission.' }, { status: 403 });
  }
  const normalized = authRes.data.roles.map((role) => role.toLowerCase());
  const globalAccess = normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || authRes.data.permissions.includes('application.view_all');
  const assigned = [app.counselorId, app.applicationOfficer, app.appTeamOfficerId, app.visaOfficerId].includes(authRes.data.userId);
  if (!globalAccess && !assigned) return NextResponse.json({ success: false, error: 'Application is not within your assigned timeline-write scope.' }, { status: 403 });

  const visibility = isB2b || body.visibility === 'B2B_CONFIDENTIAL' ? 'B2B_CONFIDENTIAL' : body.visibility;
  const event = await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: '',
      newStatus: app.stage || 'NOTE',
      safeStatus: app.safeStatus,
      changedBy: authRes.data.userId,
      visibility,
      note: body.note,
    },
  });
  await logAuditAction(authRes.data, visibility === 'B2B_CONFIDENTIAL' ? 'ADD_B2B_TIMELINE_EVENT' : 'ADD_APPLICATION_TIMELINE_EVENT', 'Application', params.id, { visibility });
  return NextResponse.json({ success: true, data: event, timeline: event }, { status: 201 });
}
