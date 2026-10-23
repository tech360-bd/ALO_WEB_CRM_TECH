import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import {
  canViewB2B,
  canViewB2BCommission,
  calculateKPIs,
  mapStageToSafeStatus,
  stripB2BFields,
  sanitizeB2BApplicationRecord,
  sanitizeB2BProvider,
  filterCommentsByVisibility,
  filterDocumentsByVisibility,
  anonymizeTimelineEvent,
} from '@/lib/application-manager/service';

function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

function isB2bApplication(application: any): boolean {
  return application?.isB2b === true || application?.isB2bConfidential === true ||
    String(application?.applicationSource || '').toUpperCase().startsWith('B2B_') ||
    String(application?.stage || '').toUpperCase().includes('B2B');
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const roles = auth.roles.map((role) => role.toLowerCase());
  if (isPartner(auth)) return NextResponse.json({ success: false, error: 'Application Manager dashboard is not available to partner accounts.' }, { status: 403 });

  const allowed = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) ||
    auth.permissions.includes('application.view_all') || auth.permissions.includes('application.view_reports');
  if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden: Application Manager access required.' }, { status: 403 });

  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);

  try {
    const applicationScopeWhere: Record<string, any> = canViewB2BFlag ? {} : {
      isB2b: false,
      isB2bConfidential: false,
      applicationSource: { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
      stage: { notIn: ['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED'] },
      b2bApplications: { none: {} },
    };
    const applicationRelation = { is: applicationScopeWhere };
    const [applications, applicationCount, b2bApplications, b2bProviders, comments, documents, deadlines, tasks, statusLogs] = await Promise.all([
      db.application.findMany({ where: applicationScopeWhere, orderBy: { updatedAt: 'desc' }, take: 100 }),
      db.application.count({ where: applicationScopeWhere }),
      canViewB2BFlag ? db.b2bApplication.findMany({ include: { b2bProvider: true }, orderBy: { createdAt: 'desc' }, take: 100 }) : Promise.resolve([]),
      canViewB2BFlag ? db.b2bProvider.findMany({ orderBy: { name: 'asc' }, take: 200 }) : Promise.resolve([]),
      db.applicationComment.findMany({ where: { application: applicationRelation }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.applicationDocument.findMany({ where: { application: applicationRelation }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.applicationDeadline.findMany({ where: { application: applicationRelation, status: { not: 'COMPLETED' } }, orderBy: { deadlineDate: 'asc' }, take: 100 }),
      db.applicationTask.findMany({ where: { application: applicationRelation, status: 'PENDING' }, orderBy: { dueDate: 'asc' }, take: 100 }),
      db.applicationStatusLog.findMany({ where: { application: applicationRelation }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);

    const visibleApplicationsForMetrics = canViewB2BFlag ? applications : applications.filter((application: any) => !isB2bApplication(application));
    const visibleApplicationIds = new Set(visibleApplicationsForMetrics.map((application: any) => application.id));
    const safeApplications = applications.map((application: any) => ({
      ...stripB2BFields(application, canViewB2BFlag, canViewCommission),
      safeStatus: application.safeStatus || mapStageToSafeStatus(application.stage),
    }));
    const safeB2bApplications = b2bApplications.map((record: any) => sanitizeB2BApplicationRecord(record, canViewCommission));
    const safeProviders = b2bProviders.map((provider: any) => sanitizeB2BProvider(provider, canViewCommission));
    const safeComments = filterCommentsByVisibility(comments, canViewB2BFlag, auth.roles[0] || '')
      .filter((comment: any) => canViewB2BFlag || visibleApplicationIds.has(comment.applicationId))
      .map((comment: any) => { const { attachmentPath: _attachmentPath, ...safe } = comment; return safe; });
    const safeDocuments = filterDocumentsByVisibility(documents, canViewB2BFlag)
      .filter((document: any) => canViewB2BFlag || visibleApplicationIds.has(document.applicationId))
      .map((document: any) => {
        const { fileUrl: _fileUrl, documentId: _documentId, storagePath: _storagePath, signedUrl: _signedUrl, downloadUrl: _downloadUrl, ...safe } = document;
        return safe;
      });
    const safeDeadlines = deadlines
      .filter((deadline: any) => canViewB2BFlag || visibleApplicationIds.has(deadline.applicationId))
      .map((deadline: any) => {
        if (canViewB2BFlag || !/\bb2b\b|provider|commission|portal credential/i.test(String(deadline.note || ''))) return deadline;
        return { ...deadline, note: 'Application follow-up' };
      });
    const safeTasks = tasks.filter((task: any) => canViewB2BFlag || visibleApplicationIds.has(task.applicationId));
    const safeStatusLogs = statusLogs.map((log: any) => anonymizeTimelineEvent(log, canViewB2BFlag))
      .filter((log: any) => canViewB2BFlag || visibleApplicationIds.has(log.applicationId));

    const kpis = calculateKPIs(visibleApplicationsForMetrics, safeB2bApplications, safeDocuments, safeDeadlines, safeTasks);
    kpis.totalApplications = applicationCount;

    const stageBreakdown = visibleApplicationsForMetrics.reduce((acc: Record<string, number>, application: any) => {
      const label = canViewB2BFlag ? application.stage : (application.safeStatus || mapStageToSafeStatus(application.stage));
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const sourceBreakdown = visibleApplicationsForMetrics.reduce((acc: Record<string, number>, application: any) => {
      const source = String(application.applicationSource || 'UNKNOWN').toUpperCase();
      const label = canViewB2BFlag || !source.startsWith('B2B_') ? source : 'OTHER_OR_RESTRICTED';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const countryBreakdown = visibleApplicationsForMetrics.reduce((acc: Record<string, number>, application: any) => {
      const country = application.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    const universityResponse = Object.entries(stageBreakdown).map(([stage, count]) => ({ stage, count }));
    const confidentialAlerts = canViewB2BFlag
      ? b2bApplications.filter((record: any) => record.b2bStatus === 'SUBMITTED' || !record.nextFollowupAt || new Date(record.nextFollowupAt) <= new Date()).slice(0, 10).map((record: any) => sanitizeB2BApplicationRecord(record, canViewCommission))
      : [];

    const now = new Date();
    const dueToday = safeDeadlines.filter((deadline: any) => new Date(deadline.deadlineDate).toDateString() === now.toDateString());
    const overdue = safeDeadlines.filter((deadline: any) => new Date(deadline.deadlineDate) < now);

    return NextResponse.json({
      success: true,
      kpis,
      metrics: kpis,
      applications: safeApplications.slice(0, 20),
      b2bApplications: safeB2bApplications.slice(0, 20),
      b2bProviders: safeProviders,
      comments: safeComments.slice(0, 20),
      documents: safeDocuments.slice(0, 20),
      deadlines: safeDeadlines,
      tasks: safeTasks,
      statusLogs: safeStatusLogs,
      breakdowns: { stages: stageBreakdown, sources: sourceBreakdown, countries: countryBreakdown, universityResponse },
      alerts: {
        confidential: confidentialAlerts,
        dueToday,
        overdue,
        urgentDeadlines: safeDeadlines.filter((deadline: any) => new Date(deadline.deadlineDate) <= new Date(Date.now() + 3 * 86400000)),
      },
      meta: { canViewB2B: canViewB2BFlag, canViewB2BCommission: canViewCommission },
    });
  } catch (error) {
    console.error('[application-manager.dashboard] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to load Application Manager dashboard.' }, { status: 503 });
  }
}
