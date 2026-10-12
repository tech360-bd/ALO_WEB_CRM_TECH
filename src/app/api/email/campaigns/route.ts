import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET — List email campaigns                                          */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const where: any = {};
  if (status) where.status = status;

  try {
    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where: {
          ...where,
          type: 'EMAIL',
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.campaign.count({
        where: {
          ...where,
          type: 'EMAIL',
        },
      }),
    ]);

    // Compute aggregate stats from completed email campaigns
    const completedCampaigns = campaigns.filter((c: any) => c.status === 'COMPLETED');
    const avgOpenRate = completedCampaigns.length > 0
      ? completedCampaigns.reduce((a: number, c: any) => a + (c.openRate || 0), 0) / completedCampaigns.length
      : 0;
    const avgClickRate = completedCampaigns.length > 0
      ? completedCampaigns.reduce((a: number, c: any) => a + (c.clickRate || 0), 0) / completedCampaigns.length
      : 0;

    return NextResponse.json({
      success: true,
      campaigns,
      stats: {
        avgOpenRate: avgOpenRate.toFixed(1),
        avgClickRate: avgClickRate.toFixed(1),
        totalCampaigns: total,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch email campaigns' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create an email campaign                                     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, subject, templateId, subscriberListId, scheduledAt, fromEmail, fromName } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required.' },
        { status: 400 },
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Email subject is required.' },
        { status: 400 },
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name: name.trim(),
        type: 'EMAIL',
        channel: 'EMAIL',
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        budget: 0,
        startDate: scheduledAt ? new Date(scheduledAt) : new Date(),
        endDate: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email campaign created',
      campaign,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create email campaign' },
      { status: 500 },
    );
  }
}
