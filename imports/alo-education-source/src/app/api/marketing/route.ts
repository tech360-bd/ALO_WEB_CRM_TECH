import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, MARKETING_MANAGER, MARKETING
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'MARKETING'];

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(_req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied. Requires SUPER_ADMIN, ADMIN, MARKETING_MANAGER, or MARKETING role.' },
      { status: 403 },
    );
  }

  try {
    const [
      totalLeads,
      convertedLeads,
      leadsBySource,
      leadsByCountry,
      recentLeads,
    ] = await Promise.all([
      // Total leads
      db.lead.count(),

      // Converted leads (status is CONVERTED or ENROLLED)
      db.lead.count({
        where: { status: { in: ['CONVERTED', 'ENROLLED'] } },
      }),

      // Leads by source
      db.lead.groupBy({
        by: ['source'],
        _count: true,
      }),

      // Leads by preferred country
      db.lead.groupBy({
        by: ['preferredCountry'],
        where: { preferredCountry: { not: null } },
        _count: true,
      }),

      // Recent leads (last 10)
      db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          leadId: true,
          fullName: true,
          email: true,
          phone: true,
          source: true,
          preferredCountry: true,
          preferredCourse: true,
          status: true,
          aiScore: true,
          leadScore: true,
          createdAt: true,
        },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 100) / 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        convertedLeads,
        conversionRate,
        leadsBySource: leadsBySource.map((l) => ({ source: l.source, count: l._count })),
        leadsByCountry: leadsByCountry.map((l) => ({ country: l.preferredCountry, count: l._count })),
        recentLeads,
      },
    });
  } catch (error) {
    console.error('Error fetching marketing dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketing dashboard data.' },
      { status: 500 },
    );
  }
}
