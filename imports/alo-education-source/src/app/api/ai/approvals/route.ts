import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const submitDecisionSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  decision: z.enum(['APPROVED', 'REJECTED', 'EDITED', 'ESCALATED']),
  reviewerNote: z.string().max(2000).optional(),
  // For EDITED decision, provide the corrected action
  correctedAction: z.string().max(10000).optional(),
});

// GET /api/ai/approvals — list pending approvals with pagination & filters
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get('status') ?? 'PENDING';
    const riskLevel = req.nextUrl.searchParams.get('riskLevel');
    const department = req.nextUrl.searchParams.get('department');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (department) where.department = department;

    const [approvals, total] = await Promise.all([
      db.approvalItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.approvalItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      approvals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List approvals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list approvals.' },
      { status: 500 },
    );
  }
}

// POST /api/ai/approvals — submit an approval decision
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = submitDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { approvalId, decision, reviewerNote, correctedAction } = parsed.data;

    // Find and validate the approval item
    const existing = await db.approvalItem.findUnique({ where: { id: approvalId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Approval item not found.' },
        { status: 404 },
      );
    }

    if (existing.status !== 'PENDING' && existing.status !== 'ESCALATED') {
      return NextResponse.json(
        { success: false, error: `Cannot decide on an approval with status: ${existing.status}.` },
        { status: 409 },
      );
    }

    // If EDITED, correctedAction is required
    if (decision === 'EDITED' && !correctedAction) {
      return NextResponse.json(
        { success: false, error: 'correctedAction is required when decision is EDITED.' },
        { status: 400 },
      );
    }

    const approval = await db.approvalItem.update({
      where: { id: approvalId },
      data: {
        status: decision,
        reviewerId: auth.user.id,
        reviewerNote: reviewerNote ?? null,
        reviewedAt: new Date(),
      },
    });

    // If the approval is linked to a task, update the task's approval state
    if (existing.taskId) {
      await db.aiTask.update({
        where: { id: existing.taskId },
        data: {
          approvalState: decision,
          approverId: auth.user.id,
          approvedAt: new Date(),
          approvalNote: reviewerNote ?? null,
          ...(decision === 'APPROVED' ? { status: 'COMPLETED' } : {}),
          ...(decision === 'REJECTED' ? { status: 'FAILED' } : {}),
          ...(decision === 'EDITED' && correctedAction
            ? { result: correctedAction, status: 'COMPLETED' }
            : {}),
          ...(decision === 'ESCALATED' ? { status: 'ESCALATED' } : {}),
        },
      });
    }

    await auditLog({
      userId: auth.user.id,
      action: `APPROVAL_${decision}`,
      resource: 'ApprovalItem',
      resourceId: approval.id,
      details: {
        approvalId,
        decision,
        taskId: existing.taskId,
        agentId: existing.agentId,
        riskLevel: existing.riskLevel,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, approval });
  } catch (error) {
    console.error('Submit approval decision error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit approval decision.' },
      { status: 500 },
    );
  }
}
