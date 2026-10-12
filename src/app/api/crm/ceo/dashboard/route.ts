import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
    if (!canReadLegacyLeadDashboard(auth) && !(auth.identityDomain === 'user' && auth.userType.toUpperCase() === 'CEO')) return NextResponse.json({ success: false, code: 'LEGACY_DASHBOARD_SCOPE_UNVERIFIED', error: 'User administrator required until dashboard ownership mapping is verified.' }, { status: 403 });
  try {
    const [applications, leads, students, highRiskCases] = await Promise.all([
      db.portalStudentApplication.count(), db.marketingLead.count(), db.portalStudentProfile.count(),
      db.visaCase.findMany({
        where: { riskLevel: 'HIGH' }, take: 5,
        select: { studentId: true, destinationCountry: true, nextAction: true },
      }),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        // No approved aggregation exists for these metrics. An empty dataset is
        // accompanied by explicit unavailable metadata, never interpreted as zero.
        branchPerformance: [], topCounselors: [], marketingRoi: [],
        unavailableMetrics: [
          'Revenue and settlement reconciliation', 'Conversion and period-over-period growth',
          'Branch performance', 'Counselor rankings', 'Marketing ROI',
        ],
        highRiskCases: highRiskCases.map(r => ({ student: r.studentId, country: r.destinationCountry || '—', issue: r.nextAction || 'High risk', severity: 'high' })),
        kpis: [
          { label: 'Application records', value: String(applications), icon: 'GraduationCap', sub: 'All recorded statuses', change: null, up: null },
          { label: 'Lead records', value: String(leads), icon: 'TrendingUp', sub: 'MarketingLead records', change: null, up: null },
          { label: 'Student profiles', value: String(students), icon: 'Users', sub: 'Portal profiles, not enrollment count', change: null, up: null },
        ],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Executive dashboard data could not be loaded' }, { status: 500 });
  }
}, { requireRoles: ['CEO', 'ceo', 'ADMIN', 'SUPER_ADMIN'] });
