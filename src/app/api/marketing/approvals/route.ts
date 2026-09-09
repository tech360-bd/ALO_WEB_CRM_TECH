import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/marketing/audit';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

// ─── GET: List approvals with filters and pagination ─────────────────────────

export const GET = withAuth(async (request: Request, _auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const itemType = searchParams.get('itemType') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (itemType) where.itemType = itemType;

    const [approvals, total] = await Promise.all([
      db.marketingApproval.findMany({
        where,
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.marketingApproval.count({ where }),
    ]);

    return NextResponse.json({
      approvals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Approvals list error:', error);
    return NextResponse.json(
      { error: 'Failed to load approvals' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── POST: Approve or reject ─────────────────────────────────────────────────

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const body = await request.json();

    if (action === 'approve') {
      return handleApprove(body, auth);
    }
    if (action === 'reject') {
      return handleReject(body, auth);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=approve or ?action=reject' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Approvals POST error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, MARKETING_AUTH);

// ─── Approve ──────────────────────────────────────────────────────────────────

interface ApproveInput {
  approvalId: string;
}

async function handleApprove(body: ApproveInput, auth: AuthContext) {
  const { approvalId } = body;
  const reviewedById = auth.userId;

  if (!approvalId) {
    return NextResponse.json(
      { error: 'approvalId is required' },
      { status: 400 }
    );
  }

  const approval = await db.marketingApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    return NextResponse.json(
      { error: 'Approval not found' },
      { status: 404 }
    );
  }

  if (approval.status !== 'pending') {
    return NextResponse.json(
      { error: `Approval is already ${approval.status}` },
      { status: 400 }
    );
  }

  const now = new Date();

  const updatedApproval = await db.marketingApproval.update({
    where: { id: approvalId },
    data: {
      status: 'approved',
      reviewedById,
      reviewedAt: now,
    },
  });

  try {
    if (approval.itemType === 'MarketingCampaign') {
      await db.marketingCampaign.update({
        where: { id: approval.itemId },
        data: { status: 'approved', approvedById: reviewedById, approvedAt: now },
      });
    } else if (approval.itemType === 'MarketingGeneratedContent') {
      await db.marketingGeneratedContent.update({
        where: { id: approval.itemId },
        data: { status: 'approved', approvedById: reviewedById, approvedAt: now },
      });
    } else if (approval.itemType === 'MarketingVideo') {
      await db.marketingVideo.update({
        where: { id: approval.itemId },
        data: { status: 'approved', approvedById: reviewedById, approvedAt: now },
      });
    }
  } catch {
    console.warn(`Could not update related item ${approval.itemType}:${approval.itemId}`);
  }

  await createAuditLog({
    userId: reviewedById,
    role: auth.roles[0] || 'marketing',
    action: 'approval.approve',
    resource: 'MarketingApproval',
    resourceId: approvalId,
    details: { itemType: approval.itemType, itemId: approval.itemId, title: approval.title },
  });

  return NextResponse.json({ approval: updatedApproval });
}

// ─── Reject ───────────────────────────────────────────────────────────────────

interface RejectInput {
  approvalId: string;
  rejectionNote?: string;
}

async function handleReject(body: RejectInput, auth: AuthContext) {
  const { approvalId, rejectionNote = '' } = body;
  const reviewedById = auth.userId;

  if (!approvalId) {
    return NextResponse.json(
      { error: 'approvalId is required' },
      { status: 400 }
    );
  }

  const approval = await db.marketingApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    return NextResponse.json(
      { error: 'Approval not found' },
      { status: 404 }
    );
  }

  if (approval.status !== 'pending') {
    return NextResponse.json(
      { error: `Approval is already ${approval.status}` },
      { status: 400 }
    );
  }

  const updatedApproval = await db.marketingApproval.update({
    where: { id: approvalId },
    data: {
      status: 'rejected',
      reviewedById,
      reviewedAt: new Date(),
      rejectionNote,
    },
  });

  try {
    if (approval.itemType === 'MarketingGeneratedContent') {
      await db.marketingGeneratedContent.update({
        where: { id: approval.itemId },
        data: {
          status: 'rejected',
          rejectedById: reviewedById,
          rejectedAt: new Date(),
          rejectionReason: rejectionNote,
        },
      });
    }
  } catch {
    console.warn(`Could not update related item ${approval.itemType}:${approval.itemId}`);
  }

  await createAuditLog({
    userId: reviewedById,
    role: auth.roles[0] || 'marketing',
    action: 'approval.reject',
    resource: 'MarketingApproval',
    resourceId: approvalId,
    details: { itemType: approval.itemType, itemId: approval.itemId, rejectionNote },
  });

  return NextResponse.json({ approval: updatedApproval });
}
