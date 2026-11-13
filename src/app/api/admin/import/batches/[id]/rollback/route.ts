import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  }
  const id = new URL(request.url).pathname.split('/').slice(-2, -1)[0];
  if (!id) return NextResponse.json({ success: false, error: 'Batch ID is required.' }, { status: 400 });
  try {
    type RollbackResult =
      | { kind: 'requested' }
      | { kind: 'missing' }
      | { kind: 'conflict'; status: string };
    const result: RollbackResult = await db.$transaction(async (tx): Promise<RollbackResult> => {
      const updated = await tx.importBatch.updateMany({
        where: { id, status: { in: ['completed', 'completed_with_errors'] } },
        data: { status: 'rollback_review_requested' },
      });
      if (updated.count !== 1) {
        const batch = await tx.importBatch.findUnique({ where: { id }, select: { status: true } });
        if (!batch) return { kind: 'missing' };
        return { kind: 'conflict', status: batch.status };
      }
      await tx.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: 'STUDENT_IMPORT_ROLLBACK_REVIEW_REQUESTED',
          batchId: id,
          beforeData: JSON.stringify({ status: 'completed_or_completed_with_errors' }),
          afterData: JSON.stringify({ status: 'rollback_review_requested', recordsDeleted: false }),
        },
      });
      return { kind: 'requested' };
    });
    if (result.kind === 'missing') return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
    if (result.kind === 'conflict') return NextResponse.json({ success: false, error: `Only a completed import can be sent for rollback review (current: ${result.status}).` }, { status: 409 });
    return NextResponse.json({
      success: true,
      status: 'rollback_review_requested',
      message: 'Rollback review requested. No student, application, document or history records were deleted.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Rollback review request could not be saved.' }, { status: 503 });
  }
});
