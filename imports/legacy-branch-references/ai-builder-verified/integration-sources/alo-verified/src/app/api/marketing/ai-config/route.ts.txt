import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const DEFAULT_CONFIG = {
  aiEnabled: true,
  officeHoursOnly: true,
  businessHoursStart: '10:00',
  businessHoursEnd: '18:00',
  timezone: 'Asia/Dhaka',
  requireOtpForPrivate: true,
  humanHandoffKeywords: 'complaint,refund,refuse,angry,emergency',
};

/**
 * WhatsApp AI config (global).
 * - GET: return global config (first row, or defaults).
 * - PUT: update global config (marketing_manager / super_admin).
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const config = await db.whatsappAiConfig.findFirst({
      where: { scope: 'global' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ config: config ?? null, defaults: DEFAULT_CONFIG });
  } catch (error) {
    console.error('marketing/ai-config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const {
      aiEnabled,
      officeHoursOnly,
      businessHoursStart,
      businessHoursEnd,
      timezone,
      requireOtpForPrivate,
      humanHandoffKeywords,
    } = body;

    // Validate time strings if provided
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (businessHoursStart && !timeRegex.test(businessHoursStart)) {
      return NextResponse.json(
        { error: 'businessHoursStart must be HH:MM (24h)' },
        { status: 400 }
      );
    }
    if (businessHoursEnd && !timeRegex.test(businessHoursEnd)) {
      return NextResponse.json(
        { error: 'businessHoursEnd must be HH:MM (24h)' },
        { status: 400 }
      );
    }

    const existing = await db.whatsappAiConfig.findFirst({
      where: { scope: 'global' },
      orderBy: { createdAt: 'desc' },
    });

    const data = {
      scope: 'global' as const,
      aiEnabled: typeof aiEnabled === 'boolean' ? aiEnabled : existing?.aiEnabled ?? DEFAULT_CONFIG.aiEnabled,
      officeHoursOnly:
        typeof officeHoursOnly === 'boolean'
          ? officeHoursOnly
          : existing?.officeHoursOnly ?? DEFAULT_CONFIG.officeHoursOnly,
      businessHoursStart: businessHoursStart ?? existing?.businessHoursStart ?? DEFAULT_CONFIG.businessHoursStart,
      businessHoursEnd: businessHoursEnd ?? existing?.businessHoursEnd ?? DEFAULT_CONFIG.businessHoursEnd,
      timezone: timezone ?? existing?.timezone ?? DEFAULT_CONFIG.timezone,
      requireOtpForPrivate:
        typeof requireOtpForPrivate === 'boolean'
          ? requireOtpForPrivate
          : existing?.requireOtpForPrivate ?? DEFAULT_CONFIG.requireOtpForPrivate,
      humanHandoffKeywords:
        humanHandoffKeywords ?? existing?.humanHandoffKeywords ?? DEFAULT_CONFIG.humanHandoffKeywords,
    };

    const config = existing
      ? await db.whatsappAiConfig.update({ where: { id: existing.id }, data })
      : await db.whatsappAiConfig.create({ data });

    await logAudit({
      userId: auth.user.id,
      action: 'whatsapp.ai_config.updated',
      module: 'whatsapp',
      recordId: config.id,
      oldData: existing ?? null,
      newData: config,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('marketing/ai-config PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
