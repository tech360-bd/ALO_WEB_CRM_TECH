import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Approve / reject an AI reply draft by ID.
 * Path: POST /api/marketing/ai-reply-drafts/{id}/approve
 *       POST /api/marketing/ai-reply-drafts/{id}/reject
 * Body for reject: { reason }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Determine action from URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const action = lastSegment === 'reject' ? 'reject' : 'approve';

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // body may be empty for approve
    }

    const existing = await db.aiReplyDraft.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (existing.approvalStatus !== 'pending') {
      return NextResponse.json(
        { error: `Draft already ${existing.approvalStatus}` },
        { status: 409 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const draft = await db.aiReplyDraft.update({
      where: { id },
      data: {
        approvalStatus: newStatus,
        approvedById: auth.user.id,
        approvedAt: new Date(),
      },
    });

    await logAudit({
      userId: auth.user.id,
      action:
        action === 'approve' ? 'ai_reply.draft_approved' : 'ai_reply.draft_rejected',
      module: 'marketing',
      recordId: draft.id,
      oldData: existing,
      newData: { ...draft, reason: reason || null },
      reason: reason || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ draft, action: newStatus });
  } catch (error) {
    console.error('marketing/ai-reply-drafts/[id] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
