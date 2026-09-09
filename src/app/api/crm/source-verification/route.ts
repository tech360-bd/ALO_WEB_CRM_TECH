import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(
  async () => {
    const [sources, recentEvents, stagingCounts, officialSourceChecks, officialSourceCounts] = await Promise.all([
      db.crmDiscoverySource.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          _count: { select: { records: true } },
        },
      }),
      db.crmSourceVerificationEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.crmDiscoveryRecord.groupBy({
        by: ['verificationStatus', 'pipelineStatus'],
        _count: { _all: true },
      }),
      db.crmOfficialSourceCheck.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 100,
      }),
      db.crmOfficialSourceCheck.groupBy({
        by: ['sourceType', 'verificationStatus'],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dataStatus: 'QUARANTINED / NOT PUBLISHED',
      sources,
      recentEvents,
      stagingCounts,
      officialSourceChecks,
      officialSourceCounts,
    });
  },
  { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] }
);

export const POST = withAuth(
  async (request, auth) => {
    const body = await request.json();
    const { name, baseUrl, robotsUrl, allowedUse = 'discovery_only', notes = '' } = body;

    if (!name || !baseUrl) {
      return NextResponse.json(
        { success: false, error: 'name and baseUrl are required.' },
        { status: 400 }
      );
    }

    const source = await db.crmDiscoverySource.upsert({
      where: { name },
      update: {
        baseUrl,
        robotsUrl: robotsUrl || '',
        allowedUse,
        notes,
        termsStatus: allowedUse.includes('manual') ? 'manual_review_required' : 'not_reviewed',
        lastCheckedAt: new Date().toISOString(),
      },
      create: {
        name,
        baseUrl,
        robotsUrl: robotsUrl || '',
        allowedUse,
        notes,
        termsStatus: allowedUse.includes('manual') ? 'manual_review_required' : 'not_reviewed',
        lastCheckedAt: new Date().toISOString(),
      },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'source_verification.source_upsert',
        targetCollection: 'CrmDiscoverySource',
        targetId: source.id,
        afterData: JSON.stringify({ name, baseUrl, robotsUrl, allowedUse }),
      },
    });

    return NextResponse.json({ success: true, source });
  },
  { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] }
);
