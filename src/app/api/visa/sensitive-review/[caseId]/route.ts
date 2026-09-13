import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Access to sensitive medical/criminal review restricted — VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN/explicitly authorized only — Never expose to Marketing/Partner/General Employee/Sales/Public/Student normal dashboard — Every view/edit/download must create audit log' }, { status: 403 });
    }

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned sensitive review without permission — IDOR blocked' }, { status: 403 });
    }

    const review = await db.visaSensitiveReview.findUnique({ where: { caseId } });

    // Audit every view of sensitive data
    await logAuditAction(auth, 'VISA_SENSITIVE_VIEW', 'VisaSensitiveReview', caseId, { studentId: visaCase.studentId, hasReview: !!review, actorRole: auth.roles[0] });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_SENSITIVE_VIEWED',
        title: `Sensitive medical/criminal review viewed by ${auth.name} (${auth.roles[0]}) — audit logged`,
        description: `Case ${caseId} sensitive view — every view/edit/download must create audit log — restricted VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN only`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: review,
      emptyState: review ? null : 'No sensitive review — proper empty state — fields medical condition flag/explanation/document/officer internal note/student-safe note + criminal offense flag/explanation/document/officer internal note/student-safe note — restricted',
      security: 'Restricted VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN/explicitly authorized only — Never expose to Marketing/Partner/General Employee/Sales/Public/Student normal dashboard — Every view/edit/download must create audit log',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Access to sensitive medical/criminal review restricted — VISA_OFFICER/VISA_INTERVIEW_OFFICER/SUPER_ADMIN/explicitly authorized only' }, { status: 403 });
    }

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot edit unassigned sensitive review — IDOR blocked' }, { status: 403 });
    }

    const body = await req.json();

    const review = await db.visaSensitiveReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || visaCase.studentId,
        seriousMedicalCondition: body.seriousMedicalCondition || false,
        medicalExplanation: body.medicalExplanation || '',
        medicalDocumentUrl: body.medicalDocumentUrl || '',
        criminalOffense: body.criminalOffense || false,
        criminalExplanation: body.criminalExplanation || '',
        criminalDocumentUrl: body.criminalDocumentUrl || '',
        officerInternalNote: body.officerInternalNote || '',
        studentSafeNote: body.studentSafeNote || '',
        humanReviewRequired: body.humanReviewRequired || false,
      },
      update: {
        seriousMedicalCondition: body.seriousMedicalCondition,
        medicalExplanation: body.medicalExplanation,
        medicalDocumentUrl: body.medicalDocumentUrl,
        criminalOffense: body.criminalOffense,
        criminalExplanation: body.criminalExplanation,
        criminalDocumentUrl: body.criminalDocumentUrl,
        officerInternalNote: body.officerInternalNote,
        studentSafeNote: body.studentSafeNote,
        humanReviewRequired: body.humanReviewRequired,
      },
    });

    await logAuditAction(auth, 'VISA_SENSITIVE_UPDATE', 'VisaSensitiveReview', caseId, { before: null, after: review, actorRole: auth.roles[0], studentId: visaCase.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_SENSITIVE_UPDATED',
        title: `Sensitive review updated by ${auth.name} — audit logged — internal note not exposed to students`,
        description: `Case ${caseId} sensitive update — medical flag ${review.seriousMedicalCondition} criminal flag ${review.criminalOffense} — officer internal note ${review.officerInternalNote ? 'present' : 'none'} — student-safe note ${review.studentSafeNote ? 'present' : 'none'} — every view/edit/download audit logged`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: review, audit: 'Every view/edit/download must create audit log — internal sensitive risk not exposed to students' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
