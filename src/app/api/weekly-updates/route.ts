import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { createWeeklyUpdateCheck } from '@/lib/university-course/unified-service';

// GET /api/weekly-updates — weekly AI update workflow per spec section 25
// Lists update requests with status PENDING_REVIEW, APPROVED, REJECTED, etc
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const status = req.nextUrl.searchParams.get('status') || 'PENDING_REVIEW';
    const targetType = req.nextUrl.searchParams.get('targetType');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);

    const where: any = {};
    if (status !== 'all') where.status = status;
    if (targetType) where.targetType = targetType;

    const [weeklyUpdates, universityUpdates] = await Promise.all([
      db.weeklyUpdateRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []),
      db.universityUpdateRequest.findMany({ where: { status: status === 'PENDING_REVIEW' ? 'pending_approval' : status }, orderBy: { createdAt: 'desc' }, take: limit }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      weeklyUpdates,
      universityUpdates,
      total: weeklyUpdates.length + universityUpdates.length,
      message: 'Weekly AI update workflow: checks official university/course/scholarship pages, compares with DB, creates update_request with old/new value, source URL, evidence, status PENDING_REVIEW. Super Admin can Approve/Reject/Edit/Merge Duplicate. Never automatically publish sensitive changes.',
    });
  } catch (err: any) {
    console.error('[weekly-updates.list] error', err);
    return NextResponse.json({ error: 'Failed to list weekly updates', detail: err.message }, { status: 500 });
  }
}

// POST /api/weekly-updates — create update request (AI agent or system)
// Body: targetType, targetId, targetName, fieldName, oldValue, newValue, sourceUrl, evidence, aiConfidence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType, targetId, targetName, fieldName, oldValue = '', newValue = '', sourceUrl = '', evidence = '', aiConfidence = 0.9 } = body;

    if (!targetType || !targetId || !targetName || !fieldName || !newValue) {
      return NextResponse.json({ error: 'targetType, targetId, targetName, fieldName, newValue required' }, { status: 400 });
    }

    const request = await createWeeklyUpdateCheck(targetType, targetId, targetName, fieldName, oldValue, newValue, sourceUrl, evidence, aiConfidence);

    if (!request) return NextResponse.json({ error: 'Failed to create update request' }, { status: 500 });

    return NextResponse.json({ success: true, updateRequest: request, message: 'Update request created with status PENDING_REVIEW — super admin must approve' }, { status: 201 });
  } catch (err: any) {
    console.error('[weekly-updates.create] error', err);
    return NextResponse.json({ error: 'Failed to create update request', detail: err.message }, { status: 500 });
  }
}
