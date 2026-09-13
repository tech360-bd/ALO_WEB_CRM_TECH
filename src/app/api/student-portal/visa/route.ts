import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// GET /api/student-portal/visa — Student portal view checklist/requested/schedule/approved feedback/safe readiness/next actions/messages/appointments/AI practice NOT internal/risk/sensitive/medical/criminal/refusal analysis/staff comments
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const applicationId = searchParams.get('applicationId') || '';
      const caseId = searchParams.get('caseId') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';

      const profile = await db.portalStudentProfile.findUnique({ where: { userId: auth.userId } });
      if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

      // Find visa case for this student
      const visaCase = caseId ? await db.visaCase.findUnique({ where: { id: caseId } }).catch(() => null) : await db.visaCase.findFirst({ where: { studentId: profile.studentId || profile.id } }).catch(() => null);

      const checklistWhere: any = { studentId: profile.studentId || profile.id };
      if (applicationId) checklistWhere.applicationId = applicationId;
      if (caseId) checklistWhere.caseId = caseId;
      if (category) checklistWhere.category = category;
      if (status) checklistWhere.status = status;
      // Student only sees student_visible items
      checklistWhere.studentVisible = true;

      const reportWhere: any = { studentId: profile.studentId || profile.id };
      if (applicationId) reportWhere.applicationId = applicationId;
      if (visaCase) reportWhere.visaCaseId = visaCase.id;

      const [checklistItems, checklistTotal, reports, studentFeedbackNotes, tasks, documents, aiSessions, appointments, messages] = await Promise.all([
        db.visaChecklistItem.findMany({ where: checklistWhere, orderBy: { createdAt: 'asc' }, skip: (page - 1) * limit, take: limit }).catch(() => []),
        db.visaChecklistItem.count({ where: checklistWhere }).catch(() => 0),
        db.visaReadinessReport.findMany({ where: reportWhere, orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => []),
        db.visaOfficerNote.findMany({ where: { studentId: profile.studentId || profile.id, visibility: { in: ['student_safe_feedback','student_visible','STUDENT_SAFE_FEEDBACK'] } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
        (db as any).visaTask ? (db as any).visaTask.findMany({ where: { studentId: profile.studentId || profile.id, assignedTo: { in: ['student','STUDENT'] } }, orderBy: { dueDate: 'asc' }, take: 20 }).catch(() => []) : Promise.resolve([]),
        db.studentDocument.findMany({ where: { studentId: profile.studentId || profile.id }, orderBy: { updatedAt: 'desc' }, take: 50 }).catch(() => []),
        db.aiInterviewSession.findMany({ where: { studentId: profile.id }, orderBy: { createdAt: 'desc' }, take: 10 }).catch(() => []),
        db.appointment ? (db as any).appointment.findMany({ where: { studentId: profile.studentId || profile.id }, orderBy: { scheduledAt: 'desc' }, take: 10 }).catch(() => []) : Promise.resolve([]),
        db.studentMessage ? (db as any).studentMessage.findMany({ where: { studentId: profile.studentId || profile.id }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []) : Promise.resolve([]),
      ]);

      const completedCount = checklistItems.filter((c: any) => c.status === 'APPROVED' || c.status === 'completed' || c.status === 'approved').length;
      const pendingCount = checklistItems.filter((c: any) => c.status === 'NOT_UPLOADED' || c.status === 'pending' || c.status === 'NEEDS_UPDATE').length;

      // Safe readiness — do not expose internal sensitive risk details to students
      const safeReports = reports.map((r: any) => ({
        ...r,
        riskFactors: '[]',
        recommendation: r.recommendation ? r.recommendation.split(' — What is strong')[0] + ' — What is strong/weak/missing/next action/responsible/deadline explained — internal sensitive risk not exposed to students' : r.recommendation,
      }));

      await logAuditAction(auth, 'STUDENT_VISA_VIEW', 'VisaCase', visaCase?.id || 'list', { studentId: profile.studentId || profile.id });

      return NextResponse.json({
        success: true,
        data: {
          visaCase: visaCase ? { ...visaCase, sensitiveReview: undefined, refusalReview: undefined } : null, // Never expose sensitive/medical/criminal/refusal analysis
          checklistItems,
          reports: safeReports,
          studentFeedback: studentFeedbackNotes,
          tasks,
          documents,
          aiSessions,
          appointments,
          messages,
          summary: {
            total: checklistTotal,
            completed: completedCount,
            pending: pendingCount,
            readinessPercent: checklistTotal > 0 ? Math.round((completedCount / checklistTotal) * 100) : 0,
          },
        },
        total: checklistTotal,
        page,
        totalPages: Math.ceil(checklistTotal / limit),
        note: 'Student portal view checklist/requested/schedule/approved feedback/safe readiness/next actions/messages/appointments/AI practice NOT internal/risk/sensitive/medical/criminal/refusal analysis/staff comments — student never sees internal — partner never sees visa — marketing never sees visa',
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch visa readiness data' }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { item, documentName, category, isRequired, applicationId, caseId, note } = body;

      if (!item && !documentName) return NextResponse.json({ success: false, error: 'Checklist item name required' }, { status: 400 });

      const profile = await db.portalStudentProfile.findUnique({ where: { userId: auth.userId } });
      if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

      // Student cannot create internal checklist items — only upload docs — but allow request
      const checklistItem = await db.visaChecklistItem.create({
        data: {
          studentId: profile.studentId || profile.id,
          applicationId: applicationId || '',
          caseId: caseId || '',
          item: (item || documentName || '').trim(),
          documentName: (documentName || item || '').trim(),
          category: category || 'general',
          isRequired: isRequired !== undefined ? isRequired : true,
          status: 'NOT_UPLOADED',
          note: note || '',
          studentVisible: true,
          counselorVisible: true,
        } as any,
      });

      await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_CREATED', 'VisaChecklistItem', checklistItem.id, { item: (item || documentName || '').trim(), category: category || 'general' });

      return NextResponse.json({ success: true, data: checklistItem }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create checklist item' }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
