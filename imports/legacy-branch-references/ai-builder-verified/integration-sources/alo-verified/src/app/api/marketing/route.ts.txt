import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Marketing content + campaigns.
 * - GET: any marketing access.
 * - POST: any marketing access (create campaign or content).
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const contentType = searchParams.get('contentType') || '';
    const platform = searchParams.get('platform') || '';
    const status = searchParams.get('status') || '';
    const campaignId = searchParams.get('campaignId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { caption: { contains: search } },
      ];
    }
    if (contentType) where.contentType = contentType;
    if (platform) where.platform = platform;
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const [content, total] = await Promise.all([
      db.marketingContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, name: true, status: true } },
          layers: { orderBy: { layerOrder: 'asc' } },
        },
      }),
      db.marketingContent.count({ where }),
    ]);

    const campaigns = await db.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const socialSizes = await db.socialPostSize.findMany();

    return NextResponse.json({
      content,
      campaigns,
      socialSizes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Marketing GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();

    // If creating a campaign
    if (body.type === 'campaign') {
      const campaign = await db.campaign.create({
        data: {
          name: body.name,
          objective: body.objective || null,
          targetAudience: body.targetAudience || null,
          country: body.country || null,
          serviceType: body.serviceType || null,
          platforms: body.platforms || null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          budget: body.budget || null,
          status: body.status || 'draft',
        },
      });

      await logAudit({
        userId: auth.user.id,
        action: 'marketing.campaign_created',
        module: 'marketing',
        recordId: campaign.id,
        newData: campaign,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return NextResponse.json(campaign, { status: 201 });
    }

    // Creating marketing content
    if (!body.contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    const content = await db.marketingContent.create({
      data: {
        campaignId: body.campaignId || null,
        contentType: body.contentType,
        platform: body.platform || null,
        title: body.title || null,
        caption: body.caption || null,
        hashtags: body.hashtags || null,
        bodyContent: body.bodyContent || null,
        imagePrompt: body.imagePrompt || null,
        videoScript: body.videoScript || null,
        ctaText: body.ctaText || null,
        ctaLink: body.ctaLink || null,
        sizeTemplate: body.sizeTemplate || null,
        status: body.status || 'draft',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
      include: {
        campaign: true,
      },
    });

    // Create editor layers if provided
    if (body.layers && Array.isArray(body.layers)) {
      for (let i = 0; i < body.layers.length; i++) {
        const layer = body.layers[i];
        await db.contentEditorLayer.create({
          data: {
            contentId: content.id,
            layerType: layer.layerType || 'text',
            text: layer.text || null,
            fontFamily: layer.fontFamily || null,
            fontSize: layer.fontSize || null,
            fontWeight: layer.fontWeight || null,
            fontColor: layer.fontColor || null,
            bgColor: layer.bgColor || null,
            alignment: layer.alignment || null,
            x: layer.x || 0,
            y: layer.y || 0,
            width: layer.width || null,
            height: layer.height || null,
            rotation: layer.rotation || 0,
            zIndex: layer.zIndex || 0,
            borderRadius: layer.borderRadius || null,
            opacity: layer.opacity || 1,
            layerOrder: i,
          },
        });
      }
    }

    await logAudit({
      userId: auth.user.id,
      action: 'marketing.content_created',
      module: 'marketing',
      recordId: content.id,
      newData: { contentType: content.contentType, title: content.title, campaignId: content.campaignId },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error('Marketing POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
