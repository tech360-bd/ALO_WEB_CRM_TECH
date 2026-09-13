import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  // Ownership check
  if (authRes.type === 'student' && app.studentId !== authRes.data.studentId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const offers = await db.applicationOffer.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' } });
  const applicationOffers = await db.application.findUnique({ where: { id: params.id }, select: { offerStatus: true, stage: true, safeStatus: true } });

  return NextResponse.json({ success: true, data: offers, offers, application: applicationOffers });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') return NextResponse.json({ success: false, error: 'Students cannot manage offers' }, { status: 403 });

  const roles = authRes.data.roles || [];
  const canManageOffer = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || authRes.data.permissions.includes('application.manage_offer');
  if (!canManageOffer) return NextResponse.json({ success: false, error: 'Forbidden: manage_offer permission required' }, { status: 403 });

  const body = await req.json();
  const validStatuses = ['DECISION_PENDING', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'REJECTED', 'DEFERRED', 'WITHDRAWN', 'MORE_DOCUMENTS_REQUESTED', 'INTERVIEW_REQUIRED', 'APPLICATION_FEE_PENDING', 'DEPOSIT_REQUIRED'];
  if (body.offerStatus && !validStatuses.includes(body.offerStatus)) {
    return NextResponse.json({ success: false, error: `Invalid offerStatus. Must be one of ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const existing = await db.applicationOffer.findUnique({ where: { applicationId: params.id } });

  let offer;
  if (existing) {
    offer = await db.applicationOffer.update({
      where: { applicationId: params.id },
      data: {
        offerStatus: body.offerStatus || existing.offerStatus,
        offerLetterUrl: body.offerLetterUrl ?? existing.offerLetterUrl,
        offerConditions: body.offerConditions ?? existing.offerConditions,
        conditionDeadline: body.conditionDeadline ? new Date(body.conditionDeadline) : existing.conditionDeadline,
        scholarship: body.scholarship ?? existing.scholarship,
        scholarshipAmount: body.scholarshipAmount ?? existing.scholarshipAmount,
        depositAmount: body.depositAmount ?? existing.depositAmount,
        depositDeadline: body.depositDeadline ? new Date(body.depositDeadline) : existing.depositDeadline,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : existing.decisionDate,
        decisionNote: body.decisionNote ?? existing.decisionNote,
        studentNotified: body.studentNotified ?? existing.studentNotified,
        partnerNotified: body.partnerNotified ?? existing.partnerNotified,
      },
    });
  } else {
    offer = await db.applicationOffer.create({
      data: {
        applicationId: params.id,
        offerStatus: body.offerStatus || 'DECISION_PENDING',
        offerLetterUrl: body.offerLetterUrl || '',
        offerConditions: body.offerConditions || '',
        conditionDeadline: body.conditionDeadline ? new Date(body.conditionDeadline) : null,
        scholarship: body.scholarship || '',
        scholarshipAmount: body.scholarshipAmount || 0,
        depositAmount: body.depositAmount || 0,
        depositDeadline: body.depositDeadline ? new Date(body.depositDeadline) : null,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : new Date(),
        decisionNote: body.decisionNote || '',
      },
    });
  }

  // Update application stage and safeStatus
  let newStage = '';
  if (body.offerStatus === 'CONDITIONAL_OFFER') newStage = 'CONDITIONAL_OFFER';
  else if (body.offerStatus === 'UNCONDITIONAL_OFFER') newStage = 'UNCONDITIONAL_OFFER';
  else if (body.offerStatus === 'REJECTED') newStage = 'REJECTED';
  else if (body.offerStatus === 'DEFERRED') newStage = 'DEFERRED';

  if (newStage) {
    await db.application.update({
      where: { id: params.id },
      data: { stage: newStage, safeStatus: newStage === 'REJECTED' ? 'REJECTED' : newStage === 'DEFERRED' ? 'DEFERRED' : 'OFFER_RECEIVED', offerStatus: body.offerStatus },
    });

    await db.applicationStatusLog.create({
      data: {
        applicationId: params.id,
        oldStatus: '',
        newStatus: newStage,
        safeStatus: newStage === 'REJECTED' ? 'REJECTED' : newStage === 'DEFERRED' ? 'DEFERRED' : 'OFFER_RECEIVED',
        changedBy: authRes.data.userId,
        visibility: 'public_safe',
        note: `Offer status updated to ${body.offerStatus}`,
      },
    });
  }

  await logAuditAction(authRes.data, 'MANAGE_OFFER', 'Application', params.id, { offerStatus: body.offerStatus });
  await db.auditLog.create({
    data: {
      userId: authRes.data.userId,
      action: 'MANAGE_OFFER',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify({ offerStatus: body.offerStatus }),
      actorRole: roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: offer, offer, message: 'Offer updated' });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return POST(req, { params });
}
