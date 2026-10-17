import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Cross-cutting approval queue.
 * - GET: list ApprovalRequest (filterable by status, requestType).
 * - POST: create approval request (any authenticated marketing user).
 */
export async function GET(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('requestType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      db.approvalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.approvalRequest.count({ where }),
    ]);

    await logAudit({
      userId: auth.user.id,
      action: 'approval.listed',
      module: 'marketing',
      newData: { filters: { status, requestType }, total },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('marketing/approvals GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authOrResponse = await requireMarketingManager(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const body = await request.json();
    const { requestType, entityId, entityType, payload, requestedById } = body;

    if (!requestType) {
      return NextResponse.json(
        { error: 'requestType is required' },
        { status: 400 }
      );
    }

    const approval = await db.approvalRequest.create({
      data: {
        requestType,
        entityId: entityId || null,
        entityType: entityType || null,
        payload: payload ? JSON.stringify(payload) : null,
        requestedById: requestedById || auth.user.id,
        status: 'pending',
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'approval.requested',
      module: 'marketing',
      recordId: approval.id,
      newData: approval,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    console.error('marketing/approvals POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
