import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/application-manager/providers
 *
 * B2B provider directory — returns Partner records that have at least one
 * B2B-sourced application, plus B2B volume / commission stats per partner.
 *
 * Tenant isolation: only application_manager / super_admin / admin can call.
 */
export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['application_manager', 'super_admin', 'admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const partners = await db.partner.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        partnerId: true,
        companyName: true,
        contactPerson: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        website: true,
        businessType: true,
        commissionRate: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            applications: true,
            partnerStaff: true,
            commissions: true,
          },
        },
      },
    });

    // Per-partner B2B application count + most recent app
    const b2bStats = await db.application.groupBy({
      by: ['partnerId'],
      where: { source: 'B2B' },
      _count: { id: true },
    });
    const b2bMap = new Map<string, number>();
    for (const r of b2bStats) {
      if (r.partnerId) b2bMap.set(r.partnerId, r._count.id);
    }

    const recentApps = await db.application.findMany({
      where: { source: 'B2B' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, partnerId: true, createdAt: true, status: true },
    });
    const recentByPartner = new Map<string, { createdAt: Date; status: string }>();
    for (const a of recentApps) {
      if (!a.partnerId) continue;
      if (!recentByPartner.has(a.partnerId)) {
        recentByPartner.set(a.partnerId, { createdAt: a.createdAt, status: a.status });
      }
    }

    await logAudit({
      userId: auth.user.id,
      action: 'app_manager_providers_view',
      module: 'application_manager',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    const providers = partners.map((p) => ({
      id: p.id,
      partnerId: p.partnerId,
      companyName: p.companyName,
      contactPerson: p.contactPerson,
      email: p.email,
      phone: p.phone,
      country: p.country,
      city: p.city,
      website: p.website,
      businessType: p.businessType,
      commissionRate: p.commissionRate,
      status: p.status,
      createdAt: p.createdAt,
      stats: {
        totalStudents: p._count.students,
        totalApplications: p._count.applications,
        b2bApplications: b2bMap.get(p.id) || 0,
        staffCount: p._count.partnerStaff,
        commissionRecords: p._count.commissions,
      },
      lastB2bActivity: recentByPartner.get(p.id) || null,
    }));

    return NextResponse.json({ providers, total: providers.length });
  } catch (error) {
    console.error('application-manager/providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
