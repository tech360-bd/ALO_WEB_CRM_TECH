import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, hasVisaPermission, isVisaSuperAdmin, safeVisaCaseStage, safeVisaCaseSummary, visaCaseListScope } from '@/lib/visa/access';

const createCaseSchema = z.object({ applicationId: z.string().trim().min(1).max(191) }).strict();

function auditData(auth: AuthContext, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  return {
    actorUserId: auth.actorUserId,
    action,
    entityType,
    entityId,
    metadata: JSON.stringify(metadata),
    ipAddress: '',
    userAgent: '',
  };
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const scope = visaCaseListScope(auth);
    if (!scope) return NextResponse.json({ success: false, error: 'Visa case view permission required.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, Number.parseInt(searchParams.get('limit') || '50', 10) || 50));
    const where: any = { ...scope.where };
    const destinationCountry = searchParams.get('destinationCountry') || searchParams.get('country');
    const studentId = searchParams.get('studentId');
    const studentName = searchParams.get('studentName');
    const riskLevel = searchParams.get('riskLevel');
    const stage = searchParams.get('currentStage') || searchParams.get('stage');
    const counselorId = searchParams.get('counselorId');
    const applicationOfficerId = searchParams.get('applicationOfficerId');
    const from = searchParams.get('dateFrom');
    const to = searchParams.get('dateTo');

    if (destinationCountry) where.destinationCountry = destinationCountry;
    if (studentId) where.studentId = studentId;
    if (studentName) where.studentName = { contains: studentName.trim().slice(0, 120) };
    if (riskLevel) {
      if (scope.viewScope !== 'full' || (!isVisaSuperAdmin(auth) && !hasVisaPermission(auth, 'visa.risk.view'))) {
        return NextResponse.json({ success: false, error: 'Risk filtering requires visa.risk.view permission.' }, { status: 403 });
      }
      where.riskLevel = riskLevel.toLowerCase();
    }
    if (stage) where.currentStage = stage;
    if (counselorId && scope.viewScope === 'full') where.counselorId = counselorId;
    if (applicationOfficerId && scope.viewScope === 'full') where.applicationOfficerId = applicationOfficerId;
    if (from || to) {
      where.updatedAt = {};
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
        return NextResponse.json({ success: false, error: 'Invalid date range.' }, { status: 400 });
      }
      if (fromDate) where.updatedAt.gte = fromDate;
      if (toDate) where.updatedAt.lte = toDate;
    }

    const [cases, total] = await Promise.all([
      db.visaCase.findMany({ where, select: { id: true, caseCode: true, studentId: true, studentName: true, applicationId: true, destinationCountry: true, university: true, course: true, intake: true, currentStage: true, riskLevel: true, isUrgent: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
      db.visaCase.count({ where }),
    ]);
    const canViewRisk = isVisaSuperAdmin(auth) || hasVisaPermission(auth, 'visa.risk.view');
    const safeCases = scope.viewScope === 'summary'
      ? cases.map(safeVisaCaseSummary)
      : scope.viewScope === 'stage'
        ? cases.map(safeVisaCaseStage)
        : cases.map(({ riskLevel: _riskLevel, ...item }) => ({ ...item, ...(canViewRisk ? { riskLevel: _riskLevel } : {}) }));

    try {
      await db.portalAuditLog.create({
        data: auditData(auth, 'VISA_CASES_LIST', 'VisaCase', 'list', { count: cases.length, total, page, filters: { destinationCountry, studentId, stage, riskLevel: scope.viewScope === 'full' ? riskLevel : undefined }, viewScope: scope.viewScope }),
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Visa case list view could not be audited.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      count: safeCases.length,
      total,
      cases: safeCases,
      data: safeCases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      emptyState: cases.length === 0 ? 'No visa cases in the authorized scope.' : null,
      viewScope: scope.viewScope,
    }, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie, Authorization' } });
  } catch (error) {
    console.error('[visa-cases] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to fetch visa cases.' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    if (!canManageVisaPermission(auth, 'visa.cases.create')) {
      return NextResponse.json({ success: false, error: 'visa.cases.create permission required.' }, { status: 403 });
    }
    const parsed = createCaseSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Provide an existing applicationId.', details: parsed.error.flatten() }, { status: 400 });

    const application = await db.application.findUnique({ where: { id: parsed.data.applicationId } });
    if (!application) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    if (application.isB2bConfidential && !hasVisaPermission(auth, 'application.view_b2b', 'visa.cases.view_b2b')) {
      return NextResponse.json({ success: false, error: 'B2B-confidential applications require explicit permission.' }, { status: 403 });
    }
    const existing = await db.visaCase.findFirst({ where: { applicationId: application.id } });
    if (existing) return NextResponse.json({ success: false, error: 'A visa case already exists for this application.', caseId: existing.id }, { status: 409 });

    const student = await db.student.findUnique({ where: { id: application.studentId }, select: { name: true } });
    const result = await db.$transaction(async (tx) => {
      const created = await tx.visaCase.create({
        data: {
          applicationId: application.id,
          studentId: application.studentId,
          studentName: student?.name || '',
          destinationCountry: application.country || '',
          university: application.universityName || '',
          course: application.courseName || '',
          intake: application.intake || '',
          counselorId: application.counselorId || '',
          counselorName: application.counselorName || '',
          applicationOfficerId: application.appTeamOfficerId || application.applicationOfficer || '',
          visaOfficerId: hasVisaPermission(auth, 'visa.cases.assigned.view') ? auth.userId : '',
          visaOfficerName: hasVisaPermission(auth, 'visa.cases.assigned.view') ? auth.name : '',
          currentStage: 'not_started',
          riskLevel: 'human_review_required',
          readinessScore: 0,
          nextAction: 'Create and review the visa checklist.',
        },
      });
      const updated = await tx.visaCase.update({ where: { id: created.id }, data: { caseCode: `VISA-${created.id.slice(-10).toUpperCase()}` } });
      await tx.portalAuditLog.create({ data: auditData(auth, 'VISA_CASE_CREATE', 'VisaCase', updated.id, { applicationId: application.id, studentId: application.studentId }) });
      await tx.timelineEvent.create({
        data: { studentId: application.studentId, stage: 'VISA_CASE_CREATED', title: 'Visa preparation case created.', description: `Created from application ${application.id}; internal preparation workflow only.`, actor: auth.actorUserId },
      });
      return updated;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-cases] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create the visa case.' }, { status: 500 });
  }
});
