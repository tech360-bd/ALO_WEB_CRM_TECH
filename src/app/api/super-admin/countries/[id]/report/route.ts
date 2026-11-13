// GET /api/super-admin/countries/{id}/report
//
// Country report across leads, applications, visa cases, refusal signals,
// counselor/application-team workload and deadlines. Anything not derivable is
// reported in `unavailableMetrics` with the reason.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const country = await db.country.findUnique({ where: { id } });
    if (!country) return notFound('Country not found.');

    const labels = [country.name, country.code].filter(Boolean);

    const [leads, applications, visaCases, universities, courses, scholarships] = await Promise.all([
      db.lead.groupBy({ by: ['status'], where: { preferredCountry: { in: labels } }, _count: { _all: true } }).catch(() => []),
      db.application.groupBy({ by: ['stage'], where: { country: { in: labels } }, _count: { _all: true } }).catch(() => []),
      db.visaCase.findMany({
        where: { destinationCountry: { in: labels } },
        select: {
          currentStage: true, riskLevel: true, readinessScore: true, visaOfficerId: true,
          counselorId: true, applicationOfficerId: true, deadline: true, missing: true,
        },
      }).catch(() => []),
      db.crmUniversity.count({ where: { country: { in: labels } } }).catch(() => null),
      db.crmCourse.count({ where: { country: { in: labels } } }).catch(() => null),
      db.crmScholarship.count().catch(() => null),
    ]);

    const leadsByStatus: Record<string, number> = {};
    for (const row of leads) leadsByStatus[row.status || 'UNKNOWN'] = row._count._all;
    const applicationsByStage: Record<string, number> = {};
    for (const row of applications) applicationsByStage[row.stage || 'UNKNOWN'] = row._count._all;

    const assessed = visaCases.filter((row) => row.readinessScore > 0);
    const avgReadiness = assessed.length
      ? Math.round((assessed.reduce((sum, row) => sum + row.readinessScore, 0) / assessed.length) * 10) / 10
      : null;

    const riskBuckets: Record<string, number> = {};
    for (const row of visaCases) {
      const key = (row.riskLevel || 'unknown').toLowerCase();
      riskBuckets[key] = (riskBuckets[key] || 0) + 1;
    }

    const workload = {
      visaOfficers: new Set(visaCases.map((row) => row.visaOfficerId).filter(Boolean)).size,
      counselors: new Set(visaCases.map((row) => row.counselorId).filter(Boolean)).size,
      applicationOfficers: new Set(visaCases.map((row) => row.applicationOfficerId).filter(Boolean)).size,
    };

    const upcomingDeadlines = visaCases
      .filter((row) => row.deadline && row.deadline.getTime() > Date.now())
      .sort((a, b) => (a.deadline!.getTime() - b.deadline!.getTime()))
      .slice(0, 10)
      .map((row) => ({ deadline: row.deadline!.toISOString(), stage: row.currentStage, risk: row.riskLevel }));

    await logAuditAction(auth, 'COUNTRY_REPORT_VIEWED', 'Country', id, { countryCode: country.code });

    return NextResponse.json({
      success: true,
      country: { id: country.id, code: country.code, name: country.name, slug: country.slug, status: country.status },
      report: {
        leadsByStatus,
        totalLeads: Object.values(leadsByStatus).reduce((sum, value) => sum + value, 0),
        applicationsByStage,
        totalApplications: Object.values(applicationsByStage).reduce((sum, value) => sum + value, 0),
        visaCases: visaCases.length,
        visaReadinessAvg: avgReadiness,
        visaRiskBuckets: riskBuckets,
        universitiesMissingData: country.universityCount === 0,
        universities,
        courses,
        scholarships,
        workload,
        upcomingDeadlines,
        lastVerifiedAt: country.lastVerifiedAt?.toISOString() || null,
      },
      unavailableMetrics: [
        { metric: 'refusalSummary', reason: 'Visa refusals are recorded per case; a country-level refusal rate needs a decision column on visa cases and is not derivable today.' },
        { metric: 'conversionRate', reason: 'Lead→student conversion per country needs a stable country key on students; students store free-text currentCountry.' },
        { metric: 'marketingPerformance', reason: 'Campaigns are not country-scoped.' },
        { metric: 'scholarshipsByCountry', reason: 'Scholarship rows are not consistently country-keyed; only an organisation-wide count is returned.' },
      ],
    });
  } catch (error) {
    return unavailable('super-admin/countries/{id}/report', error);
  }
}

export const GET = withAuth(handleGet);
