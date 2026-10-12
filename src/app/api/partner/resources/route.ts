import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const profile = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const [resources, quota] = await Promise.all([
      db.resource.findMany({
        where: { status: 'PUBLISHED', category: { status: 'ACTIVE' } },
        orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
        take: 200,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          featuredImage: true,
          countrySlug: true,
          studyLevel: true,
          readingTime: true,
          publishedAt: true,
          updatedAt: true,
          verificationStatus: true,
          sourceName: true,
          sourceUrl: true,
          lastVerifiedAt: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      db.partnerMarketingQuota.findUnique({ where: { partnerId: profile.partnerId } }),
    ]);

    const monthDate = new Date();
    const currentMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const usage = await db.partnerMarketingUsage.findFirst({ where: { partnerId: profile.partnerId, monthYear: currentMonth } });
    return NextResponse.json({
      success: true,
      data: {
        resources: resources.map((resource) => ({
          id: resource.id,
          slug: resource.slug,
          title: resource.title,
          category: resource.category?.name || 'Resource',
          description: resource.excerpt,
          url: `/resources/${resource.slug}`,
          featuredImage: resource.featuredImage,
          country: resource.countrySlug,
          studyLevel: resource.studyLevel,
          readingTime: resource.readingTime,
          publishedAt: resource.publishedAt,
          updatedAt: resource.updatedAt,
          verificationStatus: resource.verificationStatus,
          sourceName: resource.sourceName,
          sourceUrl: resource.sourceUrl,
          lastVerifiedAt: resource.lastVerifiedAt,
        })),
        marketingQuota: quota ? {
          monthlyImageLimit: quota.monthlyImageLimit,
          monthlyVideoLimit: quota.monthlyVideoLimit,
          videoDurationLimitSeconds: quota.videoDurationLimitSeconds,
          autoPublishAllowed: quota.autoPublishAllowed,
          requiresAloApproval: quota.requiresAloApproval,
          status: quota.status,
        } : null,
        marketingUsage: {
          monthYear: currentMonth,
          imagesUsed: usage?.imagesUsed ?? 0,
          videosUsed: usage?.videosUsed ?? 0,
          ideasSubmitted: usage?.ideasSubmitted ?? 0,
          postsScheduled: usage?.postsScheduled ?? 0,
          postsPublished: usage?.postsPublished ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('[PARTNER RESOURCES] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load published partner resources.' }, { status: 500 });
  }
}

// Downloaded files are not available in the published article catalog. Keep the
// old mutation endpoint closed rather than incrementing fake download counts.
export async function POST() {
  return NextResponse.json({ success: false, error: 'Resource downloads are not supported here. Open the published guide or use the partner marketing workflow.' }, { status: 405 });
}
