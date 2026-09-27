import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

const MARKETING_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin', 'MARKETING_MANAGER', 'marketing_manager', 'MARKETING', 'marketing']);

// ─── GET: List webhook events ────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!MARKETING_ROLES.has(auth.userType) && !auth.roles.some((role) => MARKETING_ROLES.has(role))) {
    return NextResponse.json({ error: 'Marketing access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;

    const [events, total] = await Promise.all([
      db.socialWebhookEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.socialWebhookEvent.count({ where }),
    ]);

    return NextResponse.json({ events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Webhooks events error:', error);
    return NextResponse.json({ error: 'Failed to load webhook events' }, { status: 500 });
  }
}
