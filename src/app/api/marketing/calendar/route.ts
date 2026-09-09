import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── GET: List calendar entries with filters and pagination ───────────────────

export const GET = withAuth(async (request: Request, _auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (platform) where.platform = platform;

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) {
        dateFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.lte = new Date(dateTo);
      }
      where.scheduledAt = dateFilter;
    }

    const [entries, total] = await Promise.all([
      db.marketingCalendar.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      db.marketingCalendar.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Calendar list error:', error);
    return NextResponse.json(
      { error: 'Failed to load calendar entries' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── POST: Schedule a new entry ──────────────────────────────────────────────

interface ScheduleInput {
  title: string;
  description?: string;
  platform?: string;
  campaignId?: string;
  contentId?: string;
  scheduledAt: string;
  autoReminder?: boolean;
}

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'schedule') {
      return handleSchedule(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=schedule' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Calendar POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

async function handleSchedule(body: ScheduleInput, auth: AuthContext) {
  const {
    title,
    description = '',
    platform = 'facebook',
    campaignId,
    contentId,
    scheduledAt,
    autoReminder = true,
  } = body;

  if (!title || !scheduledAt) {
    return NextResponse.json(
      { error: 'title and scheduledAt are required' },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid scheduledAt date' },
      { status: 400 }
    );
  }

  const createdById = auth.userId;

  const entry = await db.marketingCalendar.create({
    data: {
      title,
      description,
      platform,
      campaignId,
      contentId,
      scheduledAt: scheduledDate,
      autoReminder,
      status: 'scheduled',
      createdById,
    },
  });

  await createAuditLog({
    userId: createdById,
    role: auth.roles[0] || 'marketing',
    action: 'calendar.schedule',
    resource: 'MarketingCalendar',
    resourceId: entry.id,
    details: { title, platform, scheduledAt },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
