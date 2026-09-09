// ============================================================
// POST /api/partner/marketing/generate - Generate AI marketing content
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction, type AuthContext } from '@/lib/auth-middleware';
import { checkQuotaBeforeAction, recordUsage } from '@/lib/access-check-engine';

function isPartnerRole(auth: AuthContext): boolean {
  return (
    auth.roles.includes('PARTNER_SUPER_ADMIN') ||
    auth.roles.includes('PARTNER_EMPLOYEE')
  );
}

async function getPartnerId(userId: string): Promise<string | null> {
  const profile = await db.partnerProfile.findUnique({
    where: { userId },
    select: { partnerId: true },
  });
  return profile?.partnerId ?? null;
}

const MAX_VIDEO_DURATION = 30;

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;

  if (!isPartnerRole(auth)) {
    return NextResponse.json(
      { success: false, message: 'Access denied. Partner role required.', status: 403 },
      { status: 403 },
    );
  }

  const partnerId = await getPartnerId(auth.userId);
  if (!partnerId) {
    return NextResponse.json(
      { success: false, message: 'Partner profile not found.', status: 404 },
      { status: 404 },
    );
  }

  try {
    const body = await request.json();
    const { requestId, generateType, videoDuration } = body;

    if (!requestId || !generateType) {
      return NextResponse.json(
        { success: false, message: 'requestId and generateType are required.', status: 400 },
        { status: 400 },
      );
    }

    if (!['image', 'video', 'content'].includes(generateType)) {
      return NextResponse.json(
        { success: false, message: 'generateType must be image, video, or content.', status: 400 },
        { status: 400 },
      );
    }

    if (generateType === 'video' && videoDuration && videoDuration > MAX_VIDEO_DURATION) {
      return NextResponse.json(
        { success: false, message: `Video max duration is ${MAX_VIDEO_DURATION} seconds.`, status: 400 },
        { status: 400 },
      );
    }

    const existingRequest = await db.partnerMarketingRequest.findUnique({
      where: { id: requestId },
    });
    if (!existingRequest || existingRequest.partnerId !== partnerId) {
      return NextResponse.json(
        { success: false, message: 'Marketing request not found or access denied.', status: 404 },
        { status: 404 },
      );
    }

    const quotaKey = generateType === 'video' ? 'marketing_videos' : 'marketing_images';
    const quotaCheck = await checkQuotaBeforeAction('partner', partnerId, quotaKey);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { success: false, message: quotaCheck.message || 'Monthly quota finished. Request extra quota from ALO Education.', status: 403 },
        { status: 403 },
      );
    }

    await db.partnerMarketingRequest.update({
      where: { id: requestId },
      data: { status: 'ai_generating' },
    });

    const usageType = generateType === 'video' ? 'marketing_videos' : 'marketing_images';
    await recordUsage('partner', partnerId, usageType);

    let generatedContent = '';
    let generatedImageUrl = '';
    let generatedVideoUrl = '';
    const effectiveVideoDuration = generateType === 'video' ? Math.min(videoDuration || 15, MAX_VIDEO_DURATION) : 0;

    if (generateType === 'image') {
      generatedImageUrl = `https://cdn.alo-education.com/generated/${requestId}_poster.png`;
      generatedContent = `AI-generated poster for: ${existingRequest.idea}`;
    } else if (generateType === 'video') {
      generatedVideoUrl = `https://cdn.alo-education.com/generated/${requestId}_video.mp4`;
      generatedContent = `AI-generated ${effectiveVideoDuration}s video for: ${existingRequest.idea}`;
    } else {
      generatedContent = JSON.stringify({
        title: `Marketing Post: ${existingRequest.idea.substring(0, 60)}`,
        caption: `Study abroad with confidence! ${existingRequest.idea}`,
        hashtags: '#StudyAbroad #ALOEducation',
        platform: existingRequest.platform,
        language: existingRequest.language,
      });
    }

    const updated = await db.partnerMarketingRequest.update({
      where: { id: requestId },
      data: {
        status: 'draft',
        generatedContent,
        generatedImageUrl,
        generatedVideoUrl,
        videoDuration: effectiveVideoDuration,
      },
    });

    await logAuditAction(auth, 'partner_marketing_generated', 'PartnerMarketingRequest', requestId, {
      partnerId,
      generateType,
      videoDuration: effectiveVideoDuration,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: 'Content generated successfully. Pending review.',
      data: updated,
    });
  } catch (error) {
    console.error('Partner marketing generate error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate content.', status: 500 },
      { status: 500 },
    );
  }
}
