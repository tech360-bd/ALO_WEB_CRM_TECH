import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { calculateKPIs } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth) => {
  const [applications, b2bApplications, documents, deadlines, tasks, b2bProviders] = await Promise.all([
    db.application.findMany({ take: 1000, orderBy: { createdAt: 'desc' } }),
    db.b2bApplication.findMany({ include: { b2bProvider: true } }),
    db.applicationDocument.findMany({ take: 200 }),
    db.applicationDeadline.findMany({ where: { status: { not: 'COMPLETED' } } }),
    db.applicationTask.findMany({ where: { status: 'PENDING' } }),
    db.b2bProvider.findMany(),
  ]);

  const kpis = calculateKPIs(applications, b2bApplications, documents, deadlines, tasks);

  // Additional metrics for 17 KPI cards
  const metrics = {
    ...kpis,
    total: applications.length,
    active: applications.filter((a: any) => a.status === 'active').length,
    submitted: kpis.submitted,
    decisionPending: kpis.decisionPending,
    conditionalOffers: kpis.conditionalOffers,
    unconditionalOffers: kpis.unconditionalOffers,
    confidentialB2bCases: kpis.b2b,
    casPending: kpis.casPending,
    b2bProviders: b2bProviders.length,
  };

  return NextResponse.json({ success: true, data: metrics, metrics, kpis: metrics });
});
