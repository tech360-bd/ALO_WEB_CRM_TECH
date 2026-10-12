import { canUseUnscopedUccAdmin } from '@/lib/ucc/document-access';
// ============================================================
// /api/crm/ucc/morning-summary
// GET — Daily counselor briefing: overnight conversations,
//       pending OCR reviews, overdue replies, urgent cases
// Scoped by role: admins see all; counselors see only assigned
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (!canUseUnscopedUccAdmin(auth)) return NextResponse.json({success:false,code:'UCC_OWNERSHIP_SCOPE_PENDING',error:'Private UCC access is restricted to canonical administrators until domain-aware ownership is verified.'},{status:403});

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].includes(primaryRole);

    const baseWhere = isAdmin
      ? { createdAt: { gte: yesterday } }
      : { createdAt: { gte: yesterday }, assignedToUserId: auth.userId };

    const [
      newConversations,
      totalUnread,
      ocrPending,
      approvalsPending,
      overdueConversations,
      contentPending,
    ] = await Promise.all([
      db.uccConversation.findMany({
        where: baseWhere,
        orderBy: { priority: 'asc' },
        take: 50,
        select: {
          id: true,
          participantName: true,
          channel: true,
          priority: true,
          status: true,
          lastMessageText: true,
          lastMessageAt: true,
          destinationCountry: true,
          assignedToUserId: true,
        },
      }),
      db.uccConversation.aggregate({
        _sum: { unreadCount: true },
        where: isAdmin ? { status: 'open' } : { status: 'open', assignedToUserId: auth.userId },
      }),
      db.ocrJob.count({ where: { status: 'review_required' } }),
      db.approvalRequest.count({ where: { status: 'pending' } }),
      db.uccConversation.findMany({
        where: {
          ...(isAdmin ? {} : { assignedToUserId: auth.userId }),
          status: 'open',
          lastMessageAt: { lt: fourHoursAgo },
        },
        take: 20,
        select: { id: true, participantName: true, channel: true, lastMessageAt: true, priority: true },
      }),
      db.contentApproval.count({ where: { status: 'pending' } }),
    ]);

    // Group by channel
    const byChannel: Record<string, number> = {};
    for (const conv of newConversations) {
      byChannel[conv.channel] = (byChannel[conv.channel] || 0) + 1;
    }

    const urgent = newConversations.filter((c) => c.priority === 'urgent' || c.priority === 'high');

    return NextResponse.json({
      success: true,
      summary: {
        generatedAt: new Date().toISOString(),
        scope: isAdmin ? 'all' : 'assigned',
        counselorId: auth.userId,
        overnight: {
          newConversations: newConversations.length,
          totalUnread: totalUnread._sum.unreadCount || 0,
          highPriority: urgent.length,
          byChannel,
        },
        pendingActions: {
          ocrReviewRequired: ocrPending,
          approvalsPending,
          overdueReplies: overdueConversations.length,
          contentApprovalsPending: contentPending,
        },
        topPriorityConversations: urgent.slice(0, 8).map((c) => ({
          id: c.id,
          name: c.participantName,
          channel: c.channel,
          priority: c.priority,
          lastMessage: c.lastMessageText?.substring(0, 100),
          lastAt: c.lastMessageAt,
          country: c.destinationCountry,
        })),
        overdueConversations: overdueConversations.slice(0, 5),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
