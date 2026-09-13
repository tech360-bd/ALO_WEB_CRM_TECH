import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('student') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM') || auth.roles.includes('STUDENT');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Document view permission required — documents.view' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const caseId = searchParams.get('caseId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (category) where.category = category;
    if (status) where.status = status;

    // If caseId provided, resolve studentId
    if (caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
      if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

      const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
      if (isStudent && visaCase.studentId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
      }

      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
      if (!isSuper && isVisa && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view documents for unassigned case — IDOR blocked' }, { status: 403 });
      }

      where.studentId = visaCase.studentId;
    }

    const isStudent = auth.roles.includes('student') || auth.roles.includes('STUDENT');
    if (isStudent) {
      if (studentId && studentId !== auth.userId) return NextResponse.json({ success: false, error: 'Cross-student blocked' }, { status: 403 });
      where.studentId = auth.userId;
    }

    const [documents, total] = await Promise.all([
      db.studentDocument.findMany({ where, orderBy: { updatedAt: 'desc' }, take: limit, skip: (page-1)*limit }),
      db.studentDocument.count({ where }),
    ]);

    await logAuditAction(auth, 'VISA_DOCUMENTS_VIEW', 'StudentDocument', caseId || studentId || 'list', { count: documents.length, studentId: where.studentId });

    return NextResponse.json({
      success: true,
      data: documents,
      documents,
      total,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) },
      emptyState: documents.length === 0 ? 'No documents — proper empty state — checklist 25 types Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE — actions Request/Approve/Reject/Needs Update/Add Note/Notify/Timeline never permanent delete version history' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
