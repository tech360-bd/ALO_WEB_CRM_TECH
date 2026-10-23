import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORMS = new Set(['facebook', 'instagram', 'whatsapp', 'linkedin', 'tiktok', 'email', 'sms', 'website']);

// This is a planning calendar, not a connected scheduler. Limited users see only their own items.
export const GET = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const params = new URL(req.url).searchParams;
  const platform = params.get('platform');
  const status = params.get('status');
  const manager = isMarketingManager(auth);
  const where: Record<string, unknown> = {};
  if (!manager) where.createdById = auth.userId;
  if (platform && platform !== 'ALL') where.platform = platform.toLowerCase();
  if (status && status !== 'ALL') where.status = status;
  try {
    const items = await db.marketingCalendar.findMany({ where, orderBy: { scheduledAt: 'asc' }, take: 100 });
    const postWhere: Record<string, unknown> = { approvalStatus: { in: ['APPROVED', 'PUBLISHED', 'SCHEDULED'] } };
    if (!manager) postWhere.createdBy = auth.userId;
    const posts = await db.campaignPost.findMany({ where: postWhere, orderBy: { scheduledAt: 'asc' }, take: 50 });
    const merged = [
      ...items.map((item) => ({ id: item.id, title: item.title, platform: item.platform, status: item.status, scheduledAt: item.scheduledAt, publishedAt: item.publishedAt, type: 'calendar', campaignId: item.campaignId, contentId: item.contentId })),
      ...posts.map((post) => ({ id: `post-${post.id}`, title: post.title, platform: post.platform, status: post.approvalStatus.toLowerCase(), scheduledAt: post.scheduledAt || post.publishedAt || post.createdAt, publishedAt: post.publishedAt, type: 'campaignPost', campaignId: post.id, contentId: post.id })),
    ];
    merged.sort((a, b) => new Date(a.scheduledAt as any).getTime() - new Date(b.scheduledAt as any).getTime());
    return NextResponse.json({ success: true, items: merged, calendarCount: items.length, postsCount: posts.length, total: merged.length, scheduler: 'NOT_CONFIGURED — entries are plans only' });
  } catch (error) {
    console.error('[marketing.calendar] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load marketing calendar.' }, { status: 503 });
  }
});

// POST — create an unscheduled planning item, never an executable schedule.
export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const platform = typeof body?.platform === 'string' ? body.platform.trim().toLowerCase() : 'facebook';
  const scheduledAt = typeof body?.scheduledAt === 'string' ? new Date(body.scheduledAt) : null;
  if (!title || title.length > 200 || description.length > 2000 || !PLATFORMS.has(platform) || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ success: false, error: 'A valid title, platform and planning date are required.' }, { status: 400 });
  }
  try {
    const item = await db.marketingCalendar.create({
      data: {
        title, description, platform,
        campaignId: typeof body?.campaignId === 'string' ? body.campaignId.slice(0, 191) : null,
        contentId: typeof body?.contentId === 'string' ? body.contentId.slice(0, 191) : null,
        status: 'draft', scheduledAt, createdById: auth.userId, autoReminder: false,
      },
    });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'MarketingCalendar', resourceId: item.id, details: JSON.stringify({ action: 'planning_draft_created', platform, scheduledAt: scheduledAt.toISOString() }) } });
    return NextResponse.json({ success: true, item, scheduled: false, message: 'Planning draft saved. No scheduler or provider post was created.' }, { status: 201 });
  } catch (error) {
    console.error('[marketing.calendar] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to save calendar planning draft.' }, { status: 503 });
  }
}, 'draft-post');

// PATCH — reschedule/cancel planning records only. No action may mark content published.
export const PATCH = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as { id?: unknown; status?: unknown; scheduledAt?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
  if (!id || !status) return NextResponse.json({ success: false, error: 'id and status are required.' }, { status: 400 });
  if (status === 'published' || status === 'scheduled') {
    return NextResponse.json({ success: false, deliveryStatus: 'NOT_CONFIGURED', error: 'No verified publishing scheduler or official provider is configured. No status was changed.' }, { status: 503 });
  }
  if (id.startsWith('post-')) return NextResponse.json({ success: false, error: 'Campaign post status is controlled by its approval workflow; calendar edits cannot publish or reschedule it.' }, { status: 409 });
  if (!['draft', 'cancelled'].includes(status)) return NextResponse.json({ success: false, error: 'Only local draft planning or cancellation is supported.' }, { status: 400 });
  const scheduledAt = typeof body?.scheduledAt === 'string' ? new Date(body.scheduledAt) : undefined;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ success: false, error: 'Invalid planning date.' }, { status: 400 });
  try {
    const current = await db.marketingCalendar.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: 'Calendar item not found.' }, { status: 404 });
    if (!isMarketingManager(auth) && current.createdById !== auth.userId) return NextResponse.json({ success: false, error: 'You may only edit your own planning item.' }, { status: 403 });
    const item = await db.marketingCalendar.update({ where: { id }, data: { status, ...(scheduledAt ? { scheduledAt } : {}), ...(status === 'cancelled' ? { autoReminder: false } : {}) } });
    await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'MarketingCalendar', resourceId: id, details: JSON.stringify({ action: status, scheduledAt: scheduledAt?.toISOString() || null }) } });
    return NextResponse.json({ success: true, item, scheduled: false, published: false, message: status === 'cancelled' ? 'Planning item cancelled locally.' : 'Planning item updated; no external schedule was created.' });
  } catch (error) {
    console.error('[marketing.calendar] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update planning item.' }, { status: 503 });
  }
});
