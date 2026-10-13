import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingAccess, requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * AI reply draft manager.
 * - GET: list drafts (filterable by approvalStatus). Marketing access (any role).
 * - POST: create draft. Marketing_executive can draft; manager/admin can also draft.
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const approvalStatus = searchParams.get('approvalStatus');
    const communicationType = searchParams.get('communicationType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const where: Record<string, unknown> = {};
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (communicationType) where.communicationType = communicationType;

    const skip = (page - 1) * limit;
    const [drafts, total] = await Promise.all([
      db.aiReplyDraft.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.aiReplyDraft.count({ where }),
    ]);

    await logAudit({
      userId: auth.user.id,
      action: 'ai_reply.draft_listed',
      module: 'marketing',
      newData: { filters: { approvalStatus, communicationType }, total },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      drafts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('marketing/ai-reply-drafts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingAccess(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { communicationType, communicationId, draftBody, promptContext, riskFlags } = body;

    if (!communicationType || !communicationId || !draftBody) {
      return NextResponse.json(
        {
          error: 'communicationType, communicationId, and draftBody are required',
        },
        { status: 400 }
      );
    }
    if (!['message', 'social_inbox', 'whatsapp'].includes(communicationType)) {
      return NextResponse.json(
        {
          error:
            'communicationType must be one of: message, social_inbox, whatsapp',
        },
        { status: 400 }
      );
    }

    const draft = await db.aiReplyDraft.create({
      data: {
        communicationType,
        communicationId,
        draftBody,
        promptContext: promptContext ? JSON.stringify(promptContext) : null,
        riskFlags: riskFlags ? JSON.stringify(riskFlags) : null,
        approvalStatus: 'pending',
        createdById: auth.user.id,
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'ai_reply.draft_generated',
      module: 'marketing',
      recordId: draft.id,
      newData: draft,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error('marketing/ai-reply-drafts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Inline approve/reject via action body (so frontend can use single URL)
export async function PUT(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { action, id, reason } = body;

    if (!action || !id) {
      return NextResponse.json({ error: 'action and id are required' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
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
      action: action === 'approve' ? 'ai_reply.draft_approved' : 'ai_reply.draft_rejected',
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
    console.error('marketing/ai-reply-drafts PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
