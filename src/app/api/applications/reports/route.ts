import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canViewReports = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('admin') || auth.permissions.includes('application.view_reports') || auth.permissions.includes('application.view');
  if (!canViewReports) return NextResponse.json({ success: false, error: 'Forbidden: view_reports permission required' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const source = searchParams.get('source');
  const country = searchParams.get('country');

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (source) where.applicationSource = source;
  if (country) where.country = country;

  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);

  const [applications, b2bApplications, b2bProviders, documents, offers] = await Promise.all([
    db.application.findMany({ where, take: 1000, orderBy: { createdAt: 'desc' } }),
    canViewB2BFlag ? db.b2bApplication.findMany({ include: { b2bProvider: true } }) : Promise.resolve([]),
    canViewB2BFlag ? db.b2bProvider.findMany() : Promise.resolve([]),
    db.applicationDocument.findMany({ where: { applicationId: { in: (await db.application.findMany({ where, select: { id: true }, take: 1000 })).map((a: any) => a.id) } }, take: 500 }),
    db.applicationOffer.findMany({ take: 500 }),
  ]);

  // Build reports
  const total = applications.length;
  const bySource = applications.reduce((acc: any, app: any) => { acc[app.applicationSource] = (acc[app.applicationSource] || 0) + 1; return acc; }, {});
  const directVsPartnerVsB2B = {
    direct: applications.filter((a: any) => ['DIRECT_ALO_APPLICATION', 'STUDENT_SELF_APPLICATION'].includes(a.applicationSource)).length,
    partner: applications.filter((a: any) => a.applicationSource === 'PARTNER_APPLICATION').length,
    b2b: b2bApplications.length,
    inbound: b2bApplications.filter((b: any) => b.b2bType === 'B2B_INBOUND').length,
    outbound: b2bApplications.filter((b: any) => b.b2bType === 'B2B_OUTBOUND').length,
  };
  const byCountry = applications.reduce((acc: any, app: any) => { acc[app.country || 'Unknown'] = (acc[app.country || 'Unknown'] || 0) + 1; return acc; }, {});
  const byCourse = applications.reduce((acc: any, app: any) => { acc[app.courseName || 'Unknown'] = (acc[app.courseName || 'Unknown'] || 0) + 1; return acc; }, {});
  const byCounselor = applications.reduce((acc: any, app: any) => { acc[app.counselorId || 'Unassigned'] = (acc[app.counselorId || 'Unassigned'] || 0) + 1; return acc; }, {});
  const byOfficer = applications.reduce((acc: any, app: any) => { acc[app.appTeamOfficerId || app.applicationOfficer || 'Unassigned'] = (acc[app.appTeamOfficerId || app.applicationOfficer || 'Unassigned'] || 0) + 1; return acc; }, {});
  const byDocumentStatus = documents.reduce((acc: any, doc: any) => { acc[doc.status] = (acc[doc.status] || 0) + 1; return acc; }, {});
  const byOfferStatus = applications.reduce((acc: any, app: any) => { acc[app.offerStatus || 'PENDING'] = (acc[app.offerStatus || 'PENDING'] || 0) + 1; return acc; }, {});
  const byStage = applications.reduce((acc: any, app: any) => { acc[app.stage] = (acc[app.stage] || 0) + 1; return acc; }, {});

  const report = {
    total,
    bySource,
    directVsPartnerVsB2B,
    byCountry,
    byCourse,
    byCounselor,
    byOfficer,
    byDocumentStatus,
    byOfferStatus,
    byStage,
    b2b: canViewB2BFlag ? {
      total: b2bApplications.length,
      byType: b2bApplications.reduce((acc: any, b: any) => { acc[b.b2bType] = (acc[b.b2bType] || 0) + 1; return acc; }, {}),
      byProvider: b2bApplications.reduce((acc: any, b: any) => { acc[b.b2bProviderId] = (acc[b.b2bProviderId] || 0) + 1; return acc; }, {}),
      byStatus: b2bApplications.reduce((acc: any, b: any) => { acc[b.b2bStatus] = (acc[b.b2bStatus] || 0) + 1; return acc; }, {}),
      providers: b2bProviders.length,
    } : { restricted: true, message: 'B2B data restricted — requires application.view_b2b permission' },
    generatedAt: new Date().toISOString(),
    canViewB2B: canViewB2BFlag,
  };

  return NextResponse.json({ success: true, data: report, report });
});
