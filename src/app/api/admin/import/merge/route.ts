import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { validateMergeDecisions } from '@/lib/import-merge-engine';

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const { stagedId, matchedStudentId, decisions } = body || {};
  if (typeof stagedId !== 'string' || typeof matchedStudentId !== 'string' || !decisions || typeof decisions !== 'object' || Array.isArray(decisions)) {
    return NextResponse.json({ success: false, error: 'stagedId, matchedStudentId and field decisions are required.' }, { status: 400 });
  }

  try {
    const staged = await db.importStagingStudent.findUnique({ where: { id: stagedId } });
    if (!staged) return NextResponse.json({ success: false, error: 'Staged row not found.' }, { status: 404 });
    if (staged.status !== 'possible_duplicate' || !staged.matchedStudentId || staged.matchedStudentId !== matchedStudentId) {
      return NextResponse.json({ success: false, error: 'Merge target must match the staged duplicate suggestion.' }, { status: 409 });
    }
    const batch = await db.importBatch.findUnique({ where: { id: staged.batchId }, select: { id: true, status: true } });
    if (!batch || batch.status !== 'ready_for_review') {
      return NextResponse.json({ success: false, error: 'Merge decisions can be changed only while the batch is awaiting review.' }, { status: 409 });
    }
    const existing = await db.student.findUnique({ where: { id: matchedStudentId } });
    if (!existing) return NextResponse.json({ success: false, error: 'Matched student not found.' }, { status: 404 });

    // These are the only fields the executor currently knows how to apply.
    const allowedFields = new Set(['studentName', 'email', 'phone', 'countryInterest']);
    const entries = Object.entries(decisions as Record<string, unknown>);
    if (!entries.length || entries.some(([field, value]) => !allowedFields.has(field) || !['KEEP_EXISTING', 'USE_IMPORTED', 'SKIP'].includes(String(value)))) {
      return NextResponse.json({ success: false, error: 'Only supported student identity/interest fields and merge decisions are allowed.' }, { status: 400 });
    }
    const comparisons = entries.map(([field, decision]) => ({
      field,
      existingValue: field === 'studentName' ? existing.name : (existing as any)[field],
      importedValue: (staged as any)[field],
      existingSource: 'ALO',
      importedSource: 'OLD_CRM',
      lastUpdatedExisting: String(existing.updatedAt || ''),
      conflict: true,
      decision: String(decision),
    }));
    const validation = validateMergeDecisions(comparisons as any);
    if (!validation.ok) return NextResponse.json({ success: false, error: validation.errors.join('; ') }, { status: 400 });

    await db.$transaction(async (tx) => {
      const currentBatch = await tx.importBatch.findUnique({ where: { id: staged.batchId }, select: { status: true } });
      if (currentBatch?.status !== 'ready_for_review') throw new Error('The batch is no longer awaiting review.');
      const changed = await tx.importStagingStudent.updateMany({
        where: { id: stagedId, status: 'possible_duplicate', matchedStudentId },
        data: {
          status: 'merged',
          errorDetails: JSON.stringify({ decisions, actor: auth.userId, at: new Date().toISOString() }),
        },
      });
      if (changed.count !== 1) throw new Error('The staged duplicate changed; reload the preview before saving.');
      await tx.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: 'STUDENT_IMPORT_MERGE_DECIDED',
          targetId: matchedStudentId,
          batchId: staged.batchId,
          beforeData: JSON.stringify({ stagedId, matchedStudentId }),
          afterData: JSON.stringify(decisions),
        },
      });
    });
    return NextResponse.json({ success: true, message: 'Explicit field decisions saved. They apply only after the separately approved batch is executed.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Merge decision could not be saved.' }, { status: 503 });
  }
});
