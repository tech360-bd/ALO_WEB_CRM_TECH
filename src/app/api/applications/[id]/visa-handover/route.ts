import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth, { params }: any) => {
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const visaCase = await db.visaCase.findFirst({ where: { applicationId: params.id } });
  return NextResponse.json({ success: true, data: visaCase, visaCase, application: { visaHandoverStatus: app.visaHandoverStatus, stage: app.stage } });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const roles = auth.roles.map(r => r.toLowerCase());
  const canHandover = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.manage_cas_i20_coe') || auth.permissions.includes('application.view_b2b');
  if (!canHandover) {
    return NextResponse.json({ success: false, error: 'Forbidden: visa handover requires application_manager or application_team role' }, { status: 403 });
  }

  // Check if already handed over — reuse existing VisaCase, no duplicate
  const existingVisaCase = await db.visaCase.findFirst({ where: { applicationId: params.id } });
  if (existingVisaCase) {
    return NextResponse.json({ success: true, data: existingVisaCase, visaCase: existingVisaCase, message: 'Visa file already exists — reusing existing VisaCase (no duplicate created)' });
  }

  // Check if application is ready for handover
  const readyStages = ['VISA_HANDOVER_READY', 'CAS_RECEIVED', 'I20_RECEIVED', 'COE_RECEIVED', 'UNCONDITIONAL_OFFER', 'DEPOSIT_PAID'];
  if (!readyStages.includes(app.stage) && app.visaHandoverStatus !== 'READY' && app.visaHandoverStatus !== 'VISA_HANDOVER_READY') {
    // Allow but warn — set status to READY
    await db.application.update({
      where: { id: params.id },
      data: { visaHandoverStatus: 'READY', stage: 'VISA_HANDOVER_READY', safeStatus: 'VISA_PREPARATION' },
    });
  }

  // Reuse existing Visa Engine — create VisaCase with existing model
  const visaCase = await db.visaCase.create({
    data: {
      caseCode: `VISA-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`,
      studentId: app.studentId,
      studentName: '', // Will be populated from student profile if available
      applicationId: params.id,
      destinationCountry: app.country || 'UK',
      university: app.universityName,
      course: app.courseName,
      intake: app.intake,
      currentStage: 'not_started',
      readinessScore: 0,
      riskLevel: 'low',
      counselorId: app.counselorId,
      counselorName: app.counselorName,
      applicationOfficerId: app.appTeamOfficerId || app.applicationOfficer,
      visaOfficerId: '',
      isUrgent: false,
      nextAction: 'Document checklist preparation',
      responsible: 'Visa Officer',
    },
  });

  // Update application
  await db.application.update({
    where: { id: params.id },
    data: { visaHandoverStatus: 'VISA_FILE_CREATED', stage: 'VISA_FILE_CREATED', safeStatus: 'VISA_PREPARATION' },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: app.stage,
      newStatus: 'VISA_FILE_CREATED',
      safeStatus: 'VISA_PREPARATION',
      changedBy: auth.userId,
      visibility: 'public_safe',
      note: `Application handed over to Visa Team — VisaCase ${visaCase.caseCode} created`,
    },
  });

  await db.applicationComment.create({
    data: {
      applicationId: params.id,
      userId: auth.userId,
      role: auth.roles[0] || 'APPLICATION_MANAGER',
      commentType: 'VISA_HANDOVER',
      visibility: 'visa_handover',
      commentText: `Visa handover completed. Visa file ${visaCase.caseCode} created and assigned to visa team.`,
      isB2bConfidential: false,
    },
  });

  await logAuditAction(auth, 'VISA_HANDOVER', 'Application', params.id, { visaCaseId: visaCase.id, caseCode: visaCase.caseCode });
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'VISA_HANDOVER',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify({ visaCaseId: visaCase.id, caseCode: visaCase.caseCode }),
      actorRole: auth.roles[0] || '',
      studentId: app.studentId,
    },
  });

  return NextResponse.json({ success: true, data: visaCase, visaCase, message: 'Visa handover complete — VisaCase created and linked' });
});
