import { NextRequest, NextResponse } from 'next/server';
import { SOCIAL_PLATFORMS_REGISTRY, PLATFORMS_BY_PRIORITY, PLATFORMS_BY_CATEGORY, TOTAL_MAU, PLATFORM_COUNT, CONTENT_FORMATS_ALL, getPlatformById } from '@/lib/social-platforms-registry';
import { getSocialMediaAgent } from '@/lib/ai-agents/social-media-agent';

export const dynamic = 'force-dynamic';

// GET /api/social/platforms — List all 24 platforms with metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority'); // critical, high, medium, low
    const category = searchParams.get('category'); // general, visual, messaging, etc.
    const id = searchParams.get('id'); // specific platform id
    const includeAgentInfo = searchParams.get('includeAgentInfo') === 'true';

    if (id) {
      const platform = getPlatformById(id);
      if (!platform) {
        return NextResponse.json({ success: false, error: `Platform ${id} not found` }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: platform,
        meta: {
          totalPlatforms: PLATFORM_COUNT,
          totalMAU: TOTAL_MAU,
        }
      });
    }

    let platforms = SOCIAL_PLATFORMS_REGISTRY;

    if (priority) {
      platforms = platforms.filter(p => p.priority === priority);
    }

    if (category) {
      platforms = platforms.filter(p => p.category === category);
    }

    const response: any = {
      success: true,
      data: platforms,
      meta: {
        totalPlatforms: PLATFORM_COUNT,
        totalMAU: TOTAL_MAU,
        totalMAUFormatted: `${(TOTAL_MAU / 1000000000).toFixed(2)}B combined reach`,
        filteredCount: platforms.length,
        contentFormats: CONTENT_FORMATS_ALL,
        byPriority: {
          critical: PLATFORMS_BY_PRIORITY.critical.length,
          high: PLATFORMS_BY_PRIORITY.high.length,
          medium: PLATFORMS_BY_PRIORITY.medium.length,
          low: PLATFORMS_BY_PRIORITY.low.length,
        },
        byCategory: {
          general: PLATFORMS_BY_CATEGORY.general.length,
          visual: PLATFORMS_BY_CATEGORY.visual.length,
          messaging: PLATFORMS_BY_CATEGORY.messaging.length,
          video: PLATFORMS_BY_CATEGORY.video.length,
          professional: PLATFORMS_BY_CATEGORY.professional.length,
          community: PLATFORMS_BY_CATEGORY.community.length,
          emerging: PLATFORMS_BY_CATEGORY.emerging.length,
          china: PLATFORMS_BY_CATEGORY.china.length,
        }
      }
    };

    if (includeAgentInfo) {
      const agent = getSocialMediaAgent();
      response.agentInfo = agent.getAgentInfo();
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[social/platforms GET]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/social/platforms — Get detailed info for multiple platforms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformIds, includeContentTips } = body;

    if (!platformIds || !Array.isArray(platformIds)) {
      return NextResponse.json({ success: false, error: 'platformIds array required' }, { status: 400 });
    }

    const platforms = platformIds.map((id: string) => getPlatformById(id)).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: platforms.map((p: any) => ({
        ...p,
        contentTips: includeContentTips ? p.contentTips : undefined
      })),
      meta: {
        requested: platformIds.length,
        found: platforms.length,
        totalMAU: platforms.reduce((sum: number, p: any) => sum + p.mauNumeric, 0)
      }
    });
  } catch (error: any) {
    console.error('[social/platforms POST]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
