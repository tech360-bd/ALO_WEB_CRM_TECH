import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

// RBAC: SUPER_ADMIN, ADMIN, COUNSELOR, MARKETING_MANAGER
const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER'];

export async function GET(_req: NextRequest) {
  const auth = await requireAuth(_req);
  if (isErrorResponse(auth)) return auth;

  if (!ALLOWED_ROLES.includes(auth.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Access denied.' },
      { status: 403 },
    );
  }

  try {
    const [messageCountsByChannel, recentMessages, unreadCounts] = await Promise.all([
      // Message counts by channel
      db.communicationMessage.groupBy({
        by: ['channel'],
        _count: true,
      }),

      // Recent 20 messages across all channels
      db.communicationMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          studentId: true,
          leadId: true,
          channel: true,
          direction: true,
          content: true,
          messageType: true,
          status: true,
          createdAt: true,
        },
      }),

      // Unread counts by channel
      db.communicationMessage.groupBy({
        by: ['channel'],
        where: { direction: 'INBOUND', status: { in: ['DELIVERED', 'READ'] } },
        _count: true,
      }),
    ]);

    const totalMessages = messageCountsByChannel.reduce((sum, m) => sum + m._count, 0);
    const totalUnread = unreadCounts.reduce((sum, m) => sum + m._count, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        totalUnread,
        messageCountsByChannel: messageCountsByChannel.map((m) => ({
          channel: m.channel,
          count: m._count,
        })),
        unreadCountsByChannel: unreadCounts.map((m) => ({
          channel: m.channel,
          count: m._count,
        })),
        recentMessages,
      },
    });
  } catch (error) {
    console.error('Error fetching omnichannel dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch omnichannel data.' },
      { status: 500 },
    );
  }
}
