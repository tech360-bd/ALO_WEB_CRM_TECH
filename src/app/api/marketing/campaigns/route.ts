import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { generateText } from '@/lib/ai';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

// ─── GET: List campaigns with filters and pagination ───────────────────────────

export const GET = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (!isMarketingManager(auth)) where.createdById = auth.userId;
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { goal: { contains: search } },
        { strategy: { contains: search } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      db.marketingCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.marketingCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Campaigns list error:', error);
    return NextResponse.json(
      { error: 'Failed to load campaigns' },
      { status: 500 }
    );
  }
}, 'draft-post');

// ─── POST: Create campaign or generate AI content ─────────────────────────────

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'create') {
      return handleCreate(body, auth);
    }
    if (action === 'generate') {
      return handleGenerate(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=create or ?action=generate' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Campaigns POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'draft-post');

// ─── Create Campaign ──────────────────────────────────────────────────────────

interface CreateCampaignInput {
  name: string;
  goal: string;
  platform?: string;
  strategy?: string;
  targetCountry?: string;
  targetCourse?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdById?: string;
}

async function handleCreate(body: CreateCampaignInput, auth: AuthContext) {
  const {
    name,
    goal,
    platform = 'facebook',
    strategy = '',
    targetCountry = '',
    targetCourse = '',
    budget = 0,
    startDate,
    endDate,
  } = body;

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 200 || typeof goal !== 'string' || !goal.trim() || goal.trim().length > 2000) {
    return NextResponse.json({ success: false, error: 'name and goal are required and must be valid text.' }, { status: 400 });
  }
  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 0 || budget > 100000000) {
    return NextResponse.json({ success: false, error: 'budget must be a non-negative number within the allowed range.' }, { status: 400 });
  }
  const cleanPlatform = typeof platform === 'string' && ['facebook', 'instagram', 'whatsapp', 'linkedin', 'tiktok', 'email', 'sms'].includes(platform.toLowerCase()) ? platform.toLowerCase() : null;
  if (!cleanPlatform) return NextResponse.json({ success: false, error: 'Unsupported campaign platform.' }, { status: 400 });
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())) || (start && end && end <= start)) {
    return NextResponse.json({ success: false, error: 'Campaign dates are invalid or out of order.' }, { status: 400 });
  }

  const createdById = auth.userId;

  const campaign = await db.marketingCampaign.create({
    data: {
      name: name.trim(),
      goal: goal.trim(),
      platform: cleanPlatform,
      strategy: typeof strategy === 'string' ? strategy.slice(0, 5000) : '',
      targetCountry: typeof targetCountry === 'string' ? targetCountry.slice(0, 120) : '',
      targetCourse: typeof targetCourse === 'string' ? targetCourse.slice(0, 200) : '',
      budget,
      startDate: start,
      endDate: end,
      createdById,
    },
  });

  await createAuditLog({
    userId: createdById,
    role: auth.roles[0] || 'marketing',
    action: 'campaign.create',
    resource: 'MarketingCampaign',
    resourceId: campaign.id,
    details: { name, goal, platform },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

// ─── Generate AI Content for Campaign ─────────────────────────────────────────

interface GenerateCampaignInput {
  campaignId: string;
  userId?: string;
}

async function handleGenerate(body: GenerateCampaignInput, auth: AuthContext) {
  const { campaignId } = body;

  if (!campaignId) {
    return NextResponse.json(
      { error: 'campaignId is required' },
      { status: 400 }
    );
  }

  const campaign = await db.marketingCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    );
  }
  if (!isMarketingManager(auth) && campaign.createdById !== auth.userId) {
    return NextResponse.json({ success: false, error: 'You may only generate content for your own campaign.' }, { status: 403 });
  }
  if (!['draft', 'review'].includes(campaign.status.toLowerCase())) {
    return NextResponse.json({ success: false, error: 'Content can only be generated for a draft or review campaign.' }, { status: 409 });
  }

  const prompt = `You are an expert education marketing copywriter for ALO Education, a study abroad consultancy based in Bangladesh.

Generate marketing content for the following campaign:

Campaign Name: ${campaign.name}
Goal: ${campaign.goal}
Platform: ${campaign.platform}
Strategy: ${campaign.strategy || 'General engagement'}
Target Country: ${campaign.targetCountry || 'All destinations'}
Target Course: ${campaign.targetCourse || 'All courses'}

Generate the following content pieces and return them as a JSON object with these exact keys:

1. "banglaCaption" - An engaging Bangla/Bengali social media caption that resonates with Bangladeshi students. Use conversational, friendly tone. Include emojis.
2. "englishCaption" - A professional English caption for the same campaign. Clear, concise, with a strong CTA.
3. "mixedCaption" - A bilingual (Banglish/mixed Bangla-English) caption that blends both languages naturally, as used by Bangladeshi youth on social media.
4. "whatsappMessage" - A WhatsApp-friendly message (shorter, personal, direct). Include phone-friendly formatting.
5. "messengerReply" - A Messenger reply template for when students DM about this campaign. Helpful, informative, asks qualifying questions.
6. "emailCopy" - An email subject line and short body (max 150 words) for email marketing.
7. "smsCopy" - A concise SMS text (max 160 characters) for SMS marketing.
8. "posterPrompt" - A detailed image generation prompt for creating a marketing poster/visual.
9. "videoScript" - A 30-60 second short video/reels script with scene-by-scene breakdown.
10. "voiceScript" - A voiceover script for the video (separate from video script, focused on narration).
11. "subtitle" - Subtitle text for the video.
12. "thumbnailConcept" - Description of an eye-catching thumbnail concept.
13. "hashtags" - An array of 15-20 relevant hashtags as a JSON array of strings (mix of Bangla, English, and trending).
14. "cta" - A compelling call-to-action phrase.
15. "landingPage" - Suggested landing page headline and subheadline.
16. "followUpSequence" - A JSON array of 3 follow-up messages for leads who engage.
17. "commentReplies" - A JSON array of 5 suggested replies to common comments.
18. "dmQualification" - A qualification script to use in DMs to assess lead quality.

Return ONLY the JSON object, no other text.`;

  const result = await generateText({ prompt, model: 'glm-4-flash' });

  let generated: Record<string, unknown>;
  try {
    let jsonStr = result.text || '';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    generated = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI-generated content' },
      { status: 500 }
    );
  }

  const updatedCampaign = await db.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      banglaCaption: (generated.banglaCaption as string) || '',
      englishCaption: (generated.englishCaption as string) || '',
      mixedCaption: (generated.mixedCaption as string) || '',
      whatsappMessage: (generated.whatsappMessage as string) || '',
      messengerReply: (generated.messengerReply as string) || '',
      emailCopy: (generated.emailCopy as string) || '',
      smsCopy: (generated.smsCopy as string) || '',
      posterPrompt: (generated.posterPrompt as string) || '',
      videoScript: (generated.videoScript as string) || '',
      voiceScript: (generated.voiceScript as string) || '',
      subtitle: (generated.subtitle as string) || '',
      thumbnailConcept: (generated.thumbnailConcept as string) || '',
      hashtags: JSON.stringify(generated.hashtags || []),
      cta: (generated.cta as string) || '',
      landingPage: (generated.landingPage as string) || '',
      followUpSequence: JSON.stringify(generated.followUpSequence || []),
      commentReplies: JSON.stringify(generated.commentReplies || []),
      dmQualification: (generated.dmQualification as string) || '',
      status: 'review',
    },
  });

  await createAuditLog({
    userId: auth.userId,
    role: auth.roles[0] || 'marketing',
    action: 'campaign.generate_content',
    resource: 'MarketingCampaign',
    resourceId: campaignId,
    details: { campaignName: campaign.name, status: 'review' },
  });

  return NextResponse.json({ campaign: updatedCampaign });
}
