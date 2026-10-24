import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  const id = new URL(request.url).pathname.split('/').slice(-2, -1)[0];
  if (!id) return NextResponse.json({ success: false, error: 'Batch ID is required.' }, { status: 400 });

  try {
    type ApprovalResult =
      | { kind: 'approved'; batch: unknown }
      | { kind: 'missing' }
      | { kind: 'conflict'; status: string };
    const result: ApprovalResult = await db.$transaction(async (tx): Promise<ApprovalResult> => {
      const updated = await tx.importBatch.updateMany({
        where: { id, status: 'ready_for_review' },
        data: { status: 'approved' },
      });
      if (updated.count !== 1) {
        const current = await tx.importBatch.findUnique({ where: { id }, select: { status: true } });
        if (!current) return { kind: 'missing' };
        return { kind: 'conflict', status: current.status };
      }
      await tx.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: 'STUDENT_IMPORT_APPROVED',
          batchId: id,
          afterData: JSON.stringify({ status: 'approved' }),
        },
      });
      const batch = await tx.importBatch.findUnique({ where: { id } });
      return { kind: 'approved', batch };
    });
    if (result.kind === 'missing') return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
    if (result.kind === 'conflict') return NextResponse.json({ success: false, error: `Only a batch ready for review can be approved (current: ${result.status}).` }, { status: 409 });
    return NextResponse.json({ success: true, batch: result.batch });
  } catch {
    return NextResponse.json({ success: false, error: 'Import batch approval could not be saved.' }, { status: 503 });
  }
});
