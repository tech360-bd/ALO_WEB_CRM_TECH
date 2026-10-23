import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveStudentAccess } from '@/lib/student-resource-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = await resolveStudentAccess(req, req.nextUrl.searchParams.get('studentId'));
  if (access instanceof NextResponse) return access;
  try {
    const { studentId } = access;
    const visaCase = await db.visaCase.findFirst({ where: { studentId }, orderBy: { createdAt: 'desc' }, select: { id: true, currentStage: true, updatedAt: true } });
    const checklist = visaCase ? await db.visaChecklistItem.findMany({
      where: { studentId, caseId: visaCase.id, studentVisible: true, archivedAt: null },
      select: { id: true, item: true, documentName: true, category: true, isRequired: true, status: true, priority: true, deadline: true, updatedAt: true },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    }) : [];
    const blockingItems = checklist.filter((item) => item.isRequired && !['approved', 'verified', 'complete'].includes(item.status.toLowerCase()));
    const feedback = visaCase ? await db.visaStudentFeedback.findFirst({
      where: { caseId: visaCase.id, studentId, isSentToStudent: true, approvedBy: { not: '' } },
      select: { supportiveText: true, nextSteps: true, missingDocs: true, practiceTips: true, sentAt: true },
      orderBy: { sentAt: 'desc' },
    }) : null;

    await db.portalAuditLog.create({
      data: { actorUserId: studentId, action: 'STUDENT_VISA_READINESS_VIEW', entityType: 'VisaCase', entityId: visaCase?.id || studentId, metadata: JSON.stringify({ studentId, checklistCount: checklist.length }), ipAddress: '', userAgent: req.headers.get('user-agent') || '' },
    });

    const status = !visaCase ? 'not_assessed' : blockingItems.length ? 'preparation_in_progress' : checklist.length ? 'ready_for_officer_review' : 'not_assessed';
    return NextResponse.json({
      success: true,
      case: visaCase ? { id: visaCase.id, currentStage: visaCase.currentStage, updatedAt: visaCase.updatedAt } : null,
      readiness: { status, blockingItems: blockingItems.length, totalChecklistItems: checklist.length },
      checklist,
      approvedFeedback: feedback ? {
        supportiveText: feedback.supportiveText,
        nextSteps: feedback.nextSteps,
        missingDocs: (() => { try { const value = JSON.parse(feedback.missingDocs || '[]'); return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : []; } catch { return []; } })(),
        practiceTips: feedback.practiceTips,
        sentAt: feedback.sentAt,
      } : null,
      notice: 'Preparation status is not a visa eligibility score, prediction, or guarantee. Only feedback explicitly approved and sent by the visa team is shown.',
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa preparation summary is temporarily unavailable.' }, { status: 503 });
  }
}
