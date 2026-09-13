import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'Case ID required' }, { status: 400 });

    const visaCase = await db.visaCase.findUnique({ where: { id } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isCounselor = auth.roles.includes('counselor') || auth.roles.includes('COUNSELOR');
    const isApplicationTeam = auth.roles.includes('application_team') || auth.roles.includes('APPLICATION_TEAM');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');

    // RBAC: visa officers can only view assigned unless super_admin
    if (!isSuper && !isCounselor && !isApplicationTeam && isVisa && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned case without permission — IDOR blocked — visa officer cannot access unassigned case' }, { status: 403 });
    }

    const canViewSensitive = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');

    const [interviews, fundingReview, studyGapReview, refusalReview, sensitiveReview, checklist, readinessReports, notes, tasks] = await Promise.all([
      db.visaInterview.findMany({ where: { caseId: id }, include: { answers: true } }).catch(() => []),
      db.visaFundingReview.findUnique({ where: { caseId: id } }).catch(() => null),
      db.visaStudyGapReview.findUnique({ where: { caseId: id } }).catch(() => null),
      db.visaRefusalReview.findUnique({ where: { caseId: id } }).catch(() => null),
      canViewSensitive ? db.visaSensitiveReview.findUnique({ where: { caseId: id } }).catch(() => null) : Promise.resolve(null),
      db.visaChecklistItem.findMany({ where: { studentId: visaCase.studentId } }).catch(() => []),
      db.visaReadinessReport.findMany({ where: { visaCaseId: id }, orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => []),
      db.visaOfficerNote ? (db as any).visaOfficerNote.findMany({ where: { caseId: id }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []) : Promise.resolve([]),
      (db as any).visaTask ? (db as any).visaTask.findMany({ where: { caseId: id } }).catch(() => []) : Promise.resolve([]),
    ]);

    // Audit view
    await logAuditAction(auth, 'VISA_CASE_VIEW', 'VisaCase', id, { studentId: visaCase.studentId });
    if (canViewSensitive && sensitiveReview) {
      await logAuditAction(auth, 'VISA_SENSITIVE_VIEW', 'VisaSensitiveReview', id, { studentId: visaCase.studentId, hasReview: true });
    }

    // Filter sensitive for non-authorized roles — counselor cannot see sensitive without perm, application team no medical/criminal without perm
    const filteredSensitive = canViewSensitive ? sensitiveReview : null;

    return NextResponse.json({
      success: true,
      data: {
        ...visaCase,
        interviews,
        fundingReview,
        studyGapReview,
        refusalReview,
        sensitiveReview: filteredSensitive,
        checklist,
        readinessReports,
        notes,
        tasks,
      },
      security: canViewSensitive ? 'Sensitive view audited — restricted VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN only' : 'Sensitive filtered — counselor/application team no medical/criminal without perm — every view audited',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'Case ID required' }, { status: 400 });

    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Case update requires visa officer — cases.update' }, { status: 403 });

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && existing.visaOfficerId && existing.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot update unassigned case — IDOR blocked' }, { status: 403 });
    }

    const body = await req.json();
    const { currentStage, riskLevel, readinessScore, nextAction, isUrgent, visaOfficerId, visaOfficerName, counselorId } = body;

    const dataToUpdate: any = {};
    if (currentStage !== undefined) dataToUpdate.currentStage = currentStage;
    if (riskLevel !== undefined) dataToUpdate.riskLevel = riskLevel;
    if (readinessScore !== undefined) dataToUpdate.readinessScore = readinessScore;
    if (nextAction !== undefined) dataToUpdate.nextAction = nextAction;
    if (isUrgent !== undefined) dataToUpdate.isUrgent = isUrgent;
    if (visaOfficerId !== undefined) dataToUpdate.visaOfficerId = visaOfficerId;
    if (visaOfficerName !== undefined) dataToUpdate.visaOfficerName = visaOfficerName;
    if (counselorId !== undefined) dataToUpdate.counselorId = counselorId;

    const updated = await db.visaCase.update({ where: { id }, data: dataToUpdate });

    await logAuditAction(auth, 'VISA_CASE_UPDATE', 'VisaCase', id, { before: existing, after: dataToUpdate, studentId: existing.studentId });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
