import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canSubmit = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.submit');
  if (!canSubmit) return NextResponse.json({ success: false, error: 'Forbidden: submit requires application_manager role' }, { status: 403 });

  const body = await req.json();
  const validMethods = ['DIRECT_UNIVERSITY_PORTAL', 'EMAIL', 'UNIVERSITY_REPRESENTATIVE', 'B2B_INBOUND', 'B2B_OUTBOUND', 'PARTNER_SUBMISSION', 'MANUAL'];
  if (body.submissionMethod && !validMethods.includes(body.submissionMethod)) {
    return NextResponse.json({ success: false, error: `Invalid submissionMethod. Must be one of ${validMethods.join(', ')}` }, { status: 400 });
  }

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  // If B2B submission, check permission
  if ((body.submissionMethod === 'B2B_INBOUND' || body.submissionMethod === 'B2B_OUTBOUND') && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B submission requires application.view_b2b permission' }, { status: 403 });
  }

  // Update application stage to submitted
  const newStage = body.submissionMethod === 'B2B_INBOUND' || body.submissionMethod === 'B2B_OUTBOUND' ? 'SUBMITTED_TO_B2B' : 'SUBMITTED_TO_UNIVERSITY';

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      stage: newStage,
      safeStatus: 'SUBMITTED',
      updatedBy: auth.userId,
    },
  });

  // Create status log with submission details
  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: existing.stage,
      newStatus: newStage,
      safeStatus: 'SUBMITTED',
      changedBy: auth.userId,
      visibility: (body.submissionMethod === 'B2B_INBOUND' || body.submissionMethod === 'B2B_OUTBOUND') ? 'B2B_CONFIDENTIAL' : 'public_safe',
      note: `Submitted via ${body.submissionMethod || 'UNIVERSITY_PORTAL'}${body.submittedTo ? ` to ${body.submittedTo}` : ''}${body.acknowledgementNumber ? ` Ack: ${body.acknowledgementNumber}` : ''}. ${body.note || ''}`,
    },
  });

  // Create comment for submission
  await db.applicationComment.create({
    data: {
      applicationId: params.id,
      userId: auth.userId,
      role: auth.roles[0] || 'APPLICATION_TEAM',
      commentType: body.submissionMethod?.startsWith('B2B') ? 'B2B_CONFIDENTIAL' : 'APPLICATION_TEAM_INTERNAL',
      visibility: body.submissionMethod?.startsWith('B2B') ? 'B2B_CONFIDENTIAL' : 'internal',
      commentText: `Application submitted via ${body.submissionMethod || 'UNIVERSITY_PORTAL'} to ${body.submittedTo || 'University'} on ${body.submittedDate || new Date().toISOString()}. Portal Ref: ${body.portalReference || 'N/A'} Uni App ID: ${body.universityApplicationId || 'N/A'} Expected Response: ${body.expectedResponseDate || 'N/A'} Fee: ${body.feeStatus || 'PENDING'}`,
      isB2bConfidential: body.submissionMethod?.startsWith('B2B') || false,
    },
  });

  // If B2B, create or update B2bApplication
  if ((body.submissionMethod === 'B2B_INBOUND' || body.submissionMethod === 'B2B_OUTBOUND') && body.b2bProviderId) {
    const existingB2b = await db.b2bApplication.findFirst({ where: { applicationId: params.id, b2bProviderId: body.b2bProviderId } });
    if (existingB2b) {
      await db.b2bApplication.update({
        where: { id: existingB2b.id },
        data: {
          b2bStatus: 'SUBMITTED',
          submissionRoute: body.submissionMethod,
          b2bReference: body.b2bReference || existingB2b.b2bReference,
          portalReference: body.portalReference || existingB2b.portalReference,
          universityApplicationId: body.universityApplicationId || existingB2b.universityApplicationId,
          lastFollowupAt: new Date(),
        },
      });
    } else {
      await db.b2bApplication.create({
        data: {
          applicationId: params.id,
          b2bProviderId: body.b2bProviderId,
          b2bType: body.submissionMethod as any,
          b2bReference: body.b2bReference || '',
          submissionRoute: body.submissionMethod,
          b2bStatus: 'SUBMITTED',
          portalReference: body.portalReference || '',
          universityApplicationId: body.universityApplicationId || '',
          createdBy: auth.userId,
        },
      });
    }
  }

  await logAuditAction(auth, 'SUBMIT_APPLICATION', 'Application', params.id, body);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'SUBMIT_APPLICATION',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify({ submissionMethod: body.submissionMethod, submittedTo: body.submittedTo }),
      actorRole: auth.roles[0] || '',
      studentId: existing.studentId,
    },
  });

  return NextResponse.json({ success: true, data: updated, application: updated, message: `Application submitted via ${body.submissionMethod || 'UNIVERSITY_PORTAL'}` });
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  return POST(req, auth, { params } as any);
});
