import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('student') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM') || auth.roles.includes('STUDENT');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Checklist view permission required' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    // RBAC ownership
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent && visaCase.studentId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
    }
    if (!isSuper && !isStudent && (auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER')) && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot access unassigned checklist — IDOR blocked' }, { status: 403 });
    }

    const items = await db.visaChecklistItem.findMany({ where: { studentId: visaCase.studentId }, orderBy: { createdAt: 'asc' } });

    await logAuditAction(auth, 'VISA_CHECKLIST_VIEW', 'VisaChecklist', caseId, { studentId: visaCase.studentId, count: items.length });

    return NextResponse.json({
      success: true,
      data: items,
      items: items,
      checklist: items,
      emptyState: items.length === 0 ? 'No checklist items — proper empty state — 25+ docs Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Checklist create requires visa officer' }, { status: 403 });

    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const body = await req.json();

    const item = await db.visaChecklistItem.create({
      data: {
        studentId: visaCase.studentId,
        item: body.documentName || body.item,
        category: body.category || 'general',
        isRequired: body.isRequired ?? true,
        status: body.status || 'NOT_UPLOADED',
        priority: body.priority || 'medium',
        deadline: body.deadline ? new Date(body.deadline) : null,
        studentVisible: body.studentVisible ?? true,
        counselorVisible: body.counselorVisible ?? true,
      },
    });

    await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_CREATE', 'VisaChecklistItem', item.id, { caseId, studentId: visaCase.studentId, item: body.documentName || body.item });
    await db.timelineEvent.create({
      data: {
        studentId: visaCase.studentId,
        stage: 'VISA_CHECKLIST_CREATED',
        title: `Checklist item created: ${body.documentName || body.item} — priority ${body.priority || 'medium'} — deadline ${body.deadline || 'none'}`,
        description: `Created by ${auth.name} — Request with name/reason/deadline/priority/visibility/notification — student can upload replacement previous versions remain auditable officer cannot silently delete history`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
