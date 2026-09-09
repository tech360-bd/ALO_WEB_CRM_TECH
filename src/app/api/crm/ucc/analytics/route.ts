// ============================================================
// /api/crm/ucc/analytics
// GET — Communication KPI dashboard for supervisors and admins
// Returns: conversation counts, channel breakdown, integration
//          health, approval metrics, OCR status
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalConversations,
      openConversations,
      closedConversations,
      messageCount,
      channelBreakdown,
      statusBreakdown,
      activeIntegrations,
      unresolvedErrors,
      ocrQueued,
      ocrReviewRequired,
      ocrCompleted,
      approvalsPending,
      approvalsApproved,
      contentPending,
    ] = await Promise.all([
      db.uccConversation.count({ where: { createdAt: { gte: since } } }),
      db.uccConversation.count({ where: { status: 'open' } }),
      db.uccConversation.count({ where: { status: 'closed', updatedAt: { gte: since } } }),
      db.uccMessage.count({ where: { createdAt: { gte: since } } }),
      db.uccConversation.groupBy({ by: ['channel'], _count: { id: true }, where: { createdAt: { gte: since } } }),
      db.uccConversation.groupBy({ by: ['status'], _count: { id: true } }),
      db.socialIntegration.count({ where: { status: 'connected' } }),
      db.providerErrorLog.count({ where: { resolved: false } }),
      db.ocrJob.count({ where: { status: 'queued' } }),
      db.ocrJob.count({ where: { status: 'review_required' } }),
      db.ocrJob.count({ where: { status: 'completed', updatedAt: { gte: since } } }),
      db.approvalRequest.count({ where: { status: 'pending' } }),
      db.approvalRequest.count({ where: { status: 'approved', updatedAt: { gte: since } } }),
      db.contentApproval.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        period: `${days}d`,
        since: since.toISOString(),
        conversations: {
          total: totalConversations,
          open: openConversations,
          closed: closedConversations,
          messages: messageCount,
          avgMessagesPerConv: totalConversations > 0 ? Math.round(messageCount / totalConversations) : 0,
          byChannel: Object.fromEntries(channelBreakdown.map((c) => [c.channel, c._count.id])),
          byStatus: Object.fromEntries(statusBreakdown.map((s) => [s.status, s._count.id])),
        },
        integrationHealth: {
          activeIntegrations,
          unresolvedErrors,
          healthScore: unresolvedErrors === 0 ? 100 : Math.max(0, 100 - unresolvedErrors * 10),
        },
        ocr: {
          queued: ocrQueued,
          reviewRequired: ocrReviewRequired,
          completed: ocrCompleted,
        },
        approvals: {
          pending: approvalsPending,
          approved: approvalsApproved,
          contentPending,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
