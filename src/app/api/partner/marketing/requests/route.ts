import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { logAuditAction } from '@/lib/auth-middleware';
import { requirePartnerContext } from '@/lib/partner-tenant-guard';
import { z } from 'zod';

const PLATFORM_VALUES = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as const;
const READABLE_STATUSES = [
  'idea_submitted', 'ai_draft_generated', 'ai_generating', 'draft', 'pending',
  'pending_approval', 'pending_alo_review', 'partner_approved', 'approved',
  'rejected', 'scheduled', 'published', 'archived', 'generation_failed', 'image_generated', 'video_generated',
];

const updateSchema = z.object({
  id: z.string().trim().min(1).max(191),
  idea: z.string().trim().min(10).max(2000).optional(),
  platform: z.enum(PLATFORM_VALUES).optional(),
  language: z.string().trim().min(1).max(40).optional(),
  targetAudience: z.string().trim().max(200).optional(),
  ctaText: z.string().trim().max(80).optional(),
  preferredStyle: z.string().trim().max(40).optional(),
}).strict();

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function canEditMarketing(partnerRole: string): boolean {
  return ['PARTNER_SUPER_ADMIN', 'PARTNER_MARKETING_ASSISTANT'].includes(partnerRole.toUpperCase());
}

/** GET /api/partner/marketing/requests — tenant-scoped request history. */
export async function GET(request: Request) {
  const context = await requirePartnerContext(request);
  if (context instanceof NextResponse) return context;

  const url = new URL(request.url);
  const status = url.searchParams.get('status')?.trim().toLowerCase();
  const platformValue = url.searchParams.get('platform')?.trim().toUpperCase();
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '20');
  const dateFromText = url.searchParams.get('dateFrom');
  const dateToText = url.searchParams.get('dateTo');

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ success: false, error: 'page must be positive and limit must be between 1 and 100.' }, { status: 400 });
  }
  if (status && !READABLE_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: 'Unsupported marketing status filter.' }, { status: 400 });
  }
  if (platformValue && !(PLATFORM_VALUES as readonly string[]).includes(platformValue)) {
    return NextResponse.json({ success: false, error: 'Unsupported platform filter.' }, { status: 400 });
  }
  const dateFrom = dateFromText ? new Date(dateFromText) : undefined;
  const dateTo = dateToText ? new Date(dateToText) : undefined;
  if ((dateFrom && Number.isNaN(dateFrom.getTime())) || (dateTo && Number.isNaN(dateTo.getTime()))) {
    return NextResponse.json({ success: false, error: 'dateFrom/dateTo must be valid dates.' }, { status: 400 });
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return NextResponse.json({ success: false, error: 'dateFrom must be earlier than dateTo.' }, { status: 400 });
  }

  const where = {
    partnerId: context.partnerId,
    ...(status ? { status: { in: [status, status.toUpperCase()] } } : {}),
    ...(platformValue ? { platform: { in: [platformValue, platformValue.toLowerCase()] } } : {}),
    ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
  };

  try {
    const [requests, total] = await Promise.all([
      db.partnerMarketingRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.partnerMarketingRequest.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('[PARTNER MARKETING REQUESTS] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load marketing requests.' }, { status: 500 });
  }
}

/** PUT /api/partner/marketing/requests — edit an unsubmitted draft only. */
export async function PUT(request: Request) {
  const context = await requirePartnerContext(request);
  if (context instanceof NextResponse) return context;
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: 'Cross-origin marketing mutation denied.' }, { status: 403 });
  if (!canEditMarketing(context.partnerRole)) {
    return NextResponse.json({ success: false, error: 'Partner Super Admin or Marketing Assistant access is required.' }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid marketing update.' }, { status: 400 });
  }
  const { id, ...changes } = parsed.data;
  if (!Object.values(changes).some((value) => value !== undefined)) {
    return NextResponse.json({ success: false, error: 'Provide at least one editable field.' }, { status: 400 });
  }

  try {
    const existing = await db.partnerMarketingRequest.findFirst({ where: { id, partnerId: context.partnerId } });
    if (!existing) return NextResponse.json({ success: false, error: 'Marketing request not found.' }, { status: 404 });
    if (!['idea_submitted', 'draft', 'rejected'].includes(existing.status.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Only unsubmitted or rejected drafts can be edited.' }, { status: 409 });
    }

    const updated = await db.partnerMarketingRequest.update({
      where: { id },
      data: {
        ...changes,
        ...(changes.platform ? { platform: changes.platform.toLowerCase() } : {}),
        // Any content edit invalidates the prior AI copy/assets and review state.
        generatedContent: '',
        generatedImageUrl: '',
        generatedVideoUrl: '',
        assetId: '',
        publishedUrl: '',
        scheduledAt: null,
        approvedById: '',
        approvedAt: null,
        rejectionReason: '',
        approvalStatus: 'draft',
        status: 'idea_submitted',
      },
    });

    await logAuditAction(context, 'partner_marketing_draft_edited', 'PartnerMarketingRequest', id, {
      partnerId: context.partnerId,
      changedFields: Object.keys(changes).filter((key) => changes[key as keyof typeof changes] !== undefined),
      generatedAssetsReset: true,
    });
    return NextResponse.json({ success: true, data: updated, message: 'Draft fields saved. Prior generated content and assets were cleared; regenerate and resubmit for review.' });
  } catch (error) {
    console.error('[PARTNER MARKETING REQUESTS] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Marketing draft could not be updated.' }, { status: 500 });
  }
}
