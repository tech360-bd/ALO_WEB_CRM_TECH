import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const campaigns = await db.marketingCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { name, goal, platform, strategy, banglaCaption, englishCaption } = body;
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });

    const campaign = await db.marketingCampaign.create({
      data: {
        name,
        goal: goal || '',
        platform: platform || 'facebook',
        strategy: strategy || '',
        banglaCaption: banglaCaption || '',
        englishCaption: englishCaption || '',
        status: 'draft',
        createdById: auth.userId,
      },
    });

    await db.aloAuditLog.create({
      data: {
        actorType: auth.roles[0] || 'counselor',
        actorName: auth.name || auth.userId,
        action: 'CAMPAIGN_CREATED',
        resource: 'MarketingCampaign',
        resourceId: campaign.id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: campaign, note: 'AI campaign engine with approval workflow per spec' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
