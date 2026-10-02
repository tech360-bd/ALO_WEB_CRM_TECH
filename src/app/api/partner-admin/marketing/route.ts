import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const partnerId = auth.partnerId;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });

    const [quota, usage, requests] = await Promise.all([
      db.partnerMarketingQuota.findUnique({ where: { partnerId } }),
      db.partnerMarketingUsage.findFirst({ where: { partnerId }, orderBy: { createdAt: 'desc' } }),
      db.partnerMarketingRequest.findMany({ where: { partnerId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const imageLimit = quota?.monthlyImageLimit || 15;
    const videoLimit = quota?.monthlyVideoLimit || 10;
    const imagesUsed = usage?.imagesUsed || 0;
    const videosUsed = usage?.videosUsed || 0;

    return NextResponse.json({
      success: true,
      quota: {
        monthlyImageLimit: imageLimit,
        imagesUsed,
        imagesRemaining: Math.max(0, imageLimit - imagesUsed),
        monthlyVideoLimit: videoLimit,
        videosUsed,
        videosRemaining: Math.max(0, videoLimit - videosUsed),
        videoDurationLimitSeconds: 30,
      },
      requests,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch marketing studio data', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as any;

    const body = await req.json();
    const { idea, countryId, universityId, courseId, intake, platform, language, assetType } = body;

    const partnerId = auth.partnerId;
    if (!partnerId) return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });

    let usage = await db.partnerMarketingUsage.findFirst({ where: { partnerId }, orderBy: { createdAt: 'desc' } });
    if (!usage) {
      usage = await db.partnerMarketingUsage.create({
        data: { partnerId, monthYear: '2026-08', imagesUsed: 0, videosUsed: 0 },
      });
    }

    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId } });
    const imageLimit = quota?.monthlyImageLimit || 15;
    const videoLimit = quota?.monthlyVideoLimit || 10;

    if (assetType === 'image' && usage.imagesUsed >= imageLimit) {
      return NextResponse.json({ error: 'Monthly image quota finished. Request extra quota from ALO Education.' }, { status: 403 });
    }

    if (assetType === 'video' && usage.videosUsed >= videoLimit) {
      return NextResponse.json({ error: 'Monthly video quota finished. Request extra quota from ALO Education.' }, { status: 403 });
    }

    const targetCountry = countryId || 'United Kingdom';
    const targetUniv = universityId || 'University of Manchester';

    const caption = `🎓 Study in the ${targetCountry} — September 2026 Intake open at ${targetUniv}! Full scholarship guidance & visa support available for Bangladeshi students. Apply now with ALO Education!`;
    const hashtags = `#StudyIn${targetCountry.replace(/\s+/g, '')} #StudyAbroad #ALOEducation #${targetUniv.replace(/\s+/g, '')} #HigherEducation`;
    const imagePrompt = `Professional study abroad promotional banner for ${targetUniv}, ${targetCountry}, featuring happy international student, ALO Education logo, brand colors primary orange #F97316 and professional blue accent #0B5ED7.`;
    const videoScript = `[0-5s]: Are you dreaming of studying at ${targetUniv} in the ${targetCountry}? [5-15s]: Applications are now open for September 2026 intake. Get up to £5,000 scholarship guidance and 100% free counseling! [15-30s]: Apply today through ALO Education partner network. Link in bio!`;

    const mReq = await db.partnerMarketingRequest.create({
      data: {
        partnerId,
        requestedBy: auth.email || auth.userId,
        idea: idea || `Study in ${targetCountry} Campaign`,
        countryId: targetCountry,
        universityId: targetUniv,
        courseId: courseId || 'MSc Data Science',
        intake: intake || 'Sep 2026',
        platform: platform || 'facebook',
        language: language || 'english',
        caption,
        hashtags,
        imagePrompt,
        videoPrompt: `30-second reel video script for ${targetUniv}`,
        videoScript,
        videoDuration: 30,
        status: 'ai_draft_generated',
        approvalStatus: 'pending',
      },
    });

    await db.partnerMarketingUsage.update({
      where: { id: usage.id },
      data: {
        imagesUsed: assetType === 'image' ? usage.imagesUsed + 1 : usage.imagesUsed,
        videosUsed: assetType === 'video' ? usage.videosUsed + 1 : usage.videosUsed,
        ideasSubmitted: usage.ideasSubmitted + 1,
      },
    });

    return NextResponse.json({
      success: true,
      request: mReq,
      quotaUsed: assetType === 'image' ? `${usage.imagesUsed + 1}/${imageLimit} Images` : `${usage.videosUsed + 1}/${videoLimit} Videos`,
      message: 'AI Marketing Draft generated successfully under partner quota.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate marketing content', details: error.message }, { status: 500 });
  }
}
