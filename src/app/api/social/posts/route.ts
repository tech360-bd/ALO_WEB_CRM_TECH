import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { getPlatformById, SOCIAL_PLATFORMS_REGISTRY } from '@/lib/social-platforms-registry';

export const dynamic = 'force-dynamic';

// GET /api/social/posts — List scheduled/published posts for all 24 platforms
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(request.url);
      const platform = searchParams.get('platform');
      const status = searchParams.get('status'); // draft, scheduled, published, failed
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: any = {};
      if (platform) where.platform = platform;
      if (status) where.status = status;

      let data: any[] = [];
      let total = 0;

      try {
        // Try MarketingCalendar and MarketingContentIdea as posts storage
        const [calendar, calendarCount] = await Promise.all([
          (db as any).marketingCalendar.findMany({
            where,
            orderBy: { scheduledAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }).catch(() => []),
          (db as any).marketingCalendar.count({ where }).catch(() => 0)
        ]);
        data = calendar;
        total = calendarCount;

        // Also try to get from MarketingGeneratedContent if calendar empty
        if (data.length === 0) {
          const [contents, contentsCount] = await Promise.all([
            (db as any).marketingGeneratedContent.findMany({
              where: platform ? { platform } : {},
              orderBy: { createdAt: 'desc' },
              skip: (page - 1) * limit,
              take: limit,
            }).catch(() => []),
            (db as any).marketingGeneratedContent.count({ where: platform ? { platform } : {} }).catch(() => 0)
          ]);
          if (contents.length > 0) {
            data = contents;
            total = contentsCount;
          }
        }
      } catch {
        data = [];
        total = 0;
      }

      return NextResponse.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        meta: {
          platformsSupported: SOCIAL_PLATFORMS_REGISTRY.length,
          filter: { platform, status }
        }
      });
    } catch (error: any) {
      console.error('[social/posts GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}

// POST /api/social/posts — Create/schedule post for any of 24 platforms
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { platform, content, contentType, scheduledAt, hashtags, cta, imageUrl, videoUrl, status, metadata } = body;

      if (!platform || !content) {
        return NextResponse.json({ success: false, error: 'platform and content required' }, { status: 400 });
      }

      const platformDef = getPlatformById(platform);
      if (!platformDef) {
        return NextResponse.json({ success: false, error: `Platform ${platform} not found` }, { status: 400 });
      }

      if (!platformDef.postingSupported) {
        return NextResponse.json({ success: false, error: `Posting not supported for ${platformDef.displayName} (API limitation)` }, { status: 400 });
      }

      let saved: any = null;
      try {
        saved = await (db as any).marketingCalendar.create({
          data: {
            platform,
            contentType: contentType || 'post',
            title: content.slice(0, 100),
            content,
            hashtags: JSON.stringify(hashtags || []),
            cta: cta || '',
            imageUrl: imageUrl || '',
            videoUrl: videoUrl || '',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
            status: status || 'scheduled',
            createdBy: auth.userId,
            metadata: JSON.stringify({
              ...metadata,
              platformName: platformDef.displayName,
              mau: platformDef.mau,
              ownAI: true
            })
          }
        });
      } catch (e: any) {
        // Fallback to MarketingGeneratedContent if calendar fails
        try {
          saved = await (db as any).marketingGeneratedContent.create({
            data: {
              platform,
              contentType: contentType || 'post',
              title: content.slice(0, 100),
              content,
              hashtags: JSON.stringify(hashtags || []),
              cta: cta || '',
              status: status || 'draft',
              createdBy: auth.userId,
              metadata: JSON.stringify(metadata || {})
            }
          });
        } catch (e2) {
          // Previously this returned success:true with a fabricated `mock_<ts>`
          // id so the UI showed a saved post that was never persisted. Report
          // the failure instead.
          console.error('[social/posts POST] both stores failed:', e2);
          return NextResponse.json(
            { success: false, error: 'The post could not be saved. No content store accepted the record.' },
            { status: 503 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: saved,
        meta: {
          platform: platformDef.displayName,
          mau: platformDef.mau,
          postingSupported: platformDef.postingSupported,
          bestPostingTime: `Tue-Thu 10AM-2PM BD Time for ${platformDef.displayName}`,
          ownAI: true
        }
      });
    } catch (error: any) {
      console.error('[social/posts POST]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}

// PUT /api/social/posts — Update post status
export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { id, status, publishedAt, platform } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      }

      let updated: any = null;
      try {
        updated = await (db as any).marketingCalendar.update({
          where: { id },
          data: {
            status: status || 'published',
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
            updatedAt: new Date()
          }
        }).catch(async () => {
          return await (db as any).marketingGeneratedContent.update({
            where: { id },
            data: {
              status: status || 'published',
              updatedAt: new Date()
            }
          }).catch(() => null);
        });
      } catch (error) {
        console.error('[social/posts PUT] update failed:', error);
      }

      // Previously this fell back to `{ id, status, mock: true }` and still
      // returned success:true, so the caller believed a status change was
      // persisted when nothing was written. Report the real outcome.
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Post status could not be updated. The record was not found or the update failed.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[social/posts PUT]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}
