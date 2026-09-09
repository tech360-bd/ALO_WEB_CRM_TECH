import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

const RESOURCE_CATALOG = [
  {
    id: 'social-media-guides',
    category: 'Guides',
    title: 'Social Media Marketing Guide',
    description: 'Best practices for promoting education programs on social media platforms.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'referral-handbook',
    category: 'Guides',
    title: 'Student Referral Handbook',
    description: 'Complete guide on how to identify, refer, and follow up with potential students.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'commission-structure',
    category: 'Guides',
    title: 'Commission Structure Overview',
    description: 'Detailed breakdown of commission tiers and payment schedules.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'brand-guidelines',
    category: 'Templates',
    title: 'ALO Brand Guidelines & Templates',
    description: 'Official brand assets, color palettes, logo usage, and social media templates.',
    type: 'zip',
    icon: 'zip',
  },
  {
    id: 'email-templates',
    category: 'Templates',
    title: 'Email Outreach Templates',
    description: 'Pre-written email templates for student outreach, follow-ups, and program information.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'country-brochures',
    category: 'Marketing Materials',
    title: 'Country-Specific Brochures',
    description: 'Downloadable brochures for popular study destinations: UK, USA, Canada, Australia, Germany.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'program-flyers',
    category: 'Marketing Materials',
    title: 'Program Flyers & Infographics',
    description: 'Print-ready flyers highlighting popular programs and scholarship opportunities.',
    type: 'pdf',
    icon: 'pdf',
  },
  {
    id: 'video-tutorials',
    category: 'Training',
    title: 'Partner Onboarding Videos',
    description: 'Step-by-step video tutorials on using the partner portal and marketing tools.',
    type: 'video',
    icon: 'video',
  },
  {
    id: 'webinar-recordings',
    category: 'Training',
    title: 'Past Webinar Recordings',
    description: 'Recordings of past training webinars covering admission trends and marketing strategies.',
    type: 'video',
    icon: 'video',
  },
  {
    id: 'faq-doc',
    category: 'Support',
    title: 'Partner FAQ Document',
    description: 'Frequently asked questions about processes, policies, and troubleshooting.',
    type: 'pdf',
    icon: 'pdf',
  },
];

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const quota = await db.partnerMarketingQuota.findUnique({
      where: { partnerId: profile.partnerId },
    });

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usage = await db.partnerMarketingUsage.findFirst({
      where: { partnerId: profile.partnerId, monthYear: currentMonth },
    });

    const imagesRemaining = (quota?.monthlyImageLimit ?? 0) - (usage?.imagesUsed ?? 0);
    const videosRemaining = (quota?.monthlyVideoLimit ?? 0) - (usage?.videosUsed ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        resources: RESOURCE_CATALOG,
        marketingQuota: quota
          ? {
              monthlyImageLimit: quota.monthlyImageLimit,
              monthlyVideoLimit: quota.monthlyVideoLimit,
              videoDurationLimitSeconds: quota.videoDurationLimitSeconds,
              autoPublishAllowed: quota.autoPublishAllowed,
              requiresAloApproval: quota.requiresAloApproval,
              status: quota.status,
            }
          : null,
        marketingUsage: {
          monthYear: currentMonth,
          imagesUsed: usage?.imagesUsed ?? 0,
          videosUsed: usage?.videosUsed ?? 0,
          ideasSubmitted: usage?.ideasSubmitted ?? 0,
          postsScheduled: usage?.postsScheduled ?? 0,
          postsPublished: usage?.postsPublished ?? 0,
          imagesRemaining: Math.max(0, imagesRemaining),
          videosRemaining: Math.max(0, videosRemaining),
        },
      },
    });
  } catch (error) {
    console.error('[PARTNER RESOURCES] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      idea, countryId, universityId, courseId, intake,
      platform, language, targetAudience, ctaText, preferredStyle,
      caption, hashtags, imagePrompt, videoPrompt,
    } = body;

    if (!idea || !platform) {
      return NextResponse.json({ success: false, error: 'idea and platform are required' }, { status: 400 });
    }

    const resourceRequest = await db.partnerMarketingRequest.create({
      data: {
        partnerId: profile.partnerId,
        requestedBy: auth.userId,
        idea: idea || '',
        countryId: countryId || '',
        universityId: universityId || '',
        courseId: courseId || '',
        intake: intake || '',
        platform: platform || 'facebook',
        language: language || 'english',
        targetAudience: targetAudience || '',
        ctaText: ctaText || '',
        preferredStyle: preferredStyle || 'professional',
        caption: caption || '',
        hashtags: hashtags || '',
        imagePrompt: imagePrompt || '',
        videoPrompt: videoPrompt || '',
        status: 'idea_submitted',
        approvalStatus: 'pending',
      },
    });

    return NextResponse.json({ success: true, resourceRequest });
  } catch (error) {
    console.error('[PARTNER RESOURCES] Create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create resource request' }, { status: 500 });
  }
}
