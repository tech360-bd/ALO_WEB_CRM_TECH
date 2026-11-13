import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { hasVisaPermission, isVisaSuperAdmin, visaDashboardWhere } from '@/lib/visa/access';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  try {
    const where = visaDashboardWhere(auth);
    if (!where) return NextResponse.json({ success: false, error: 'visa.dashboard.view permission required; case metrics are limited to assigned scope.' }, { status: 403 });

    const [totalAssigned, cases] = await Promise.all([
      db.visaCase.count({ where }),
      db.visaCase.findMany({ where, select: { id: true, studentId: true, currentStage: true, riskLevel: true, createdAt: true } }),
    ]);
    const caseIds = cases.map((item) => item.id);
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sensitiveAccess = isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.risk.view');

    const [newThisWeek, scheduledToday, pendingInterviews, overdueInterviews, checklistItems, interviewQueueCount, taskRows, fundingReviews, refusalReviews, practiceNeededCount, riskAssessments] = await Promise.all([
      db.visaCase.count({ where: { ...where, createdAt: { gte: weekStart } } }),
      caseIds.length ? db.visaInterview.count({ where: { caseId: { in: caseIds }, scheduledAt: { gte: dayStart, lt: dayEnd }, status: { notIn: ['completed', 'cancelled'] } } }) : 0,
      caseIds.length ? db.visaInterview.count({ where: { caseId: { in: caseIds }, status: { in: ['scheduled', 'pending', 'in_progress'] } } }) : 0,
      caseIds.length ? db.visaInterview.count({ where: { caseId: { in: caseIds }, scheduledAt: { lt: now }, status: { notIn: ['completed', 'cancelled'] } } }) : 0,
      caseIds.length ? db.visaChecklistItem.findMany({ where: { caseId: { in: caseIds }, archivedAt: null }, select: { status: true, isRequired: true } }) : [],
      db.visaCase.count({ where: { ...where, currentStage: { in: ['AI Interview Pending', 'Officer Review Pending', 'AI_INTERVIEW_PENDING', 'OFFICER_REVIEW_PENDING', 'ai_interview_pending', 'officer_review_pending'] } } }),
      caseIds.length ? db.visaTask.findMany({ where: { caseId: { in: caseIds }, archivedAt: null }, select: { assignedTo: true, status: true, dueDate: true } }) : [],
      sensitiveAccess && caseIds.length ? db.visaFundingReview.findMany({ where: { caseId: { in: caseIds } }, select: { hasBankStatement: true, hasSolvencyCert: true, riskWarning: true } }) : [],
      sensitiveAccess && caseIds.length ? db.visaRefusalReview.findMany({ where: { caseId: { in: caseIds }, hasVisaRefusal: true }, select: { caseId: true, refusalLetterUrl: true, humanReviewStatus: true } }) : [],
      caseIds.length ? db.visaInterview.count({ where: { caseId: { in: caseIds }, status: 'completed', readiness: { in: ['needs_practice', 'needs_documents', 'human_review_required'] } } }) : 0,
      sensitiveAccess && caseIds.length ? db.visaRiskAssessment.findMany({ where: { caseId: { in: caseIds } }, select: { caseId: true, overallRiskLevel: true } }) : [],
    ]);

    const requiredItems = checklistItems.filter((item) => item.isRequired !== false);
    const taskIsPending = (task: { status: string; dueDate: Date | null }) => !['completed', 'cancelled', 'archived'].includes(String(task.status).toLowerCase());
    const overdueTasks = taskRows.filter((task) => task.dueDate && task.dueDate < now && taskIsPending(task));
    const readinessStages = cases.map((item) => String(item.currentStage || '').toLowerCase());
    const highRiskCount = sensitiveAccess ? riskAssessments.filter((item) => ['high', 'critical'].includes(item.overallRiskLevel.toLowerCase())).length : null;
    const financialMetrics = sensitiveAccess ? {
      bankStatementMissing: fundingReviews.filter((review) => !review.hasBankStatement).length,
      fundingReviewsPendingHumanReview: fundingReviews.filter((review) => review.riskWarning && !['none', 'low', 'clear'].includes(review.riskWarning.toLowerCase())).length,
    } : null;
    const refusalMetrics = sensitiveAccess ? {
      casesWithPriorRefusal: refusalReviews.length,
      refusalLetterMissing: refusalReviews.filter((review) => !review.refusalLetterUrl).length,
      humanReviewRequired: refusalReviews.filter((review) => !['complete', 'cleared', 'approved', 'reviewed'].includes(review.humanReviewStatus.toLowerCase())).length,
    } : null;

    try {
      await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId, action: 'VISA_DASHBOARD_VIEW', entityType: 'VisaCase', entityId: 'dashboard', metadata: JSON.stringify({ caseCount: totalAssigned, sensitiveAggregatesIncluded: sensitiveAccess }), ipAddress: '', userAgent: '' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Dashboard view could not be audited; retry after service recovery.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalAssigned,
        newThisWeek,
        highRiskCount,
        riskAssessmentPendingCount: sensitiveAccess ? Math.max(0, totalAssigned - riskAssessments.length) : null,
        interviewQueueCount,
        scheduledToday,
        pendingInterviews,
        overdueInterviews,
        docsPendingCount: requiredItems.filter((item) => ['not_uploaded', 'missing', 'needs_update', 'pending_review', 'uploaded', 'pending'].includes(String(item.status).toLowerCase())).length,
        missingDocuments: requiredItems.filter((item) => ['not_uploaded', 'missing'].includes(String(item.status).toLowerCase())).length,
        documentsPendingReview: requiredItems.filter((item) => ['pending_review', 'uploaded', 'pending'].includes(String(item.status).toLowerCase())).length,
        rejectedDocuments: requiredItems.filter((item) => String(item.status).toLowerCase() === 'rejected').length,
        readyForReview: readinessStages.filter((stage) => ['officer review pending', 'officer_review_pending', 'ready for visa application', 'ready_for_visa_application'].includes(stage)).length,
        interviewsNeedingHumanFollowUp: practiceNeededCount,
        financialReview: financialMetrics,
        refusalHistory: refusalMetrics,
        counselorHandover: { pendingActions: taskRows.filter((task) => /counselor/i.test(task.assignedTo) && taskIsPending(task)).length, overdueTasks: overdueTasks.length },
      },
      emptyState: totalAssigned === 0 ? 'No visa cases assigned.' : null,
      notice: 'Metrics describe recorded case/task state only; no success-rate, eligibility, embassy, or outcome prediction is provided.',
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch (error) {
    console.error('[visa-dashboard] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to fetch visa dashboard metrics.' }, { status: 500 });
  }
});
