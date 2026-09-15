import { NextRequest, NextResponse } from 'next/server';
import { getSocialMediaAgent } from '@/lib/ai-agents/social-media-agent';
import { SOCIAL_PLATFORMS_REGISTRY, getPlatformById } from '@/lib/social-platforms-registry';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

// GET /api/social/ai-agent — Get agent info and capabilities
export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const action = searchParams.get('action') || 'info';

      const agent = getSocialMediaAgent();

      if (action === 'info') {
        return NextResponse.json({
          success: true,
          data: agent.getAgentInfo(),
          meta: {
            message: 'ALO Social Media AI Agent — Own AI, No SaaS, 24 platforms coverage',
            version: '2.0',
            model: 'glm-4-flash (with Groq/ZAI/OpenRouter fallback)',
            totalPlatforms: SOCIAL_PLATFORMS_REGISTRY.length,
            totalMAU: SOCIAL_PLATFORMS_REGISTRY.reduce((sum, p) => sum + p.mauNumeric, 0)
          }
        });
      }

      if (action === 'platforms') {
        return NextResponse.json({
          success: true,
          data: SOCIAL_PLATFORMS_REGISTRY.map(p => ({
            id: p.id,
            name: p.displayName,
            mau: p.mau,
            category: p.category,
            priority: p.priority,
            bestFor: p.bestFor,
            contentFormats: p.contentFormats,
            aiTone: p.aiContentTone
          }))
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid action. Use ?action=info or ?action=platforms' }, { status: 400 });
    } catch (error: any) {
      console.error('[social/ai-agent GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}

// POST /api/social/ai-agent — AI Agent actions: generate content, replies, analytics, trends
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await request.json();
      const { action, platform, topic, contentType, tone, targetAudience, keywords, includeHashtags, includeCTA, language, additionalContext, originalMessage, senderName, intent, sentiment, isLead, conversationHistory, metrics, period, recentPosts, model } = body;

      const agent = getSocialMediaAgent(model || 'glm-4-flash');

      // Validate platform if provided
      if (platform && !getPlatformById(platform)) {
        return NextResponse.json({ success: false, error: `Platform ${platform} not found. Valid: ${SOCIAL_PLATFORMS_REGISTRY.map(p => p.id).join(', ')}` }, { status: 400 });
      }

      switch (action) {
        case 'generate_content': {
          if (!platform || !topic) {
            return NextResponse.json({ success: false, error: 'platform and topic required for generate_content' }, { status: 400 });
          }
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
          return NextResponse.json({ success: true, data: result, meta: { action, platform, aiModel: result.aiModel } });
        }

        case 'generate_reply': {
          if (!platform || !originalMessage) {
            return NextResponse.json({ success: false, error: 'platform and originalMessage required for generate_reply' }, { status: 400 });
          }
          const result = await agent.generateReply({
            platform,
            originalMessage,
            senderName,
            intent,
            sentiment,
            isLead,
            conversationHistory
          });
          return NextResponse.json({ success: true, data: result, meta: { action, platform } });
        }

        case 'generate_analytics': {
          if (!platform || !metrics) {
            return NextResponse.json({ success: false, error: 'platform and metrics required for generate_analytics' }, { status: 400 });
          }
          const result = await agent.generateAnalytics({
            platform,
            metrics,
            period
          });
          return NextResponse.json({ success: true, data: result, meta: { action, platform } });
        }

        case 'generate_for_all': {
          if (!topic) {
            return NextResponse.json({ success: false, error: 'topic required for generate_for_all' }, { status: 400 });
          }
          const results = await agent.generateForAllPlatforms(topic, contentType || 'post');
          return NextResponse.json({
            success: true,
            data: results,
            meta: {
              action,
              topic,
              generatedCount: results.length,
              totalPlatforms: SOCIAL_PLATFORMS_REGISTRY.filter(p => p.priority === 'critical' || p.priority === 'high').length,
              totalMAU: results.reduce((sum, r) => {
                const p = getPlatformById(r.platform);
                return sum + (p?.mauNumeric || 0);
              }, 0)
            }
          });
        }

        case 'analyze_trends': {
          if (!platform || !recentPosts) {
            return NextResponse.json({ success: false, error: 'platform and recentPosts array required for analyze_trends' }, { status: 400 });
          }
          const trends = await agent.analyzeTrends(platform, recentPosts);
          return NextResponse.json({ success: true, data: { trends, platform }, meta: { action, platform } });
        }

        case 'batch_generate': {
          // Generate for specific list of platforms
          const { platformIds, topics } = body;
          if (!platformIds || !Array.isArray(platformIds) || !topics) {
            return NextResponse.json({ success: false, error: 'platformIds array and topics required for batch_generate' }, { status: 400 });
          }
          const results: any[] = [];
          for (const pid of platformIds) {
            const p = getPlatformById(pid);
            if (!p) continue;
            try {
              const topicForPlatform = typeof topics === 'string' ? topics : (topics[pid] || topics[platformIds[0]] || 'Study abroad opportunities');
              const result = await agent.generateContent({
                platform: pid,
                topic: topicForPlatform,
                contentType: contentType || 'post',
                includeHashtags: true,
                includeCTA: true
              });
              results.push(result);
            } catch (e: any) {
              console.warn(`Batch generate failed for ${pid}:`, e.message);
            }
          }
          return NextResponse.json({
            success: true,
            data: results,
            meta: { action, requested: platformIds.length, generated: results.length }
          });
        }

        default:
          return NextResponse.json({
            success: false,
            error: `Invalid action. Valid: generate_content, generate_reply, generate_analytics, generate_for_all, analyze_trends, batch_generate`,
            validActions: ['generate_content', 'generate_reply', 'generate_analytics', 'generate_for_all', 'analyze_trends', 'batch_generate'],
            platforms: SOCIAL_PLATFORMS_REGISTRY.map(p => p.id)
          }, { status: 400 });
      }
    } catch (error: any) {
      console.error('[social/ai-agent POST]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  })(request);
}
