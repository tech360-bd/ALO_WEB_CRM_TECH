import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patchApprovalSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EDITED', 'ESCALATED']).optional(),
  reviewerNote: z.string().max(2000).nullable().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  proposedAction: z.string().max(10000).optional(),
  reason: z.string().max(5000).nullable().optional(),
  evidence: z.string().max(10000).nullable().optional(),
});

// GET /api/ai/approvals/[id] — single approval detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const approval = await db.approvalItem.findUnique({
      where: { id },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval item not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, approval });
  } catch (error) {
    console.error('Get approval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get approval.' },
      { status: 500 },
    );
  }
}

// PATCH /api/ai/approvals/[id] — update approval
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const existing = await db.approvalItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Approval item not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = patchApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
      // If transitioning from PENDING/ESCALATED to a final state, set reviewer
      if (
        (existing.status === 'PENDING' || existing.status === 'ESCALATED') &&
        ['APPROVED', 'REJECTED', 'EDITED'].includes(data.status)
      ) {
        updateData.reviewerId = auth.user.id;
        updateData.reviewedAt = new Date();
      }
    }
    if (data.reviewerNote !== undefined) updateData.reviewerNote = data.reviewerNote;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.proposedAction !== undefined) updateData.proposedAction = data.proposedAction;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.evidence !== undefined) updateData.evidence = data.evidence;

    const approval = await db.approvalItem.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE_APPROVAL_ITEM',
      resource: 'ApprovalItem',
      resourceId: approval.id,
      details: {
        changedFields: Object.keys(updateData),
        previousStatus: existing.status,
        newStatus: approval.status,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, approval });
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update approval.' },
      { status: 500 },
    );
  }
}
