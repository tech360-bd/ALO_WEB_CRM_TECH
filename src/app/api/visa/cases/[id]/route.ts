import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canUpdateVisaCase, canViewVisaSensitive, hasVisaPermission, isVisaSuperAdmin, safeVisaCaseStage, safeVisaCaseSummary, visaCaseViewScope } from '@/lib/visa/access';
import { listPrivateVisaDocumentLinks } from '@/lib/visa/private-document-links';

const updateSchema = z.object({ nextAction: z.string().trim().max(500).optional(), isUrgent: z.boolean().optional() }).strict();
function auditData(auth: AuthContext, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  return { actorUserId: auth.actorUserId, action, entityType, entityId, metadata: JSON.stringify(metadata), ipAddress: '', userAgent: '' };
}
function safeStaffCase(visaCase: any, canViewRisk: boolean) {
  return {
    id: visaCase.id,
    caseCode: visaCase.caseCode,
    studentId: visaCase.studentId,
    studentName: visaCase.studentName,
    applicationId: visaCase.applicationId,
    destinationCountry: visaCase.destinationCountry,
    university: visaCase.university,
    course: visaCase.course,
    intake: visaCase.intake,
    currentStage: visaCase.currentStage,
    ...(canViewRisk ? { riskLevel: visaCase.riskLevel } : {}),
    isUrgent: visaCase.isUrgent,
    counselorId: visaCase.counselorId,
    counselorName: visaCase.counselorName,
    applicationOfficerId: visaCase.applicationOfficerId,
    visaOfficerId: visaCase.visaOfficerId,
    visaOfficerName: visaCase.visaOfficerName,
    createdAt: visaCase.createdAt,
    updatedAt: visaCase.updatedAt,
    lastUpdated: visaCase.lastUpdated,
  };
}
function listFromJson(value: string | null | undefined): string[] {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []; } catch { return []; }
}
function privateDocumentId(value: string | null | undefined) {
  if (!value) return null;
  const match = /^\/api\/visa\/documents\/([^/]+)\/download$/.exec(value);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const visaCase = await db.visaCase.findUnique({ where: { id } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    const scope = visaCaseViewScope(auth, visaCase);
    if (!scope) return NextResponse.json({ success: false, error: 'Visa case is outside this account’s assigned scope.' }, { status: 403 });

    if (scope === 'stage') {
      try { await db.portalAuditLog.create({ data: auditData(auth, 'VISA_CASE_STAGE_VIEW', 'VisaCase', id, { studentId: visaCase.studentId, scope }) }); }
      catch { return NextResponse.json({ success: false, error: 'Visa case view could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: safeVisaCaseStage(visaCase), viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }

    if (scope === 'summary') {
      const [checklist, notes] = await Promise.all([
        db.visaChecklistItem.findMany({ where: { caseId: id, studentId: visaCase.studentId, counselorVisible: true, archivedAt: null }, select: { id: true, item: true, documentName: true, category: true, isRequired: true, status: true, deadline: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }),
        db.visaOfficerNote.findMany({ where: { caseId: id, studentId: visaCase.studentId, visibility: 'counselor_visible' }, select: { id: true, content: true, visibility: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      ]);
      try { await db.portalAuditLog.create({ data: auditData(auth, 'VISA_CASE_SUMMARY_VIEW', 'VisaCase', id, { studentId: visaCase.studentId, scope }) }); }
      catch { return NextResponse.json({ success: false, error: 'Visa case view could not be audited.' }, { status: 503 }); }
      return NextResponse.json({ success: true, data: { ...safeVisaCaseSummary(visaCase), checklist, counselorNotes: notes }, viewScope: scope }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
    }

    const isSuper = isVisaSuperAdmin(auth);
    const canViewRisk = isSuper || hasVisaPermission(auth, 'visa.risk.view');
    const canViewReadiness = isSuper || hasVisaPermission(auth, 'visa.readiness.view');
    const canViewSensitive = canViewVisaSensitive(auth, visaCase);
    const canViewInterviews = isSuper || hasVisaPermission(auth, 'visa.interviews.view');
    const canViewDocuments = isSuper || hasVisaPermission(auth, 'visa.documents.view');
    const canDownloadDocuments = isSuper || hasVisaPermission(auth, 'visa.documents.download');
    const canViewTasks = isSuper || hasVisaPermission(auth, 'visa.tasks.view');
    const canViewNotes = isSuper || hasVisaPermission(auth, 'visa.notes.internal.view');

    const [interviews, rawFundingReview, rawStudyGapReview, rawRefusalReview, rawSensitiveReview, checklist, readinessReports, notes, tasks] = await Promise.all([
      canViewInterviews ? db.visaInterview.findMany({ where: { caseId: id, studentId: visaCase.studentId }, include: { answers: true, questions: true }, orderBy: { scheduledAt: 'desc' } }) : Promise.resolve([]),
      canViewRisk ? db.visaFundingReview.findUnique({ where: { caseId: id } }) : Promise.resolve(null),
      canViewRisk ? db.visaStudyGapReview.findUnique({ where: { caseId: id } }) : Promise.resolve(null),
      canViewRisk ? db.visaRefusalReview.findUnique({ where: { caseId: id } }) : Promise.resolve(null),
      canViewSensitive ? db.visaSensitiveReview.findUnique({ where: { caseId: id } }) : Promise.resolve(null),
      canViewDocuments ? db.visaChecklistItem.findMany({ where: { caseId: id, studentId: visaCase.studentId, archivedAt: null }, orderBy: { updatedAt: 'desc' } }) : Promise.resolve([]),
      canViewReadiness ? db.visaReadinessReport.findMany({ where: { visaCaseId: id }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, overallScore: true, documentsReady: true, documentsTotal: true, interviewReady: true, breakdown: true, generatedAt: true, updatedAt: true } }) : Promise.resolve([]),
      canViewNotes ? db.visaOfficerNote.findMany({ where: { caseId: id, studentId: visaCase.studentId, visibility: isSuper ? undefined : { in: ['internal_only', 'visa_team_only', 'counselor_visible', 'application_team_visible'] } }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, officerId: true, officerName: true, content: true, visibility: true, commentType: true, createdAt: true } }) : Promise.resolve([]),
      canViewTasks ? db.visaTask.findMany({ where: { caseId: id, studentId: visaCase.studentId, archivedAt: null }, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] }) : Promise.resolve([]),
    ]);

    const safeReadinessReports = readinessReports.map((report) => {
      let current = false;
      let components: unknown = null;
      try {
        const stored = JSON.parse(report.breakdown || '{}');
        current = stored?.methodology === 'case-record-completion-v1';
        components = current ? stored.components : null;
      } catch { /* legacy reports are not trusted for numeric display */ }
      return { id: report.id, overallScore: current ? report.overallScore : null, documentsReady: current ? report.documentsReady : null, documentsTotal: current ? report.documentsTotal : null, interviewAssessmentRecorded: current ? report.interviewReady : null, breakdown: components, recalculationRequired: !current, generatedAt: report.generatedAt, updatedAt: report.updatedAt };
    });
    const visiblePrivateDocumentUrls = (documentIds: string[]) => canDownloadDocuments ? listPrivateVisaDocumentLinks(visaCase.studentId, id, documentIds, canViewSensitive) : Promise.resolve([]);
    const fundingReview = rawFundingReview ? {
      ...rawFundingReview,
      sponsorDocuments: await visiblePrivateDocumentUrls(listFromJson(rawFundingReview.sponsorDocuments)),
    } : null;
    const studyGapReview = rawStudyGapReview ? {
      ...rawStudyGapReview,
      ...(canViewSensitive ? {} : { medicalReason: undefined }),
      supportingDocuments: await visiblePrivateDocumentUrls(listFromJson(rawStudyGapReview.supportingDocuments)),
    } : null;
    const refusalDocumentId = privateDocumentId(rawRefusalReview?.refusalLetterUrl);
    const refusalDocument = refusalDocumentId ? await visiblePrivateDocumentUrls([refusalDocumentId]) : [];
    const refusalReview = rawRefusalReview ? { ...rawRefusalReview, refusalLetterUrl: refusalDocument[0]?.downloadUrl || '' } : null;
    const medicalDocumentId = privateDocumentId(rawSensitiveReview?.medicalDocumentUrl);
    const criminalDocumentId = privateDocumentId(rawSensitiveReview?.criminalDocumentUrl);
    const sensitiveReview = rawSensitiveReview ? {
      id: rawSensitiveReview.id,
      caseId: rawSensitiveReview.caseId,
      studentId: rawSensitiveReview.studentId,
      seriousMedicalCondition: rawSensitiveReview.seriousMedicalCondition,
      medicalExplanation: rawSensitiveReview.medicalExplanation,
      medicalDocumentDownloadUrl: medicalDocumentId ? (await visiblePrivateDocumentUrls([medicalDocumentId]))[0]?.downloadUrl || null : null,
      criminalOffense: rawSensitiveReview.criminalOffense,
      criminalExplanation: rawSensitiveReview.criminalExplanation,
      criminalDocumentDownloadUrl: criminalDocumentId ? (await visiblePrivateDocumentUrls([criminalDocumentId]))[0]?.downloadUrl || null : null,
      officerInternalNote: rawSensitiveReview.officerInternalNote,
      studentSafeNote: rawSensitiveReview.studentSafeNote,
      humanReviewRequired: rawSensitiveReview.humanReviewRequired,
      updatedAt: rawSensitiveReview.updatedAt,
    } : null;

    try {
      await db.portalAuditLog.create({ data: auditData(auth, 'VISA_CASE_VIEW', 'VisaCase', id, { studentId: visaCase.studentId, riskDetailsViewed: canViewRisk, sensitiveViewed: Boolean(sensitiveReview) }) });
      if (sensitiveReview) await db.portalAuditLog.create({ data: auditData(auth, 'VISA_SENSITIVE_VIEW', 'VisaSensitiveReview', id, { studentId: visaCase.studentId }) });
      if (canViewRisk) await db.portalAuditLog.create({ data: auditData(auth, 'VISA_RISK_DETAILS_VIEW', 'VisaCase', id, { studentId: visaCase.studentId }) });
    } catch { return NextResponse.json({ success: false, error: 'Visa case view could not be audited.' }, { status: 503 }); }

    return NextResponse.json({
      success: true,
      data: {
        ...safeStaffCase(visaCase, canViewRisk),
        interviews,
        fundingReview,
        studyGapReview,
        refusalReview,
        sensitiveReview,
        checklist,
        readinessReports: safeReadinessReports,
        notes,
        tasks,
      },
      viewScope: scope,
      access: {
        riskDetails: canViewRisk,
        riskUpdate: canManageVisaPermission(auth, 'visa.risk.update', visaCase),
        sensitiveDetails: canViewSensitive,
        sensitiveUpdate: canManageVisaPermission(auth, 'visa.sensitive.update', visaCase),
        readiness: canViewReadiness,
        readinessUpdate: canManageVisaPermission(auth, 'visa.readiness.update', visaCase),
        interviews: canViewInterviews,
        interviewCreate: canManageVisaPermission(auth, 'visa.interviews.create', visaCase),
        interviewUpdate: canManageVisaPermission(auth, 'visa.interviews.update', visaCase),
        interviewFinish: canManageVisaPermission(auth, 'visa.interviews.finish', visaCase),
        documents: canViewDocuments,
        documentsDownload: canDownloadDocuments,
        documentsRequest: canManageVisaPermission(auth, 'visa.documents.request', visaCase),
        documentsReview: canManageVisaPermission(auth, 'visa.documents.review', visaCase),
        notes: canViewNotes,
        notesCreate: canManageVisaPermission(auth, 'visa.notes.create', visaCase),
        notesInternalCreate: canManageVisaPermission(auth, 'visa.notes.internal.create', visaCase),
        superAdmin: isSuper,
        tasks: canViewTasks,
        tasksCreate: canManageVisaPermission(auth, 'visa.tasks.create', visaCase),
        tasksUpdate: canManageVisaPermission(auth, 'visa.tasks.update', visaCase),
        timeline: isSuper || hasVisaPermission(auth, 'visa.timeline.view'),
        studentFeedback: isSuper || hasVisaPermission(auth, 'visa.notes.student_feedback.create'),
      },
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa case could not be loaded or audited.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Case ID required.' }, { status: 400 });
    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Visa case not found.' }, { status: 404 });
    if (!canUpdateVisaCase(auth, existing)) return NextResponse.json({ success: false, error: 'Assigned case and visa.cases.update permission required.' }, { status: 403 });
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) return NextResponse.json({ success: false, error: 'Invalid visa case update.', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.visaCase.update({ where: { id }, data: { ...parsed.data, lastUpdated: new Date() } });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_CASE_UPDATE', 'VisaCase', id, { studentId: existing.studentId, changedFields: Object.keys(parsed.data), before: { nextAction: existing.nextAction, isUrgent: existing.isUrgent }, after: parsed.data }) });
      return result;
    });
    return NextResponse.json({ success: true, data: safeStaffCase(updated, hasVisaPermission(auth, 'visa.risk.view')) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Visa case update could not be completed; audit failure rolled back.' }, { status: 503 });
  }
});
