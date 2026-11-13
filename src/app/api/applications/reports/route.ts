import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

const querySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  source: z.string().trim().max(191).optional(),
  country: z.string().trim().max(191).optional(),
});

export const GET = withAuth(async (req, auth) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canViewReports = roles.some((role) => ['super_admin', 'application_manager', 'admin'].includes(role)) ||
    auth.permissions.includes('application.view_reports') || auth.permissions.includes('application.view');
  if (!canViewReports) return NextResponse.json({ success: false, error: 'Forbidden: view_reports permission required.' }, { status: 403 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid report filters.', details: parsed.error.flatten() }, { status: 400 });
  const { from, to, source, country } = parsed.data;
  if (from && to && new Date(from) > new Date(to)) return NextResponse.json({ success: false, error: 'from must not be later than to.' }, { status: 400 });
  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  if (source?.toUpperCase().startsWith('B2B_') && !canViewB2BFlag) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B reporting requires application.view_b2b permission.' }, { status: 403 });
  }

  const where: Record<string, any> = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (source) where.applicationSource = source;
  if (country) where.country = country;
  if (!canViewB2BFlag) Object.assign(where, {
    isB2b: false,
    isB2bConfidential: false,
    applicationSource: source ? source : { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
    stage: { notIn: ['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED'] },
    b2bApplications: { none: {} },
  });

  try {
    const applications = await db.application.findMany({ where, take: 1000, orderBy: { createdAt: 'desc' } });
    const applicationIds = applications.map((application) => application.id);
    const [b2bApplications, b2bProviders, documents, offers] = await Promise.all([
      canViewB2BFlag ? db.b2bApplication.findMany({ where: { applicationId: { in: applicationIds } } }) : Promise.resolve([]),
      canViewB2BFlag ? db.b2bProvider.findMany({ select: { id: true } }) : Promise.resolve([]),
      applicationIds.length ? db.applicationDocument.findMany({ where: { applicationId: { in: applicationIds } }, take: 1000 }) : Promise.resolve([]),
      applicationIds.length ? db.applicationOffer.findMany({ where: { applicationId: { in: applicationIds } }, take: 1000 }) : Promise.resolve([]),
    ]);

    const total = applications.length;
    const bySource = applications.reduce((acc: Record<string, number>, application: any) => {
      const key = String(application.applicationSource || 'UNKNOWN').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const directVsPartner: Record<string, number> = {
      direct: applications.filter((application: any) => ['DIRECT_ALO_APPLICATION', 'STUDENT_SELF_APPLICATION'].includes(application.applicationSource)).length,
      partner: applications.filter((application: any) => application.applicationSource === 'PARTNER_APPLICATION').length,
    };
    if (canViewB2BFlag) {
      directVsPartner.b2b = b2bApplications.length;
      directVsPartner.inbound = b2bApplications.filter((record: any) => ['B2B_INBOUND', 'INBOUND'].includes(record.b2bType)).length;
      directVsPartner.outbound = b2bApplications.filter((record: any) => ['B2B_OUTBOUND', 'OUTBOUND'].includes(record.b2bType)).length;
    }
    const byCountry = applications.reduce((acc: Record<string, number>, application: any) => { const key = application.country || 'Unknown'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const byCourse = applications.reduce((acc: Record<string, number>, application: any) => { const key = application.courseName || 'Unknown'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const byCounselor = applications.reduce((acc: Record<string, number>, application: any) => { const key = application.counselorId || 'Unassigned'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const byOfficer = applications.reduce((acc: Record<string, number>, application: any) => { const key = application.appTeamOfficerId || application.applicationOfficer || 'Unassigned'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    const byDocumentStatus = documents.reduce((acc: Record<string, number>, document: any) => { acc[document.status] = (acc[document.status] || 0) + 1; return acc; }, {});
    const byOfferStatus = offers.reduce((acc: Record<string, number>, offer: any) => { acc[offer.status] = (acc[offer.status] || 0) + 1; return acc; }, {});
    const byStage = applications.reduce((acc: Record<string, number>, application: any) => {
      const key = canViewB2BFlag ? String(application.stage || 'UNKNOWN').toUpperCase() : String(application.safeStatus || 'UNDER_REVIEW').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const report = {
      total,
      bySource,
      directVsPartner,
      byCountry,
      byCourse,
      byCounselor,
      byOfficer,
      byDocumentStatus,
      byOfferStatus,
      byStage,
      b2b: canViewB2BFlag ? {
        total: b2bApplications.length,
        byType: b2bApplications.reduce((acc: Record<string, number>, record: any) => { acc[record.b2bType] = (acc[record.b2bType] || 0) + 1; return acc; }, {}),
        byStatus: b2bApplications.reduce((acc: Record<string, number>, record: any) => { acc[record.b2bStatus] = (acc[record.b2bStatus] || 0) + 1; return acc; }, {}),
        providers: b2bProviders.length,
      } : { restricted: true },
      generatedAt: new Date().toISOString(),
      canViewB2B: canViewB2BFlag,
    };
    return NextResponse.json({ success: true, data: report, report });
  } catch (error) {
    console.error('[application-reports.get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Application report data is unavailable.' }, { status: 503 });
  }
});
