import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { calculateKPIs } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth) => {
  const [applications, b2bApplications, documents, deadlines, tasks] = await Promise.all([
    db.application.findMany({ take: 500, orderBy: { updatedAt: 'desc' } }),
    db.b2bApplication.findMany({ take: 200 }),
    db.applicationDocument.findMany({ take: 100 }),
    db.applicationDeadline.findMany({ where: { status: { not: 'COMPLETED' } }, take: 100 }),
    db.applicationTask.findMany({ where: { status: 'PENDING' }, take: 100 }),
  ]);

  const kpis = calculateKPIs(applications, b2bApplications, documents, deadlines, tasks);

  return NextResponse.json({
    success: true,
    data: kpis,
    metrics: kpis,
    kpis,
    total: applications.length,
    active: applications.filter((a: any) => a.status === 'active').length,
  });
});
