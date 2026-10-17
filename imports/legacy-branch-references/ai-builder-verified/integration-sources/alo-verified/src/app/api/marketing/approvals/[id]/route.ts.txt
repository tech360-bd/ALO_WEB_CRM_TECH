import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMarketingManager } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * Approve / reject an ApprovalRequest by ID.
 * Path: POST /api/marketing/approvals/{id}/approve
 *       POST /api/marketing/approvals/{id}/reject
 * Body for reject: { note }
 * - For marketing_* request types, marketing_manager can approve.
 * - super_admin / admin can approve all.
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

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const action = lastSegment === 'reject' ? 'reject' : 'approve';

    let note: string | undefined;
    try {
      const body = await request.json();
      note = body.note || body.reason;
    } catch {
      // body may be empty
    }

    const existing = await db.approvalRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: `Approval already ${existing.status}` },
        { status: 409 }
      );
    }

    const userRoles = auth.user.roles?.map((r: { name: string }) => r.name) ?? [];
    const isSuperAdmin =
      userRoles.includes('super_admin') || userRoles.includes('admin');

    // For non-marketing request types, require super_admin
    const isMarketingType =
      existing.requestType?.startsWith('marketing_') ||
      existing.requestType?.startsWith('ai_reply') ||
      existing.requestType?.startsWith('social_post') ||
      existing.requestType?.startsWith('broadcast') ||
      existing.requestType?.startsWith('bulk_whatsapp');

    if (!isMarketingType && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: 'Forbidden — only super_admin can approve non-marketing requests',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const approval = await db.approvalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        currentApproverId: auth.user.id,
        reviewerNote: note || null,
        decidedAt: new Date(),
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: action === 'approve' ? 'approval.approved' : 'approval.rejected',
      module: 'marketing',
      recordId: approval.id,
      oldData: existing,
      newData: { ...approval, note: note || null },
      reason: note || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ approval, action: newStatus });
  } catch (error) {
    console.error('marketing/approvals/[id] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
