import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const posts = await db.marketingCalendar.findMany({ orderBy: { scheduledAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { title, platform, scheduledAt, campaignId } = body;
    if (!title || !scheduledAt) return NextResponse.json({ success: false, error: 'title and scheduledAt required' }, { status: 400 });

    const post = await db.marketingCalendar.create({
      data: {
        title,
        platform: platform || 'facebook',
        campaignId: campaignId || '',
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        createdById: auth.userId,
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
