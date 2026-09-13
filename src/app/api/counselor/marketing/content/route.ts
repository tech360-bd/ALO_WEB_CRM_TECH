import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const content = await db.marketingGeneratedContent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { topic, platform, language, tone } = body;
    const generated = await db.marketingGeneratedContent.create({
      data: {
        contentType: 'social_post',
        topic: topic || '',
        platform: platform || 'facebook',
        language: language || 'english',
        tone: tone || 'professional',
        title: topic || '',
        body: `Generated content for ${topic} - ${platform}`,
        status: 'draft',
        createdById: auth.userId,
      },
    });
    return NextResponse.json({ success: true, data: generated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
