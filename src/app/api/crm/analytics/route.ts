import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, code: 'LEGACY_DASHBOARD_SCOPE_UNVERIFIED', error: 'User administrator required until dashboard ownership mapping is verified.' }, { status: 403 });
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || '30';

      const days = parseInt(period, 10) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        totalStudents, newStudents, totalApplications,
        newApplications, totalLeads, convertedLeads,
        openThreads, unreadMessages,
        studentsByCountry, applicationsByCountry,
        leadsBySource,
      ] = await Promise.all([
        db.portalStudentProfile.count(),
        db.portalStudentProfile.count({ where: { createdAt: { gte: since } } }),
        db.portalStudentApplication.count(),
        db.portalStudentApplication.count({ where: { createdAt: { gte: since } } }),
        db.marketingLead.count(),
        db.marketingLead.count({ where: { status: 'converted' } }),
        db.communicationThread.count({ where: { status: 'open' } }),
        db.communicationThread.count({ where: { unreadCount: { gt: 0 } } }),
        db.portalStudentProfile.groupBy({ by: ['preferredCountry'], _count: { preferredCountry: true } }),
        db.portalStudentApplication.groupBy({ by: ['country'], _count: { country: true } }),
        db.marketingLead.groupBy({ by: ['source'], _count: { source: true } }),
      ]);

      const channelDistribution = await db.communicationThread.groupBy({
        by: ['channel'],
        _count: { channel: true },
      });

      const tasksByStatus = await db.counselorTask.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

      const data = {
        kpis: {
          totalStudents, newStudents, totalApplications, newApplications,
          totalLeads, convertedLeads, conversionRate,
          openThreads, unreadMessages,
        },
        distributions: {
          studentsByCountry: studentsByCountry.map(g => ({ country: g.preferredCountry, count: g._count.preferredCountry })).filter(g => g.country),
          applicationsByCountry: applicationsByCountry.map(g => ({ country: g.country, count: g._count.country })).filter(g => g.country),
          leadsBySource: leadsBySource.map(g => ({ source: g.source, count: g._count.source })).filter(g => g.source),
          channelDistribution: channelDistribution.map(g => ({ channel: g.channel, count: g._count.channel })),
          tasksByStatus: tasksByStatus.map(g => ({ status: g.status, count: g._count.status })),
        },
        period: { days },
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Analytics API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: { kpis: {}, distributions: {} } });
      }
      return NextResponse.json({ success: false, error: 'Failed to load analytics' }, { status: 500 });
    }
  })(request);
}
