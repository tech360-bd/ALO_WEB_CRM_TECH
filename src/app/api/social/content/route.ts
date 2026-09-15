import { NextRequest, NextResponse } from 'next/server';
import { getSocialMediaAgent } from '@/lib/ai-agents/social-media-agent';
import { getPlatformById, SOCIAL_PLATFORMS_REGISTRY } from '@/lib/social-platforms-registry';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/social/content — List generated content
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const platform = searchParams.get('platform');
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

      const where: any = {};
      if (platform) where.platform = platform;

      // Try to fetch from MarketingGeneratedContent if exists
      let data: any[] = [];
      let total = 0;
      try {
        const [contents, count] = await Promise.all([
          (db as any).marketingGeneratedContent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }).catch(() => []),
          (db as any).marketingGeneratedContent.count({ where }).catch(() => 0)
        ]);
        data = contents;
        total = count;
      } catch {
        // Fallback if table not exists
        data = [];
        total = 0;
      }

      return NextResponse.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        meta: {
          platformsSupported: SOCIAL_PLATFORMS_REGISTRY.length,
          totalMAU: SOCIAL_PLATFORMS_REGISTRY.reduce((sum, p) => sum + p.mauNumeric, 0)
        }
      });
    } catch (error: any) {
      console.error('[social/content GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}

// POST /api/social/content — Generate content using own AI agent
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { platform, topic, contentType, tone, targetAudience, keywords, includeHashtags, includeCTA, language, additionalContext, model, saveToDb } = body;

      if (!platform || !topic) {
        return NextResponse.json({ success: false, error: 'platform and topic required' }, { status: 400 });
      }

      if (!getPlatformById(platform)) {
        return NextResponse.json({ success: false, error: `Platform ${platform} not found. Valid: ${SOCIAL_PLATFORMS_REGISTRY.map(p => p.id).join(', ')}` }, { status: 400 });
      }

      const agent = getSocialMediaAgent(model || 'glm-4-flash');
      const result = await agent.generateContent({
        platform,
        topic,
        contentType: contentType || 'post',
        tone,
        targetAudience,
        keywords,
        includeHashtags: includeHashtags ?? true,
        includeCTA: includeCTA ?? true,
        language: language || 'English',
        additionalContext
      });

      // Optionally save to DB
      let saved: any = null;
      if (saveToDb) {
        try {
          saved = await (db as any).marketingGeneratedContent.create({
            data: {
              platform: result.platform,
              contentType: contentType || 'post',
              title: topic.slice(0, 100),
              content: result.content,
              hashtags: JSON.stringify(result.hashtags || []),
              cta: result.cta || '',
              imagePrompt: result.imagePrompt || '',
              seoTitle: result.seoTitle || '',
              seoDescription: result.seoDescription || '',
              status: 'draft',
              createdBy: auth.userId,
              metadata: JSON.stringify({
                aiModel: result.aiModel,
                estimatedReach: result.estimatedReach,
                bestPostingTime: result.bestPostingTime,
                generatedAt: result.generatedAt
              })
            }
          }).catch(() => null);
        } catch (e) {
          console.warn('Failed to save to DB:', e);
        }
      }

      return NextResponse.json({
        success: true,
        data: result,
        saved: saved ? { id: saved.id } : null,
        meta: {
          platform,
          aiModel: result.aiModel,
          generatedAt: result.generatedAt,
          ownAI: true,
          noSaaS: true
        }
      });
    } catch (error: any) {
      console.error('[social/content POST]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}
