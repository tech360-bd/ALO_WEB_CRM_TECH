import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, canViewB2BCommission, stripB2BFields, mapStageToSafeStatus, filterCommentsByVisibility, filterDocumentsByVisibility, anonymizeTimelineEvent } from '@/lib/application-manager/service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({
    where: { id: params.id },
    include: {
      b2bApplications: { include: { b2bProvider: true } },
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      comments: { orderBy: { createdAt: 'desc' }, take: 100 },
      documents: { orderBy: { createdAt: 'desc' } },
      deadlines: { orderBy: { deadlineDate: 'asc' } },
      tasks: { orderBy: { dueDate: 'asc' } },
      offer: true,
      casI20Coe: true,
      finance: true,
    },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  // Ownership check
  if (authRes.type === 'student') {
    if (app.studentId !== authRes.data.studentId) {
      return NextResponse.json({ success: false, error: 'Forbidden: not your application' }, { status: 403 });
    }
  } else {
    const portal = authRes.data;
    const roles = portal.roles || [];
    const isSuper = roles.includes('super_admin') || roles.includes('admin') || roles.includes('application_manager') || roles.includes('application_team');
    if (!isSuper) {
      if (portal.userType === 'partner' || roles.includes('partner')) {
        if (app.partnerId !== portal.userId) {
          return NextResponse.json({ success: false, error: 'Forbidden: not your partner application' }, { status: 403 });
        }
      } else if (roles.includes('counselor')) {
        if (app.counselorId !== portal.userId) {
          // counselor can view but not B2B confidential
        }
      }
    }
  }

  let canViewB2BFlag = false;
  let canViewCommission = false;
  if (authRes.type === 'portal') {
    canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
    canViewCommission = canViewB2BCommission(authRes.data.roles, authRes.data.permissions);
  }

  // Filter comments, documents, timeline by visibility
  const filteredComments = filterCommentsByVisibility((app as any).comments || [], canViewB2BFlag, authRes.type === 'portal' ? authRes.data.roles?.[0] : 'student');
  const filteredDocs = filterDocumentsByVisibility((app as any).documents || [], canViewB2BFlag);
  const anonymizedLogs = (app as any).statusLogs?.map((log: any) => anonymizeTimelineEvent(log, canViewB2BFlag)) || [];

  const withSafe = {
    ...app,
    safeStatus: (app as any).safeStatus || mapStageToSafeStatus(app.stage),
    comments: filteredComments,
    documents: filteredDocs,
    statusLogs: anonymizedLogs,
  };

  const sanitized = stripB2BFields(withSafe, canViewB2BFlag, canViewCommission);

  // If not authorized for B2B, also strip b2bApplications entirely
  if (!canViewB2BFlag) {
    delete (sanitized as any).b2bApplications;
    delete (sanitized as any).b2bProviderId;
    delete (sanitized as any).b2bType;
    delete (sanitized as any).isB2b;
    delete (sanitized as any).isB2bConfidential;
  }

  // Finance permission check
  if (!canViewCommission && authRes.type === 'portal') {
    if ((sanitized as any).finance) {
      const fin = (sanitized as any).finance;
      delete fin.b2bCommission;
      delete fin.b2bCommissionStatus;
      delete fin.partnerCommission;
    }
  }

  return NextResponse.json({ success: true, data: sanitized, application: sanitized, meta: { canViewB2B: canViewB2BFlag, canViewCommission } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.type === 'student') {
    return NextResponse.json({ success: false, error: 'Students cannot update application directly' }, { status: 403 });
  }

  const body = await req.json();

  // Prevent unauthorized B2B field updates
  const canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
  if (!canViewB2BFlag) {
    delete body.b2bProviderId;
    delete body.b2bType;
    delete body.isB2b;
    delete body.isB2bConfidential;
    delete body.b2bCommissionAmount;
    delete body.b2bCommissionType;
    delete body.b2bPaymentCondition;
    delete body.b2bClaimStage;
    delete body.b2bInternalNote;
    delete body.loginNote;
    delete body.portalUrl;
  }

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  // Map stage to safeStatus if stage changed
  if (body.stage && body.stage !== existing.stage) {
    body.safeStatus = mapStageToSafeStatus(body.stage);
  }

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      ...body,
      updatedBy: authRes.data.userId,
    },
  });

  if (body.stage && body.stage !== existing.stage) {
    await db.applicationStatusLog.create({
      data: {
        applicationId: params.id,
        oldStatus: existing.stage,
        newStatus: body.stage,
        safeStatus: body.safeStatus || mapStageToSafeStatus(body.stage),
        changedBy: authRes.data.userId,
        visibility: (existing as any).isB2bConfidential ? 'B2B_CONFIDENTIAL' : 'public_safe',
        note: body.statusNote || `Stage changed from ${existing.stage} to ${body.stage}`,
      },
    });
  }

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'UPDATE_APPLICATION', 'Application', params.id, { stage: body.stage });
    await db.auditLog.create({
      data: {
        userId: authRes.data.userId,
        action: 'UPDATE_APPLICATION',
        resource: 'Application',
        resourceId: params.id,
        details: JSON.stringify({ before: { stage: existing.stage }, after: { stage: body.stage } }),
        actorRole: authRes.data.roles?.[0] || '',
        studentId: existing.studentId,
        beforeValue: JSON.stringify(existing),
        afterValue: JSON.stringify(updated),
      },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}
