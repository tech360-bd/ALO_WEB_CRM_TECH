import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET — List SMS campaigns                                            */
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
          type: 'SMS',
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.campaign.count({
        where: {
          ...where,
          type: 'SMS',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SMS campaigns' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create an SMS campaign                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, templateId, recipientList, scheduledAt, message } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required (at least 2 characters).' },
        { status: 400 },
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name: name.trim(),
        type: 'SMS',
        channel: 'SMS',
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        budget: 0,
        startDate: scheduledAt ? new Date(scheduledAt) : new Date(),
        endDate: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SMS campaign created',
      campaign,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create SMS campaign' },
      { status: 500 },
    );
  }
}
