import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getPlatformById, SOCIAL_PLATFORMS_REGISTRY } from '@/lib/social-platforms-registry';
import { getSocialMediaAgent } from '@/lib/ai-agents/social-media-agent';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/social/analytics — Analytics for all 24 platforms
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(request.url);
      const platform = searchParams.get('platform');
      const period = searchParams.get('period') || '30d';

      if (platform) {
        const platformDef = getPlatformById(platform);
        if (!platformDef) {
          return NextResponse.json({ success: false, error: `Platform ${platform} not found` }, { status: 400 });
        }

        // Try to get real analytics from DB
        let analytics: any = null;
        try {
          // Try MarketingReport or similar
          const reports = await (db as any).marketingReport.findMany({
            where: { platform },
            orderBy: { createdAt: 'desc' },
            take: 5
          }).catch(() => []);

          // Try SocialWebhookEvent for activity
          const events = await (db as any).socialWebhookEvent.findMany({
            where: { platform },
            orderBy: { createdAt: 'desc' },
            take: 10
          }).catch(() => []);

          // Try MarketingSocialMessage counts
          const messageCount = await (db as any).marketingSocialMessage.count({
            where: { platform }
          }).catch(() => 0);

          analytics = {
            platform: platformDef.displayName,
            mau: platformDef.mau,
            reports,
            recentEvents: events,
            messageCount,
            period
          };
        } catch {
          analytics = {
            platform: platformDef.displayName,
            mau: platformDef.mau,
            message: 'No analytics data yet — start posting to generate data',
            period
          };
        }

        return NextResponse.json({
          success: true,
          data: analytics,
          meta: {
            platform: platformDef.displayName,
            mau: platformDef.mau,
            category: platformDef.category,
            priority: platformDef.priority,
            ownAI: true
          }
        });
      }

      // All platforms overview.
      // Only counts that are actually stored are returned. Engagement and
      // growth were previously synthesised with Math.random() — invented
      // metrics presented as measured data — so they are now reported as null
      // and the UI must show "not measured" rather than a number.
      const overview = await Promise.all(
        SOCIAL_PLATFORMS_REGISTRY.slice(0, 12).map(async (p) => {
          try {
            const count = await (db as any).marketingSocialMessage.count({
              where: { platform: p.id }
            }).catch(() => 0);
            return {
              platform: p.id,
              displayName: p.displayName,
              mau: p.mau,
              priority: p.priority,
              category: p.category,
              messageCount: count,
              // No provider metric is stored for these, so they are reported
              // as unmeasured instead of a plausible-looking random figure.
              engagement: null as number | null,
              growth: null as string | null,
              measured: false
            };
          } catch {
            return {
              platform: p.id,
              displayName: p.displayName,
              mau: p.mau,
              priority: p.priority,
              category: p.category,
              messageCount: 0,
              engagement: null as number | null,
              growth: null as string | null,
              measured: false
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          overview,
          totals: {
            platforms: SOCIAL_PLATFORMS_REGISTRY.length,
            totalMAU: SOCIAL_PLATFORMS_REGISTRY.reduce((sum, p) => sum + p.mauNumeric, 0),
            totalMAUFormatted: `${(SOCIAL_PLATFORMS_REGISTRY.reduce((sum, p) => sum + p.mauNumeric, 0) / 1000000000).toFixed(1)}B`,
            criticalPlatforms: SOCIAL_PLATFORMS_REGISTRY.filter(p => p.priority === 'critical').length,
            highPriority: SOCIAL_PLATFORMS_REGISTRY.filter(p => p.priority === 'high').length
          }
        },
        meta: {
          period,
          platformsSupported: SOCIAL_PLATFORMS_REGISTRY.length,
          ownAI: true,
          noSaaS: true
        }
      });
    } catch (error: any) {
      console.error('[social/analytics GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}

// POST /api/social/analytics — AI-powered analytics insights
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { platform, metrics, period, model } = body;

      if (!platform || !metrics) {
        return NextResponse.json({ success: false, error: 'platform and metrics required' }, { status: 400 });
      }

      const platformDef = getPlatformById(platform);
      if (!platformDef) {
        return NextResponse.json({ success: false, error: `Platform ${platform} not found` }, { status: 400 });
      }

      const agent = getSocialMediaAgent(model || 'glm-4-flash');
      const insights = await agent.generateAnalytics({
        platform,
        metrics,
        period: period || '30d'
      });

      // Optionally save insights to DB
      let saved: any = null;
      try {
        saved = await (db as any).marketingReport.create({
          data: {
            platform,
            title: `Analytics Insights for ${platformDef.displayName} - ${period || '30d'}`,
            content: JSON.stringify(insights),
            metrics: JSON.stringify(metrics),
            insights: JSON.stringify(insights.insights),
            recommendations: JSON.stringify(insights.recommendations),
            performanceScore: insights.performanceScore,
            period: period || '30d',
            createdBy: auth.userId
          }
        }).catch(() => null);
      } catch {}

      return NextResponse.json({
        success: true,
        data: insights,
        saved: saved ? { id: saved.id } : null,
        meta: {
          platform: platformDef.displayName,
          mau: platformDef.mau,
          ownAI: true,
          aiModel: model || 'glm-4-flash',
          generatedAt: insights.generatedAt
        }
      });
    } catch (error: any) {
      console.error('[social/analytics POST]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}
